// Hooks de TanStack Query para partidos y reproducción de videos. Query keys estables por recurso.
import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { ApiError, apiGet } from '@/lib/api'
import type { MatchDetail, MatchStats, MatchSummary, Playback } from '@shared/schemas'
import { rivalsKey } from '../admin/teams'
import { competitionsKey } from './competitions'

export const matchesKeys = {
  all: ['matches'] as const,
  /** Prefijo de todos los listados (sin filtro y por competición). */
  lists: () => ['matches', 'list'] as const,
  list: (competitionIds?: string[] | null, leagueId?: string | null) =>
    ['matches', 'list', competitionIds?.length ? [...competitionIds].sort().join(',') : 'all', leagueId ?? 'all'] as const,
  detail: (slug: string) => ['matches', 'detail', slug] as const,
  stats: (slug: string) => ['matches', 'detail', slug, 'stats'] as const,
  playback: (videoId: string) => ['videos', videoId, 'playback'] as const,
}

const matchListPath = (competitionIds?: string[] | null, leagueId?: string | null) =>
  `/matches?limit=100${
    competitionIds?.length ? `&competition_id=${encodeURIComponent([...competitionIds].sort().join(','))}` : ''
  }${leagueId ? `&courtrack_league_id=${encodeURIComponent(leagueId)}` : ''}`
const matchDetailPath = (slug: string) => `/matches/${encodeURIComponent(slug)}`
const matchStatsPath = (slug: string) => `${matchDetailPath(slug)}?view=stats`

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

/** Partidos jugados, opcionalmente solo de unas competiciones y de una temporada (filtro por liga). */
export function matchListOptions(competitionIds?: string[] | null, leagueId?: string | null) {
  return queryOptions({
    queryKey: matchesKeys.list(competitionIds, leagueId),
    queryFn: ({ signal }) => apiGet<MatchSummary[]>(matchListPath(competitionIds, leagueId), signal),
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

/**
 * Progresión y estadísticas de CourtTrack. No cambian una vez jugado el partido: una hora en memoria. Sin reintento
 * si el partido no vino de CourtTrack (404) o el servicio no está configurado (503).
 */
export function matchStatsOptions(slug: string) {
  return queryOptions({
    queryKey: matchesKeys.stats(slug),
    queryFn: ({ signal }) => apiGet<MatchStats>(matchStatsPath(slug), signal),
    staleTime: 60 * 60_000,
    retry: (count, error) => !(error instanceof ApiError && (error.status === 404 || error.status === 503)) && count < 1,
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

/**
 * Tras guardar datos: vuelve a pedir el listado completo (y el detalle, si se indica) saltando la caché HTTP
 * del navegador, que guarda las lecturas un minuto, y lo deja en TanStack Query. Los listados filtrados por
 * competición y los contadores de competiciones se invalidan para que se refresquen si están en pantalla.
 */
export async function refreshMatchData(queryClient: QueryClient, slug?: string): Promise<void> {
  const [list, detail] = await Promise.all([
    apiGet<MatchSummary[]>(matchListPath(), undefined, 'reload'),
    slug ? apiGet<MatchDetail>(matchDetailPath(slug), undefined, 'reload') : null,
  ])
  queryClient.setQueryData(matchesKeys.list(), list)
  if (slug && detail) queryClient.setQueryData(matchesKeys.detail(slug), detail)
  void queryClient.invalidateQueries({
    queryKey: matchesKeys.lists(),
    predicate: (query) => query.queryKey[2] !== 'all' || query.queryKey[3] !== 'all',
  })
  void queryClient.invalidateQueries({ queryKey: rivalsKey })
  void queryClient.invalidateQueries({ queryKey: competitionsKey })
}

/** Aplica un cambio ya guardado al detalle en caché, para verlo al instante mientras llega el refresco. */
export function patchMatchDetail(queryClient: QueryClient, slug: string, update: (match: MatchDetail) => MatchDetail) {
  queryClient.setQueryData<MatchDetail>(matchesKeys.detail(slug), (match) => match && update(match))
}

export const useMatches = (competitionIds?: string[] | null, leagueId?: string | null) =>
  useQuery(matchListOptions(competitionIds, leagueId))
export const useMatch = (slug: string) => useQuery(matchDetailOptions(slug))
export const useMatchStats = (slug: string) => useQuery(matchStatsOptions(slug))
export const useVideoPlayback = (videoId: string) => useQuery(playbackOptions(videoId))
export { isNotFound }
