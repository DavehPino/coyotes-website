import type { UseQueryResult } from '@tanstack/react-query'
import type { Activity } from '@shared/schemas'
import { formatDayMonth, formatDaysFromToday, formatTimeRange, formatWeekdayShort } from '@/lib/dates'
import { Button, Chip, Cue, EmptyState, ErrorState, Skeleton, TeamLogo, Zone } from '../ui'
import { CalendarIcon, ChevronRightIcon, MapPinIcon, PlusIcon } from '../ui/icons'

type NextMatchZoneProps = {
  query: UseQueryResult<Activity[]>
  /** Ya filtradas y en orden cronológico. */
  items: Activity[]
  today: string
  onOpen: (activity: Activity) => void
  onAdd: () => void
}

/** Cuántas actividades se listan debajo de la destacada. */
const FOLLOWING = 3

/** "DOM 20 SEP" a escala de número de cancha. */
function bigDate(isoDate: string): string {
  return `${formatWeekdayShort(isoDate)} ${formatDayMonth(isoDate)}`.replace(/\./g, '')
}

/** Primera zona: lo siguiente en grande, y lo que viene después como filas separadas por filetes. */
export function NextMatchZone({ query, items, today, onOpen, onAdd }: NextMatchZoneProps) {
  const [next, ...rest] = items
  const following = rest.slice(0, FOLLOWING)

  return (
    <Zone id="home-next-up" label="Próximo partido" more={{ to: '/activities', label: 'Agenda' }}>
      {query.isPending ? (
        <NextMatchSkeleton />
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
            <Button variant="primary" onClick={onAdd} className="mt-1 pr-4 pl-3.5">
              <PlusIcon className="size-4" strokeWidth={2} />
              Cargar actividad
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col">
          <Featured activity={next} today={today} onOpen={onOpen} />
          {following.length > 0 && (
            <ul className="divide-hairline hairline mt-5">
              {following.map((activity) => (
                <li key={activity.id}>
                  <FollowingRow activity={activity} today={today} onOpen={onOpen} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Zone>
  )
}

function Featured({ activity, today, onOpen }: { activity: Activity; today: string; onOpen: (activity: Activity) => void }) {
  const podio = activity.category === 'podio'
  const isToday = activity.activity_date === today
  const time = formatTimeRange(activity.start_time, activity.end_time)

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {isToday && <Chip tone="orange" size="md">Hoy</Chip>}
        {podio && <Chip tone="podio" size="md">Liga Podio</Chip>}
        {!isToday && <span className="text-sm font-bold tracking-wide text-ink-soft uppercase">{formatDaysFromToday(activity.activity_date, today)}</span>}
      </div>

      {/* La fecha y la hora a escala de número de cancha, en cifras condensadas. */}
      <p className="flex flex-wrap items-baseline gap-x-4 font-figures leading-none text-ink uppercase">
        <span className="text-[4.5rem] font-black sm:text-[5.5rem]">{bigDate(activity.activity_date)}</span>
        <span className="text-[2.75rem] font-bold text-ink-soft sm:text-[3.25rem]">{time ?? 'Hora por confirmar'}</span>
      </p>

      {/* El título lo escribe el equipo: va tal cual, sin pasar a mayúsculas. */}
      <h3 className="text-3xl leading-none normal-case md:text-4xl">
        <button
          type="button"
          onClick={() => onOpen(activity)}
          aria-haspopup="dialog"
          className="text-left after:absolute after:inset-0 focus-visible:outline-none"
        >
          {activity.title}
          <span className="sr-only">. Ver detalle</span>
        </button>
      </h3>

      {(activity.location || activity.opponent) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-ink-soft">
          {activity.opponent && (
            <p className="flex items-center gap-2 text-ink">
              <TeamLogo team={activity.opponent} size="sm" />
              {/* El título ya suele nombrar al rival: entonces solo va el escudo. */}
              {!activity.title.toLocaleLowerCase().includes(activity.opponent.name.toLocaleLowerCase()) && (
                <span className="min-w-0 truncate font-bold">vs {activity.opponent.name}</span>
              )}
            </p>
          )}
          {activity.location && (
            <p className="flex items-center gap-1.5">
              <MapPinIcon className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{activity.location}</span>
            </p>
          )}
        </div>
      )}
      <Cue className="mt-1">Ver detalle</Cue>
    </article>
  )
}

function FollowingRow({ activity, today, onOpen }: { activity: Activity; today: string; onOpen: (activity: Activity) => void }) {
  const time = formatTimeRange(activity.start_time, activity.end_time)
  const meta = [time ?? 'Hora por confirmar', activity.location].filter(Boolean).join(' · ')
  const isToday = activity.activity_date === today

  return (
    <button
      type="button"
      onClick={() => onOpen(activity)}
      aria-haspopup="dialog"
      aria-label={`${activity.title}, ${formatWeekdayShort(activity.activity_date)} ${formatDayMonth(activity.activity_date)}${time ? `, ${time}` : ''}. Ver detalle`}
      className={[
        'group grid min-h-14 w-full grid-cols-[4.25rem_minmax(0,1fr)_auto_auto] items-center gap-3 px-1 py-2 text-left',
        'transition-colors duration-150 ease-out hover:bg-surface/50',
      ].join(' ')}
    >
      <span aria-hidden className="flex flex-col leading-tight uppercase">
        <span className="text-lg font-extrabold whitespace-nowrap text-ink">{formatDayMonth(activity.activity_date)}</span>
        <span className="text-xs font-bold text-ink-soft">{formatWeekdayShort(activity.activity_date)}</span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-lg font-bold text-ink">{activity.title}</span>
        <span className="truncate text-sm text-ink-soft">{meta}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {isToday && <Chip tone="orange">Hoy</Chip>}
        {activity.category === 'podio' && <Chip tone="podio">Podio</Chip>}
      </span>
      <ChevronRightIcon aria-hidden className="size-5 text-ink-soft transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-ink" strokeWidth={2} />
    </button>
  )
}

function NextMatchSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Cargando próximas actividades">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-[4.5rem] w-4/5" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <div className="divide-hairline hairline mt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-h-14 items-center gap-3 py-2">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
