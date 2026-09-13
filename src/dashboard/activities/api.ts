// Hooks de TanStack Query para actividades. La clave incluye el día: al cambiar de fecha se piden de nuevo.
import { queryOptions, useQuery } from '@tanstack/react-query'
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

export function useUpcomingActivities(from: string) {
  return useQuery(upcomingActivitiesOptions(from))
}
