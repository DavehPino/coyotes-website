// Guardado del partido y subida secuencial de sus videos, con progreso, reintento y cancelación.
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MatchCreated } from '@shared/schemas'
import { refreshMatchData } from '../api'
import { adminPost, errorMessage, isUnauthorized } from '../../admin/adminApi'
import { toMatchInput, type Draft } from './draft'
import { useVideoUploads, type VideoUploads } from './useVideoUploads'

export type SubmissionPhase = 'idle' | 'saving' | 'save-error' | 'uploading' | 'finished'

export type Submission = {
  phase: SubmissionPhase
  match: MatchCreated | null
  error: string | null
  uploads: VideoUploads
}

type Options = {
  /** La API rechazó la palabra clave: hay que volver a pedirla. */
  onUnauthorized: () => void
}

export function useMatchSubmission({ onUnauthorized }: Options) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState<{ phase: 'idle' | 'saving' | 'save-error' | 'saved'; error: string | null }>({
    phase: 'idle',
    error: null,
  })
  const [match, setMatch] = useState<MatchCreated | null>(null)
  const matchRef = useRef<MatchCreated | null>(null)

  const onUploaded = useCallback(() => {
    const slug = matchRef.current?.slug
    if (slug) void refreshMatchData(queryClient, slug).catch(() => undefined)
  }, [queryClient])

  const { uploads, uploading, queue, uploadAll, cancel } = useVideoUploads({ onUnauthorized, onUploaded })

  /** Guarda el partido (si aún no se guardó) y sube los videos pendientes. */
  const submit = useCallback(
    async (draft: Draft, safeword: string) => {
      let saved = matchRef.current
      if (!saved) {
        setSaving({ phase: 'saving', error: null })
        queue(draft.videos)
        try {
          saved = await adminPost<MatchCreated>('/matches', toMatchInput(draft), safeword)
        } catch (err) {
          if (isUnauthorized(err)) onUnauthorized()
          setSaving({ phase: 'save-error', error: errorMessage(err) })
          return
        }
        matchRef.current = saved
        setMatch(saved)
        void refreshMatchData(queryClient).catch(() => undefined)
      }
      setSaving({ phase: 'saved', error: null })

      const pending = draft.videos
        .map((video, sortOrder) => ({ video, sortOrder }))
        .filter(({ video }) => uploads[video.key]?.status !== 'done')
      await uploadAll(saved.id, pending, safeword)
    },
    [onUnauthorized, queryClient, queue, uploads, uploadAll],
  )

  const retryVideo = useCallback(
    async (draft: Draft, videoKey: string, safeword: string) => {
      const saved = matchRef.current
      const sortOrder = draft.videos.findIndex((video) => video.key === videoKey)
      const video = draft.videos[sortOrder]
      if (!saved || !video) return
      await uploadAll(saved.id, [{ video, sortOrder }], safeword)
    },
    [uploadAll],
  )

  const phase: SubmissionPhase =
    saving.phase === 'saved' ? (uploading ? 'uploading' : 'finished') : saving.phase
  const state: Submission = { phase, match, error: saving.error, uploads }
  const busy = phase === 'saving' || phase === 'uploading'

  // Aviso del navegador si se cierra la pestaña mientras se guarda (las subidas ya avisan solas).
  useEffect(() => {
    if (phase !== 'saving') return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  return { state, busy, submit, retryVideo, cancel }
}
