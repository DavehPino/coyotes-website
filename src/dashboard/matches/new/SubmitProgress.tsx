import type { ReactNode } from 'react'
import { formatBytes, formatPercent } from '@/lib/format'
import { Button, FormError } from '../../ui'
import { AlertIcon, CheckIcon, CloseIcon, RefreshIcon } from '../../ui/icons'
import type { VideoDraft } from './draft'
import type { Submission } from './useMatchSubmission'
import { QUEUED, type VideoUploads, type VideoUploadStatus } from './useVideoUploads'

type SubmitProgressProps = {
  submission: Submission
  videos: VideoDraft[]
  matchLabel: string
  onRetryVideo: (key: string) => void
}

type Tone = 'busy' | 'done' | 'error' | 'idle'

function StatusIcon({ tone }: { tone: Tone }) {
  const base = 'flex size-9 shrink-0 items-center justify-center rounded-sm'
  if (tone === 'done') {
    return (
      <span className={`${base} bg-ink text-club`}>
        <CheckIcon className="size-5" strokeWidth={2} />
      </span>
    )
  }
  if (tone === 'error') {
    return (
      <span className={`${base} bg-antenna/12 text-antenna-deep`}>
        <AlertIcon className="size-5" />
      </span>
    )
  }
  if (tone === 'busy') {
    return (
      <span className={`${base} bg-floor-deep text-ink`}>
        <RefreshIcon className="size-5 animate-spin motion-reduce:animate-none" />
      </span>
    )
  }
  return (
    <span className={`${base} bg-line text-ink-soft`}>
      <CloseIcon className="size-4.5" />
    </span>
  )
}

function Row({ tone, title, detail, children }: { tone: Tone; title: string; detail: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex flex-col gap-2.5 rounded-md bg-floor-deep/40 p-3 shadow-tape">
      <div className="flex items-center gap-3">
        <StatusIcon tone={tone} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-ink">{title}</span>
          <span className="text-xs text-ink-soft tabular-nums">{detail}</span>
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
        <VideoUploadRows
          videos={videos}
          uploads={submission.uploads}
          canRetry={match !== null && phase === 'finished'}
          onRetryVideo={onRetryVideo}
        />
      </ol>

      {submission.error && <FormError>{submission.error}</FormError>}
    </div>
  )
}

type VideoUploadRowsProps = {
  videos: VideoDraft[]
  uploads: VideoUploads
  /** Muestra "Reintentar" en los videos que fallaron o se cancelaron. */
  canRetry: boolean
  onRetryVideo: (key: string) => void
}

/** Filas `<li>` con el estado y el progreso de cada video; van dentro de un `<ol>` de quien las usa. */
export function VideoUploadRows({ videos, uploads, canRetry, onRetryVideo }: VideoUploadRowsProps) {
  return videos.map((video) => {
    const upload = uploads[video.key] ?? QUEUED
    const ratio = video.file.size ? upload.loaded / video.file.size : 0
    const detail: Record<VideoUploadStatus, string> = {
      queued: `En cola · ${formatBytes(video.file.size)}`,
      uploading: `${formatPercent(ratio)} · ${formatBytes(upload.loaded)} de ${formatBytes(video.file.size)}`,
      done: `Subido · ${formatBytes(video.file.size)}`,
      error: 'Error en la subida',
      cancelled: 'Cancelado',
    }
    const retryable = canRetry && (upload.status === 'error' || upload.status === 'cancelled')
    return (
      <Row key={video.key} tone={VIDEO_TONE[upload.status]} title={video.title} detail={detail[upload.status]}>
        {upload.status === 'uploading' && (
          <div
            role="progressbar"
            aria-label={`Subida de ${video.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.floor(ratio * 100)}
            className="h-1.5 overflow-hidden rounded-full bg-ink/15"
          >
            <div
              className="h-full origin-left rounded-full bg-ink transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${ratio})` }}
            />
          </div>
        )}
        {upload.error && <p className="text-xs text-antenna-deep">{upload.error}</p>}
        {retryable && (
          <Button size="sm" className="self-start pr-3.5 pl-3" onClick={() => onRetryVideo(video.key)}>
            <RefreshIcon className="size-4" strokeWidth={2} />
            Reintentar
          </Button>
        )}
      </Row>
    )
  })
}
