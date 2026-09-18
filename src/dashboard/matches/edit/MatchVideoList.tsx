import { useState, type FormEvent } from 'react'
import type { Video } from '@shared/schemas'
import { formatBytes } from '@/lib/format'
import { errorMessage } from '../../admin/adminApi'
import { Button, Field, Input } from '../../ui'
import { FilmIcon, PencilIcon, TrashIcon } from '../../ui/icons'
import { videoLabel } from '../matchLabels'
import { SetSelect } from '../new/VideosStep'

type AdminPost = <T>(path: string, body: unknown) => Promise<T>

type MatchVideoListProps = {
  videos: Video[]
  post: AdminPost
  onUpdated: (video: Video) => void
  onDeleted: (videoId: string) => void
  /** Hay una operación en marcha (una fila o una subida): el diálogo no se puede cerrar. */
  onBusyChange: (busy: boolean) => void
  disabled?: boolean
}

/** Videos ya subidos del partido: cambiar título y set, o eliminarlos (también del bucket). */
export function MatchVideoList({ videos, post, onUpdated, onDeleted, onBusyChange, disabled }: MatchVideoListProps) {
  if (videos.length === 0) {
    return <p className="rounded-md bg-paper-deep/30 p-3 text-sm text-ink-soft shadow-outline">Todavía no hay videos.</p>
  }
  return (
    <ol className="flex flex-col gap-2" aria-label="Videos del partido">
      {videos.map((video) => (
        <VideoRow
          key={video.id}
          video={video}
          post={post}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
          onBusyChange={onBusyChange}
          disabled={disabled}
        />
      ))}
    </ol>
  )
}

type Mode = 'view' | 'edit' | 'confirm-delete'

type VideoRowProps = Omit<MatchVideoListProps, 'videos'> & { video: Video }

function VideoRow({ video, post, onUpdated, onDeleted, onBusyChange, disabled }: VideoRowProps) {
  const [mode, setMode] = useState<Mode>('view')
  const [title, setTitle] = useState(video.title)
  const [setNumber, setSetNumber] = useState(video.set_number)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBucket = video.source === 'bucket'
  const details = [
    videoLabel(video),
    video.size_bytes ? formatBytes(video.size_bytes) : null,
    isBucket ? null : 'Enlace externo',
  ].filter(Boolean)

  function switchTo(next: Mode) {
    setMode(next)
    setError(null)
    setTitleError(null)
    setTitle(video.title)
    setSetNumber(video.set_number)
  }

  async function run(operation: () => Promise<void>) {
    setBusy(true)
    onBusyChange(true)
    setError(null)
    try {
      await operation()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }

  function handleSave(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return setTitleError('Ponle un título al video')
    setTitleError(null)
    if (trimmed === video.title && setNumber === video.set_number) return setMode('view')
    void run(async () => {
      onUpdated(await post<Video>('/video-update', { id: video.id, title: trimmed, set_number: setNumber }))
      setMode('view')
    })
  }

  function handleDelete() {
    void run(async () => {
      await post('/video-delete', { id: video.id })
      onDeleted(video.id)
    })
  }

  const locked = disabled || busy

  return (
    <li className="flex flex-col gap-3 rounded-md bg-paper-deep/40 p-3 shadow-outline">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-paper-deep text-ink-soft">
          <FilmIcon className="size-4.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink">{video.title}</span>
          <span className="text-xs text-ink-soft tabular-nums">{details.join(' · ')}</span>
        </div>
        {mode === 'view' && (
          <div className="-mr-1 flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${video.title}`}
              disabled={locked}
              onClick={() => switchTo('edit')}
            >
              <PencilIcon className="size-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Eliminar ${video.title}`}
              disabled={locked}
              onClick={() => switchTo('confirm-delete')}
            >
              <TrashIcon className="size-4.5" />
            </Button>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <Field label="Título" error={titleError}>
              <Input autoFocus value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Parte">
              <SetSelect value={setNumber} onChange={setSetNumber} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => switchTo('view')}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={locked}>
              {busy ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}

      {mode === 'confirm-delete' && (
        <div className="flex flex-col gap-3 rounded-sm bg-danger/12 p-3">
          <p className="text-sm text-ink">
            {isBucket
              ? 'Se borra el video del partido y su archivo del almacenamiento. No se puede deshacer.'
              : 'Se quita el enlace del partido. El video externo no se toca.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => switchTo('view')}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" disabled={locked} onClick={handleDelete}>
              {busy ? 'Eliminando…' : 'Eliminar video'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger-deep">
          {error}
        </p>
      )}
    </li>
  )
}
