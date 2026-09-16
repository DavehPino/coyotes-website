// Competiciones (ligas, amistosos...) de la organización: filtros de Partidos y select del formulario.
import { queryOptions, useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { CompetitionListItem } from '@shared/schemas'

export const competitionsKey = ['competitions'] as const

/** Siempre frescas: una liga recién añadida o un partido recién guardado cambian la lista y sus contadores. */
export function competitionsOptions() {
  return queryOptions({
    queryKey: competitionsKey,
    queryFn: ({ signal }) => apiGet<CompetitionListItem[]>('/lookups/competitions', signal),
    staleTime: 0,
  })
}

export const useCompetitions = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...competitionsOptions(), enabled })
