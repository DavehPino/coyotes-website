// Hooks de TanStack Query para partidos y reproducción de videos. Query keys estables por recurso.
import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { ApiError, apiGet } from '@/lib/api'
import type { MatchDetail, MatchSummary, Playback, TeamSummary } from '@shared/schemas'

export const matchesKeys = {
  all: ['matches'] as const,
  list: () => ['matches', 'list'] as const,
  detail: (slug: string) => ['matches', 'detail', slug] as const,
  playback: (videoId: string) => ['videos', videoId, 'playback'] as const,
  rivals: () => ['teams', 'rivals'] as const,
}

const MATCH_LIST_PATH = '/matches?limit=50'
const matchDetailPath = (slug: string) => `/matches/${encodeURIComponent(slug)}`

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

export function matchListOptions() {
  return queryOptions({
    queryKey: matchesKeys.list(),
    queryFn: ({ signal }) => apiGet<MatchSummary[]>(MATCH_LIST_PATH, signal),
    staleTime: 60_000,
  })
}

export function matchDetailOptions(slug: string) {
  return queryOptions({
    queryKey: matchesKeys.detail(slug),
    queryFn: ({ signal }) => apiGet<MatchDetail>(matchDetailPath(slug), signal),
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

/** Rivales para el formulario de alta. Siempre frescos: puede haberse creado uno hace un momento. */
export function rivalTeamsOptions() {
  return queryOptions({
    queryKey: matchesKeys.rivals(),
    queryFn: ({ signal }) => apiGet<TeamSummary[]>('/teams', signal),
    staleTime: 0,
  })
}

/**
 * Tras guardar datos: vuelve a pedir el listado (y el detalle, si se indica) saltando la caché HTTP
 * del navegador, que guarda las lecturas un minuto, y lo deja en TanStack Query.
 */
export async function refreshMatchData(queryClient: QueryClient, slug?: string): Promise<void> {
  const [list, detail] = await Promise.all([
    apiGet<MatchSummary[]>(MATCH_LIST_PATH, undefined, 'reload'),
    slug ? apiGet<MatchDetail>(matchDetailPath(slug), undefined, 'reload') : null,
  ])
  queryClient.setQueryData(matchesKeys.list(), list)
  if (slug && detail) queryClient.setQueryData(matchesKeys.detail(slug), detail)
  void queryClient.invalidateQueries({ queryKey: matchesKeys.rivals() })
}

export const useMatches = () => useQuery(matchListOptions())
export const useMatch = (slug: string) => useQuery(matchDetailOptions(slug))
export const useVideoPlayback = (videoId: string) => useQuery(playbackOptions(videoId))
export const useRivalTeams = () => useQuery(rivalTeamsOptions())
export { isNotFound }
