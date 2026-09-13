// Hooks de TanStack Query para actividades. Query keys estables por semana (lunes).
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { apiGet } from '@/lib/api'
import { addDays } from '@shared/dates'
import type { WeekActivities } from '@shared/schemas'

export const activitiesKeys = {
  all: ['activities'] as const,
  week: (weekStart: string) => ['activities', 'week', weekStart] as const,
}

export function weekActivitiesOptions(weekStart: string) {
  return queryOptions({
    queryKey: activitiesKeys.week(weekStart),
    queryFn: ({ signal }) => apiGet<WeekActivities>(`/activities?week=${weekStart}`, signal),
    staleTime: 60_000,
  })
}

export function useWeekActivities(weekStart: string) {
  return useQuery(weekActivitiesOptions(weekStart))
}

/** Precarga la semana anterior y la siguiente para que ◀ ▶ respondan al instante. */
export function usePrefetchAdjacentWeeks(weekStart: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    void queryClient.prefetchQuery(weekActivitiesOptions(addDays(weekStart, 7)))
    void queryClient.prefetchQuery(weekActivitiesOptions(addDays(weekStart, -7)))
  }, [queryClient, weekStart])
}
