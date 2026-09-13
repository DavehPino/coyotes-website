// Subida secuencial de videos a un partido ya guardado, con progreso por video, reintento y cancelación.
import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, isAbort, isUnauthorized } from '../../admin/adminApi'
import type { VideoDraft } from './draft'
import { uploadVideo } from './uploadVideo'

export type VideoUploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'cancelled'
export type VideoUpload = { status: VideoUploadStatus; loaded: number; error: string | null }
export type VideoUploads = Record<string, VideoUpload>

export type UploadItem = { video: VideoDraft; sortOrder: number }

export const QUEUED: VideoUpload = { status: 'queued', loaded: 0, error: null }

/** Refresco del progreso como mucho cada 150 ms: los eventos de XHR llegan muchas veces por segundo. */
const PROGRESS_INTERVAL_MS = 150

type Options = {
  /** La API rechazó la palabra clave: hay que volver a pedirla. */
  onUnauthorized: () => void
  /** Al terminar una tanda en la que se subió al menos un video (p.ej. para refrescar el partido). */
  onUploaded: () => void
}

export function useVideoUploads({ onUnauthorized, onUploaded }: Options) {
  const [uploads, setUploads] = useState<VideoUploads>({})
  const [uploading, setUploading] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  const setUpload = useCallback((key: string, patch: Partial<VideoUpload>) => {
    setUploads((prev) => ({ ...prev, [key]: { ...(prev[key] ?? QUEUED), ...patch } }))
  }, [])

  /** Marca videos como en cola antes de empezar (p.ej. mientras se guarda el partido). */
  const queue = useCallback((videos: VideoDraft[]) => {
    setUploads((prev) => ({ ...prev, ...Object.fromEntries(videos.map((video) => [video.key, QUEUED])) }))
  }, [])

  /** Sube los videos uno detrás de otro. Devuelve las claves de los que terminaron bien. */
  const uploadAll = useCallback(
    async (matchId: string, items: UploadItem[], safeword: string): Promise<string[]> => {
      const controller = new AbortController()
      controllerRef.current = controller
      setUploading(true)
      queue(items.map((item) => item.video))
      const done: string[] = []

      for (const { video, sortOrder } of items) {
        if (controller.signal.aborted) {
          setUpload(video.key, { status: 'cancelled', error: null })
          continue
        }
        setUpload(video.key, { status: 'uploading', loaded: 0, error: null })
        let lastReport = 0
        try {
          await uploadVideo({
            matchId,
            file: video.file,
            title: video.title.trim(),
            setNumber: video.setNumber,
            sortOrder,
            safeword,
            signal: controller.signal,
            onProgress: (loaded) => {
              const now = performance.now()
              if (now - lastReport < PROGRESS_INTERVAL_MS && loaded < video.file.size) return
              lastReport = now
              setUpload(video.key, { loaded })
            },
          })
          done.push(video.key)
          setUpload(video.key, { status: 'done', loaded: video.file.size })
        } catch (err) {
          if (isAbort(err)) {
            setUpload(video.key, { status: 'cancelled', error: null })
          } else if (isUnauthorized(err)) {
            setUpload(video.key, { status: 'error', error: 'Palabra clave rechazada' })
            controller.abort()
            onUnauthorized()
          } else {
            setUpload(video.key, { status: 'error', error: errorMessage(err) })
          }
        }
      }

      controllerRef.current = null
      setUploading(false)
      if (done.length > 0) onUploaded()
      return done
    },
    [onUnauthorized, onUploaded, queue, setUpload],
  )

  const cancel = useCallback(() => controllerRef.current?.abort(), [])

  // Aviso del navegador si se intenta cerrar la pestaña con una subida en marcha.
  useEffect(() => {
    if (!uploading) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [uploading])

  // Si el componente desaparece (p.ej. se navega a otra página), las subidas se cancelan.
  useEffect(() => () => controllerRef.current?.abort(), [])

  return { uploads, uploading, queue, uploadAll, cancel }
}
