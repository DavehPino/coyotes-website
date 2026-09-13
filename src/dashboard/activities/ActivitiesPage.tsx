import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { todayIsoDate } from '@shared/dates'
import type { Activity } from '@shared/schemas'
import { ErrorState, PageHeader } from '../ui'
import { ActivityDetailModal } from './ActivityDetailModal'
import { usePrefetchAdjacentWeeks, useWeekActivities } from './api'
import { WeekBoard, WeekBoardSkeleton } from './WeekBoard'
import { WeekNav } from './WeekNav'
import { WEEK_PARAM, currentWeekStart, weekFromSearch } from './week'

/** Tablero semanal de actividades (solo lectura). La semana va en ?week=YYYY-MM-DD. */
export function ActivitiesPage() {
  const [params, setParams] = useSearchParams()
  const weekStart = weekFromSearch(params)
  const thisWeek = currentWeekStart()
  const today = todayIsoDate()
  const [selected, setSelected] = useState<Activity | null>(null)

  const query = useWeekActivities(weekStart)
  usePrefetchAdjacentWeeks(weekStart)

  const goToWeek = (week: string) => {
    setParams((prev) => {
      if (week === thisWeek) prev.delete(WEEK_PARAM)
      else prev.set(WEEK_PARAM, week)
      return prev
    })
  }

  return (
    <section>
      <PageHeader
        title="Actividades"
        actions={
          <WeekNav
            weekStart={weekStart}
            isCurrentWeek={weekStart === thisWeek}
            onChange={goToWeek}
            onReset={() => goToWeek(thisWeek)}
          />
        }
      />

      {query.isPending ? (
        <WeekBoardSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="No se pudieron cargar las actividades"
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <WeekBoard weekStart={weekStart} items={query.data.items} today={today} onOpen={setSelected} />
      )}

      <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
