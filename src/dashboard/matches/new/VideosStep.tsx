import { useState, type DragEvent, type FormEvent } from 'react'
import { MAX_SETS } from '@shared/domain'
import { formatBytes } from '@/lib/format'
import { Button, Field, FormError, Input, Select } from '../../ui'
import { FilmIcon, TrashIcon, UploadIcon } from '../../ui/icons'
import { VIDEO_ACCEPT, videoDraftFrom, videoFileError, type Errors, type VideoDraft } from './draft'

type VideosStepProps = {
  formId: string
  videos: VideoDraft[]
  errors: Errors
  onChange: (videos: VideoDraft[]) => void
  onSubmit: () => void
}

const SET_OPTIONS = Array.from({ length: MAX_SETS }, (_, index) => index + 1)

/** Paso 3 (opcional): elegir videos, ponerles título y decir a qué set corresponden. */
export function VideosStep({ formId, videos, errors, onChange, onSubmit }: VideosStepProps) {
  const [rejected, setRejected] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)

  function addFiles(files: FileList | null) {
    if (!files?.length) return
    const problems: string[] = []
    const added: VideoDraft[] = []
    for (const file of Array.from(files)) {
      const problem = videoFileError(file)
      if (problem) problems.push(problem)
      else added.push(videoDraftFrom(file))
    }
    setRejected(problems)
    if (added.length) onChange([...videos, ...added])
  }

  const update = (key: string, patch: Partial<VideoDraft>) =>
    onChange(videos.map((video) => (video.key === key ? { ...video, ...patch } : video)))

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-coyote-ash">
        Opcional. Se suben al guardar, directamente al almacenamiento del equipo. Mantén esta ventana abierta hasta que
        terminen.
      </p>

      <label
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center',
          'transition-[background-color,border-color] duration-150 ease-out',
          'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coyote-gold',
          dragging
            ? 'border-coyote-gold bg-coyote-ember/60'
            : 'border-coyote-steel hover:border-coyote-rust hover:bg-coyote-ember/30',
        ].join(' ')}
      >
        <input
          data-autofocus
          type="file"
          multiple
          accept={VIDEO_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files)
            // Permite volver a elegir el mismo archivo tras quitarlo.
            event.target.value = ''
          }}
        />
        <UploadIcon className="size-6 text-coyote-gold" />
        <span className="font-medium text-coyote-silver">Elegir videos</span>
        <span className="text-xs text-coyote-ash">MP4, MOV, M4V, WEBM o MKV. También puedes arrastrarlos aquí.</span>
      </label>

      {rejected.length > 0 && (
        <FormError>
          {rejected.map((problem) => (
            <span key={problem} className="block">
              {problem}
            </span>
          ))}
        </FormError>
      )}

      {videos.length > 0 && (
        <ol className="flex flex-col gap-2" aria-label="Videos elegidos">
          {videos.map((video, index) => (
            <li key={video.key} className="flex flex-col gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-coyote-ember text-coyote-ash">
                  <FilmIcon className="size-4.5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-coyote-silver">{video.file.name}</span>
                  <span className="text-xs text-coyote-ash tabular-nums">{formatBytes(video.file.size)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${video.file.name}`}
                  className="-mr-1"
                  onClick={() => onChange(videos.filter((item) => item.key !== video.key))}
                >
                  <TrashIcon className="size-4.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <Field label={`Título del video ${index + 1}`} error={errors[video.key]}>
                  <Input
                    value={video.title}
                    maxLength={120}
                    onChange={(event) => update(video.key, { title: event.target.value })}
                  />
                </Field>
                <Field label="Parte">
                  <Select
                    value={video.setNumber ?? ''}
                    onChange={(event) =>
                      update(video.key, { setNumber: event.target.value ? Number(event.target.value) : null })
                    }
                  >
                    <option value="">Partido / otro</option>
                    {SET_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        Set {n}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </li>
          ))}
        </ol>
      )}
    </form>
  )
}
