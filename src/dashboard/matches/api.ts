// Hooks de TanStack Query para partidos y reproducción de videos. Query keys estables por recurso.
import { queryOptions, useQuery } from '@tanstack/react-query'
import { ApiError, apiGet } from '@/lib/api'
import type { MatchDetail, MatchSummary, Playback } from '@shared/schemas'

export const matchesKeys = {
  all: ['matches'] as const,
  list: () => ['matches', 'list'] as const,
  detail: (slug: string) => ['matches', 'detail', slug] as const,
  playback: (videoId: string) => ['videos', videoId, 'playback'] as const,
}

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

export function matchListOptions() {
  return queryOptions({
    queryKey: matchesKeys.list(),
    queryFn: ({ signal }) => apiGet<MatchSummary[]>('/matches?limit=50', signal),
    staleTime: 60_000,
  })
}

export function matchDetailOptions(slug: string) {
  return queryOptions({
    queryKey: matchesKeys.detail(slug),
    queryFn: ({ signal }) => apiGet<MatchDetail>(`/matches/${encodeURIComponent(slug)}`, signal),
    staleTime: 60_000,
    retry: (count, error) => !isNotFound(error) && count < 1,
  })
}

/** URL de reproducción. Si es firmada, caduca: se considera obsoleta un minuto antes de expirar. */
export function playbackOptions(videoId: string) {
  return queryOptions({
    queryKey: matchesKeys.playback(videoId),
    queryFn: ({ signal }) => apiGet<Playback>(`/videos/${encodeURIComponent(videoId)}/playback`, signal),
    staleTime: (query) => {
      const expiresAt = query.state.data?.expiresAt
      if (!expiresAt) return Infinity
      return Math.max(0, new Date(expiresAt).getTime() - Date.now() - 60_000)
    },
    retry: (count, error) => !isNotFound(error) && count < 1,
  })
}

export const useMatches = () => useQuery(matchListOptions())
export const useMatch = (slug: string) => useQuery(matchDetailOptions(slug))
export const useVideoPlayback = (videoId: string) => useQuery(playbackOptions(videoId))
export { isNotFound }
