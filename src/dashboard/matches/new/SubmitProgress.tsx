import type { ReactNode } from 'react'
import { formatBytes, formatPercent } from '@/lib/format'
import { Button, FormError } from '../../ui'
import { AlertIcon, CheckIcon, CloseIcon, RefreshIcon } from '../../ui/icons'
import type { VideoDraft } from './draft'
import type { Submission, VideoUploadStatus } from './useMatchSubmission'

type SubmitProgressProps = {
  submission: Submission
  videos: VideoDraft[]
  matchLabel: string
  onRetryVideo: (key: string) => void
}

type Tone = 'busy' | 'done' | 'error' | 'idle'

function StatusIcon({ tone }: { tone: Tone }) {
  const base = 'flex size-9 shrink-0 items-center justify-center rounded-lg'
  if (tone === 'done') {
    return (
      <span className={`${base} bg-coyote-gold text-coyote-black`}>
        <CheckIcon className="size-5" strokeWidth={2} />
      </span>
    )
  }
  if (tone === 'error') {
    return (
      <span className={`${base} bg-coyote-orange/15 text-coyote-orange`}>
        <AlertIcon className="size-5" />
      </span>
    )
  }
  if (tone === 'busy') {
    return (
      <span className={`${base} bg-coyote-ember text-coyote-gold`}>
        <RefreshIcon className="size-5 animate-spin" />
      </span>
    )
  }
  return (
    <span className={`${base} bg-coyote-black text-coyote-ash`}>
      <CloseIcon className="size-4.5" />
    </span>
  )
}

function Row({ tone, title, detail, children }: { tone: Tone; title: string; detail: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex flex-col gap-2.5 rounded-xl bg-coyote-black/60 p-3 shadow-border">
      <div className="flex items-center gap-3">
        <StatusIcon tone={tone} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-coyote-silver">{title}</span>
          <span className="text-xs text-coyote-ash tabular-nums">{detail}</span>
        </div>
      </div>
      {children}
    </li>
  )
}

const VIDEO_TONE: Record<VideoUploadStatus, Tone> = {
  queued: 'idle',
  uploading: 'busy',
  done: 'done',
  error: 'error',
  cancelled: 'idle',
}

/** Paso final: guardado del partido y progreso de cada video. */
export function SubmitProgress({ submission, videos, matchLabel, onRetryVideo }: SubmitProgressProps) {
  const { phase, match } = submission
  const matchTone: Tone = match ? 'done' : phase === 'save-error' ? 'error' : 'busy'
  const matchDetail = match ? 'Guardado' : phase === 'save-error' ? 'No se pudo guardar' : 'Guardando…'

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2" aria-live="polite">
        <Row tone={matchTone} title={matchLabel} detail={matchDetail} />

        {videos.map((video) => {
          const upload = submission.uploads[video.key] ?? { status: 'queued', loaded: 0, error: null }
          const ratio = video.file.size ? upload.loaded / video.file.size : 0
          const detail: Record<VideoUploadStatus, string> = {
            queued: `En cola · ${formatBytes(video.file.size)}`,
            uploading: `${formatPercent(ratio)} · ${formatBytes(upload.loaded)} de ${formatBytes(video.file.size)}`,
            done: `Subido · ${formatBytes(video.file.size)}`,
            error: 'Error en la subida',
            cancelled: 'Cancelado',
          }
          const canRetry = match && (upload.status === 'error' || upload.status === 'cancelled') && phase === 'finished'
          return (
            <Row key={video.key} tone={VIDEO_TONE[upload.status]} title={video.title} detail={detail[upload.status]}>
              {upload.status === 'uploading' && (
                <div
                  role="progressbar"
                  aria-label={`Subida de ${video.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.floor(ratio * 100)}
                  className="h-1.5 overflow-hidden rounded-full bg-coyote-steel/70"
                >
                  <div
                    className="h-full origin-left rounded-full bg-coyote-gold transition-transform duration-300 ease-out"
                    style={{ transform: `scaleX(${ratio})` }}
                  />
                </div>
              )}
              {upload.error && <p className="text-xs text-coyote-orange">{upload.error}</p>}
              {canRetry && (
                <Button size="sm" className="self-start pr-3.5 pl-3" onClick={() => onRetryVideo(video.key)}>
                  <RefreshIcon className="size-4" strokeWidth={2} />
                  Reintentar
                </Button>
              )}
            </Row>
          )
        })}
      </ol>

      {submission.error && <FormError>{submission.error}</FormError>}
    </div>
  )
}
