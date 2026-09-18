import { useSearchParams } from 'react-router'
import type { Video } from '@shared/schemas'
import { formatDuration } from '@/lib/dates'
import { Button, Chip, EmptyState, Zone } from '../ui'
import { ExternalLinkIcon, FilmIcon, PlayIcon, UploadIcon } from '../ui/icons'
import { videoCountLabel, videoLabel } from './matchLabels'
import { VideoPlayer } from './VideoPlayer'
import { youtubeEmbedUrl } from './videoUtils'

type VideoSectionProps = {
  videos: Video[]
  /** Abre la gestión de videos (subir, renombrar, eliminar). */
  onManage?: () => void
}

export const VIDEO_PARAM = 'video'

function ExternalVideo({ video }: { video: Video }) {
  const embed = video.url ? youtubeEmbedUrl(video.url) : null
  if (embed) {
    return (
      <iframe
        key={video.id}
        src={embed}
        title={video.title}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-full rounded-sm bg-ink shadow-tape"
      />
    )
  }
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-sm bg-floor-deep p-6 text-center shadow-tape">
      <FilmIcon className="size-10 text-ink-soft" />
      <p className="max-w-sm text-ink-soft">Este video está alojado fuera del equipo y se abre en una pestaña nueva.</p>
      <a
        href={video.url ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-ink pr-3.5 pl-4 text-sm font-bold tracking-wide text-club uppercase transition-[background-color,scale] duration-150 ease-out hover:bg-ink/88 active:scale-[0.96]"
      >
        Abrir video
        <ExternalLinkIcon className="size-4" strokeWidth={2} />
      </a>
    </div>
  )
}

/** Reproductor principal + lista de videos como filas de cinta. El video activo va en ?video=<id>. */
export function VideoSection({ videos, onManage }: VideoSectionProps) {
  const [params, setParams] = useSearchParams()
  const requestedId = params.get(VIDEO_PARAM)
  const active = videos.find((video) => video.id === requestedId) ?? videos[0]

  const select = (video: Video) => {
    setParams(
      (prev) => {
        prev.set(VIDEO_PARAM, video.id)
        return prev
      },
      { replace: true },
    )
  }

  if (!active) {
    return (
      <Zone id="videos-title" label="Videos del partido">
        <EmptyState
          icon={<FilmIcon className="size-8" />}
          title="Este partido no tiene videos todavía"
          action={
            onManage && (
              <Button onClick={onManage} className="pr-4 pl-3.5">
                <UploadIcon className="size-4" strokeWidth={2} />
                Subir videos
              </Button>
            )
          }
        />
      </Zone>
    )
  }

  return (
    <Zone
      id="videos-title"
      label="Videos del partido"
      actions={
        <>
          <span className="text-sm text-ink-soft">{videoCountLabel(videos.length)}</span>
          {onManage && (
            <Button variant="ghost" size="sm" onClick={onManage} className="-mr-2">
              Gestionar
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-2">
          {active.source === 'external' ? <ExternalVideo video={active} /> : <VideoPlayer video={active} />}
          <div className="flex flex-wrap items-center gap-2 px-1">
            <Chip tone={active.set_number !== null ? 'gold' : 'silver'} size="md">
              {videoLabel(active)}
            </Chip>
            <p className="font-bold text-ink">{active.title}</p>
          </div>
          {active.description && <p className="px-1 text-ink-soft whitespace-pre-line">{active.description}</p>}
        </div>

        <ol aria-label="Lista de videos" className="divide-tape tape-rule">
          {videos.map((video, index) => {
            const isActive = video.id === active.id
            const duration = formatDuration(video.duration_seconds)
            return (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => select(video)}
                  aria-current={isActive ? 'true' : undefined}
                  className={[
                    'grid w-full min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-1 py-2 text-left',
                    'transition-[background-color,color] duration-150 ease-out',
                    isActive ? 'text-ink' : 'text-ink-soft hover:bg-line/50 hover:text-ink',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex size-9 items-center justify-center rounded-[2px] text-lg font-extrabold',
                      isActive ? 'bg-ink text-club' : 'bg-line text-ink',
                    ].join(' ')}
                  >
                    {isActive ? <PlayIcon className="size-5" filled /> : index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-bold">{video.title}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                      {videoLabel(video).toLocaleLowerCase() !== video.title.toLocaleLowerCase() && videoLabel(video)}
                      {video.source === 'external' && <ExternalLinkIcon className="size-3" />}
                    </span>
                  </span>
                  <span className="text-sm">{duration ?? ''}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </Zone>
  )
}
