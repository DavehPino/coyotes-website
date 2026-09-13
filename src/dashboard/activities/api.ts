// Hooks de TanStack Query para actividades. La clave incluye el día: al cambiar de fecha se piden de nuevo.
import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { Activity } from '@shared/schemas'

export const activitiesKeys = {
  all: ['activities'] as const,
  upcoming: (from: string) => ['activities', 'upcoming', from] as const,
}

export function upcomingActivitiesOptions(from: string) {
  return queryOptions({
    queryKey: activitiesKeys.upcoming(from),
    queryFn: ({ signal }) => apiGet<Activity[]>(`/activities?from=${from}`, signal),
    staleTime: 60_000,
  })
}

/** Tras cargar una actividad: vuelve a pedir la lista saltando la caché HTTP del navegador (un minuto). */
export async function refreshUpcomingActivities(queryClient: QueryClient, from: string): Promise<void> {
  const items = await apiGet<Activity[]>(`/activities?from=${from}`, undefined, 'reload')
  queryClient.setQueryData(activitiesKeys.upcoming(from), items)
}

export function useUpcomingActivities(from: string) {
  return useQuery(upcomingActivitiesOptions(from))
}
