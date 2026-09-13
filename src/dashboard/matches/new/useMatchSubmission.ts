// Guardado del partido y subida secuencial de sus videos, con progreso, reintento y cancelación.
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MatchCreated } from '@shared/schemas'
import { refreshMatchData } from '../api'
import { adminPost, errorMessage, isAbort, isUnauthorized } from '../../admin/adminApi'
import { toMatchInput, type Draft, type VideoDraft } from './draft'
import { uploadVideo } from './uploadVideo'

export type VideoUploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'cancelled'
export type VideoUpload = { status: VideoUploadStatus; loaded: number; error: string | null }

export type SubmissionPhase = 'idle' | 'saving' | 'save-error' | 'uploading' | 'finished'

export type Submission = {
  phase: SubmissionPhase
  match: MatchCreated | null
  error: string | null
  uploads: Record<string, VideoUpload>
}

const INITIAL: Submission = { phase: 'idle', match: null, error: null, uploads: {} }

/** Refresco del progreso como mucho cada 150 ms: los eventos de XHR llegan muchas veces por segundo. */
const PROGRESS_INTERVAL_MS = 150

type Options = {
  /** La API rechazó la palabra clave: hay que volver a pedirla. */
  onUnauthorized: () => void
}

export function useMatchSubmission({ onUnauthorized }: Options) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<Submission>(INITIAL)
  const controllerRef = useRef<AbortController | null>(null)
  const matchRef = useRef<MatchCreated | null>(null)

  const setUpload = useCallback((key: string, patch: Partial<VideoUpload>) => {
    setState((prev) => {
      const current = prev.uploads[key] ?? { status: 'queued', loaded: 0, error: null }
      return { ...prev, uploads: { ...prev.uploads, [key]: { ...current, ...patch } } }
    })
  }, [])

  /** Sube los videos indicados uno detrás de otro. Devuelve cuántos terminaron bien. */
  const uploadAll = useCallback(
    async (match: MatchCreated, videos: { video: VideoDraft; sortOrder: number }[], safeword: string) => {
      const controller = new AbortController()
      controllerRef.current = controller
      setState((prev) => ({ ...prev, phase: 'uploading', error: null }))
      let uploaded = 0

      for (const { video, sortOrder } of videos) {
        if (controller.signal.aborted) {
          setUpload(video.key, { status: 'cancelled', error: null })
          continue
        }
        setUpload(video.key, { status: 'uploading', loaded: 0, error: null })
        let lastReport = 0
        try {
          await uploadVideo({
            matchId: match.id,
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
          uploaded += 1
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
      setState((prev) => ({ ...prev, phase: 'finished' }))
      if (uploaded > 0) void refreshMatchData(queryClient, match.slug).catch(() => undefined)
    },
    [onUnauthorized, queryClient, setUpload],
  )

  /** Guarda el partido (si aún no se guardó) y sube los videos pendientes. */
  const submit = useCallback(
    async (draft: Draft, safeword: string) => {
      let match = matchRef.current
      if (!match) {
        setState({
          ...INITIAL,
          phase: 'saving',
          uploads: Object.fromEntries(draft.videos.map((v) => [v.key, { status: 'queued', loaded: 0, error: null }])),
        })
        try {
          match = await adminPost<MatchCreated>('/matches', toMatchInput(draft), safeword)
        } catch (err) {
          if (isUnauthorized(err)) onUnauthorized()
          setState((prev) => ({ ...prev, phase: 'save-error', error: errorMessage(err) }))
          return
        }
        matchRef.current = match
        setState((prev) => ({ ...prev, match }))
        void refreshMatchData(queryClient).catch(() => undefined)
      }

      const pending = draft.videos
        .map((video, sortOrder) => ({ video, sortOrder }))
        .filter(({ video }) => state.uploads[video.key]?.status !== 'done')
      await uploadAll(match, pending, safeword)
    },
    [onUnauthorized, queryClient, state.uploads, uploadAll],
  )

  const retryVideo = useCallback(
    async (draft: Draft, videoKey: string, safeword: string) => {
      const match = matchRef.current
      const sortOrder = draft.videos.findIndex((video) => video.key === videoKey)
      const video = draft.videos[sortOrder]
      if (!match || !video) return
      await uploadAll(match, [{ video, sortOrder }], safeword)
    },
    [uploadAll],
  )

  const cancel = useCallback(() => controllerRef.current?.abort(), [])

  const busy = state.phase === 'saving' || state.phase === 'uploading'

  // Aviso del navegador si se intenta cerrar la pestaña con una subida en marcha.
  useEffect(() => {
    if (!busy) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  // Si el componente desaparece (p.ej. se navega a otra página), las subidas se cancelan.
  useEffect(() => () => controllerRef.current?.abort(), [])

  return { state, busy, submit, retryVideo, cancel }
}
