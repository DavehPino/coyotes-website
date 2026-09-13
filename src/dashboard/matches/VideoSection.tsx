import { useSearchParams } from 'react-router'
import type { Video } from '@shared/schemas'
import { formatDuration } from '@/lib/dates'
import { Button, Card, Chip, EmptyState } from '../ui'
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
        className="aspect-video w-full rounded-2xl bg-coyote-black shadow-border"
      />
    )
  }
  return (
    <Card className="flex aspect-video flex-col items-center justify-center gap-3 bg-ember-fade p-6 text-center">
      <FilmIcon className="size-10 text-coyote-ash" />
      <p className="max-w-sm text-sm text-coyote-ash">Este video está alojado fuera del equipo y se abre en una pestaña nueva.</p>
      <a
        href={video.url ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-coyote-gold pr-3.5 pl-4 text-sm font-medium text-coyote-black transition-[background-color,scale] duration-150 ease-out hover:bg-coyote-yellow active:scale-[0.96]"
      >
        Abrir video
        <ExternalLinkIcon className="size-4" strokeWidth={2} />
      </a>
    </Card>
  )
}

/** Reproductor principal + playlist. El video activo va en ?video=<id>. */
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
      <section aria-labelledby="videos-title">
        <h2 id="videos-title" className="mb-3 text-3xl leading-none text-coyote-silver">
          Videos del partido
        </h2>
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
      </section>
    )
  }

  return (
    <section aria-labelledby="videos-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="videos-title" className="text-3xl leading-none text-coyote-silver">
          Videos del partido
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-coyote-ash tabular-nums">{videoCountLabel(videos.length)}</span>
          {onManage && (
            <Button variant="ghost" size="sm" onClick={onManage} className="-mr-2">
              Gestionar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-2">
          {active.source === 'external' ? <ExternalVideo video={active} /> : <VideoPlayer video={active} />}
          <div className="flex flex-wrap items-center gap-2 px-1">
            <Chip tone={active.set_number !== null ? 'gold' : 'steel'} size="md">
              {videoLabel(active)}
            </Chip>
            <p className="font-medium text-coyote-silver">{active.title}</p>
          </div>
          {active.description && <p className="px-1 text-sm whitespace-pre-line text-coyote-ash">{active.description}</p>}
        </div>

        <Card as="ol" aria-label="Lista de videos" className="flex flex-col gap-1 p-1">
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
                    'grid w-full min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 text-left',
                    'transition-[background-color,color] duration-150 ease-out',
                    isActive ? 'bg-coyote-ember text-coyote-gold' : 'text-coyote-silver hover:bg-coyote-ember/45',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex size-9 items-center justify-center rounded-lg font-display text-lg tabular-nums',
                      isActive ? 'bg-coyote-gold text-coyote-black' : 'bg-coyote-black/60 text-coyote-ash',
                    ].join(' ')}
                  >
                    {isActive ? <PlayIcon className="size-5" filled /> : index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{video.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-coyote-ash">
                      <span className={isActive ? 'text-coyote-gold/80' : ''}>{videoLabel(video)}</span>
                      {video.source === 'external' && <ExternalLinkIcon className="size-3" />}
                    </span>
                  </span>
                  <span className="text-xs text-coyote-ash tabular-nums">{duration ?? ''}</span>
                </button>
              </li>
            )
          })}
        </Card>
      </div>
    </section>
  )
}
