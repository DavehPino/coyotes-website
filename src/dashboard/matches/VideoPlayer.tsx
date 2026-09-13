import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { Video } from '@shared/schemas'
import { ErrorState, Skeleton } from '../ui'
import { matchesKeys, useVideoPlayback } from './api'

type VideoPlayerProps = { video: Video }

const MAX_URL_REFRESHES = 2

/**
 * Reproductor de un video del bucket. La URL llega de /api/videos/:id/playback.
 * Si una URL firmada caduca (error de reproducción), pide otra y retoma en el mismo segundo.
 */
export function VideoPlayer({ video }: VideoPlayerProps) {
  const queryClient = useQueryClient()
  const playback = useVideoPlayback(video.id)
  const videoRef = useRef<HTMLVideoElement>(null)
  const resumeAtRef = useRef<number | null>(null)
  const refreshesRef = useRef(0)
  const [playbackFailed, setPlaybackFailed] = useState(false)

  // Otro video: se reinician los contadores de reintento.
  useEffect(() => {
    refreshesRef.current = 0
    resumeAtRef.current = null
    setPlaybackFailed(false)
  }, [video.id])

  const onError = () => {
    const element = videoRef.current
    if (!element || refreshesRef.current >= MAX_URL_REFRESHES) {
      setPlaybackFailed(true)
      return
    }
    refreshesRef.current += 1
    resumeAtRef.current = element.currentTime
    void queryClient.invalidateQueries({ queryKey: matchesKeys.playback(video.id) })
  }

  const onLoadedMetadata = () => {
    const element = videoRef.current
    const resumeAt = resumeAtRef.current
    if (!element || resumeAt === null) return
    resumeAtRef.current = null
    element.currentTime = resumeAt
    void element.play().catch(() => undefined)
  }

  if (playback.isPending) {
    return <Skeleton className="aspect-video w-full rounded-2xl" />
  }

  if (playback.isError || playbackFailed) {
    return (
      <ErrorState
        title="No se pudo reproducir el video"
        message={playback.error?.message ?? 'El archivo no está disponible en este momento.'}
        onRetry={() => {
          refreshesRef.current = 0
          setPlaybackFailed(false)
          void playback.refetch()
        }}
        retrying={playback.isFetching}
        className="aspect-video"
      />
    )
  }

  return (
    <video
      key={video.id}
      ref={videoRef}
      src={playback.data.url}
      poster={video.thumbnail_url ?? undefined}
      controls
      playsInline
      preload="metadata"
      onError={onError}
      onLoadedMetadata={onLoadedMetadata}
      onPlaying={() => {
        refreshesRef.current = 0
      }}
      aria-label={video.title}
      className="aspect-video w-full rounded-2xl bg-coyote-black shadow-border"
    />
  )
}
