import type { UseQueryResult } from '@tanstack/react-query'
import type { Activity } from '@shared/schemas'
import { formatDayMonth, formatTimeRange, formatWeekdayShort } from '@/lib/dates'
import { UpcomingActivityCard, UpcomingActivityCardSkeleton } from '../activities/UpcomingActivityCard'
import { Button, Card, Chip, EmptyState, ErrorState, Skeleton } from '../ui'
import { CalendarIcon, PlusIcon } from '../ui/icons'
import { SectionHeader } from './SectionHeader'

type NextUpPanelProps = {
  query: UseQueryResult<Activity[]>
  /** Ya filtradas y en orden cronológico. */
  items: Activity[]
  today: string
  onOpen: (activity: Activity) => void
  onAdd: () => void
}

/** Cuántas actividades se listan debajo de la destacada. */
const FOLLOWING = 3

/** La siguiente actividad en grande y las tres posteriores en una lista compacta. */
export function NextUpPanel({ query, items, today, onOpen, onAdd }: NextUpPanelProps) {
  const [next, ...rest] = items
  const following = rest.slice(0, FOLLOWING)

  return (
    <section aria-labelledby="home-next-up">
      <SectionHeader id="home-next-up" title="Lo próximo" more={{ to: '/activities', label: 'Ver todas' }} />

      {query.isPending ? (
        <NextUpPanelSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="No se pudieron cargar las actividades"
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : !next ? (
        <EmptyState
          icon={<CalendarIcon className="size-8" />}
          title="No hay nada en la agenda"
          description="Carga la próxima actividad para que el equipo la vea aquí."
          action={
            <Button variant="secondary" onClick={onAdd} className="mt-1 pr-4 pl-3.5">
              <PlusIcon className="size-4" strokeWidth={2} />
              Cargar actividad
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <UpcomingActivityCard activity={next} today={today} onOpen={onOpen} />
          {following.length > 0 && (
            <Card as="ul" className="divide-y divide-coyote-steel/60 p-1">
              {following.map((activity) => (
                <li key={activity.id}>
                  <FollowingRow activity={activity} onOpen={onOpen} />
                </li>
              ))}
            </Card>
          )}
        </div>
      )}
    </section>
  )
}

function FollowingRow({ activity, onOpen }: { activity: Activity; onOpen: (activity: Activity) => void }) {
  const time = formatTimeRange(activity.start_time, activity.end_time)
  const meta = [time ?? 'Hora por confirmar', activity.location].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={() => onOpen(activity)}
      aria-haspopup="dialog"
      aria-label={`${activity.title}, ${formatWeekdayShort(activity.activity_date)} ${formatDayMonth(activity.activity_date)}${time ? `, ${time}` : ''}. Ver detalle`}
      className={[
        'grid min-h-14 w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 text-left',
        'transition-colors duration-150 ease-out hover:bg-coyote-ember/45 md:px-3',
      ].join(' ')}
    >
      <span aria-hidden className="flex flex-col leading-tight text-coyote-ash tabular-nums">
        <span className="text-sm font-medium text-coyote-silver">{formatDayMonth(activity.activity_date)}</span>
        <span className="text-xs">{formatWeekdayShort(activity.activity_date)}</span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-coyote-silver">{activity.title}</span>
        <span className="truncate text-xs text-coyote-ash tabular-nums">{meta}</span>
      </span>
      {activity.category === 'podio' && <Chip tone="podio">Podio</Chip>}
    </button>
  )
}

export function NextUpPanelSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Cargando próximas actividades">
      <UpcomingActivityCardSkeleton />
      <Card className="flex flex-col gap-1 p-1">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </Card>
    </div>
  )
}
