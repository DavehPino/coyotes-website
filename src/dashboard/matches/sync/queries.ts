// Lecturas de CourtTrack protegidas por la palabra clave, cacheadas en TanStack Query: abrir y cerrar los diálogos
// de Ligas y Sincronizar, o ir y volver de la clasificación, no vuelve a pedirlas al servidor durante 25 segundos.
// Las escrituras (alta, quitar, sync real) invalidan `courtrackKeys.status`.
import { useQuery } from '@tanstack/react-query'
import type { CourtrackLeagueSnapshot, CourtrackSyncStatus } from '@shared/schemas'
import { adminPost } from '../../admin/adminApi'

export const courtrackKeys = {
  all: ['courtrack'] as const,
  status: ['courtrack', 'status'] as const,
  snapshot: (leagueId: string) => ['courtrack', 'snapshot', leagueId] as const,
}

const STALE_MS = 25_000

/** Cupo, temporadas y últimas sincronizaciones. Solo se pide con la palabra clave ya validada. */
export function useCourtrackStatus(safeword: string | null) {
  return useQuery({
    queryKey: courtrackKeys.status,
    queryFn: ({ signal }) => adminPost<CourtrackSyncStatus>('/courtrack-status', {}, safeword ?? '', signal),
    enabled: safeword !== null,
    staleTime: STALE_MS,
    retry: false,
  })
}

/** Clasificación y fixture guardados de una temporada. */
export function useLeagueSnapshot(safeword: string | null, leagueId: string | null) {
  return useQuery({
    queryKey: courtrackKeys.snapshot(leagueId ?? ''),
    queryFn: ({ signal }) => adminPost<CourtrackLeagueSnapshot>('/league-snapshot', { id: leagueId }, safeword ?? '', signal),
    enabled: safeword !== null && leagueId !== null,
    staleTime: STALE_MS,
    retry: false,
  })
}
