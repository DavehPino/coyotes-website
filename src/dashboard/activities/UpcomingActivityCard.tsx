import podioLogoUrl from '@assets/podio-logo.png'
import { ACTIVITY_TYPE_LABELS } from '@shared/domain'
import type { Activity } from '@shared/schemas'
import { formatDayMonth, formatDaysFromToday, formatTimeRange, formatWeekdayShort } from '@/lib/dates'
import { Chip, Cue, Skeleton, TeamLogo } from '../ui'
import { ClockIcon, MapPinIcon } from '../ui/icons'

type UpcomingActivityCardProps = {
  activity: Activity
  today: string
  onOpen: (activity: Activity) => void
}

const SLIDE_CLASSES = 'flex h-full min-h-72 w-full flex-col gap-3 pt-3 pr-3 pb-4 text-left'

/**
 * Diapositiva del carrusel: una zona de la hoja con su regla arriba (de tinta en general, azul en
 * Liga Podio) y la fecha a escala de número de cancha. Clic o Enter abren el detalle.
 *
 * Es un `<article>` con el título como botón cuya zona de pulsación se extiende a toda la zona: así el
 * encabezado y los párrafos siguen siendo contenido de verdad y el lector de pantalla lee la zona en orden.
 */
export function UpcomingActivityCard({ activity, today, onOpen }: UpcomingActivityCardProps) {
  const podio = activity.category === 'podio'
  const isToday = activity.activity_date === today
  const time = formatTimeRange(activity.start_time, activity.end_time)

  return (
    <article
      className={[
        SLIDE_CLASSES,
        'group relative border-t-[6px] transition-[background-color,scale] duration-150 ease-out hover:bg-surface/40 active:scale-[0.98]',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ink',
        podio ? 'border-podio' : 'border-line',
      ].join(' ')}
    >
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {isToday ? (
          <Chip tone="orange" size="md">Hoy</Chip>
        ) : (
          <span className="text-sm font-bold tracking-wide text-ink-soft uppercase">
            {formatDaysFromToday(activity.activity_date, today)}
          </span>
        )}
        {podio && (
          <span className="ml-auto flex items-center gap-2">
            <Chip tone="podio" size="md">Liga Podio</Chip>
            <img src={podioLogoUrl} alt="" width={64} height={64} className="size-7 rounded-full bg-podio-mist p-0.5" />
          </span>
        )}
      </div>

      <p className="font-figures leading-none text-ink uppercase">
        <span className="block text-[3.5rem] font-black md:text-[4rem]">
          {`${formatWeekdayShort(activity.activity_date)} ${formatDayMonth(activity.activity_date)}`.replace(/\./g, '')}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[1.75rem] font-bold text-ink-soft">
          <ClockIcon className="size-5" strokeWidth={2} />
          {time ?? 'Hora por confirmar'}
        </span>
      </p>

      <div className="flex flex-col gap-1">
        {/* El título lo escribe el equipo: va tal cual, sin pasar a mayúsculas. */}
        <h3 className="text-3xl leading-none normal-case md:text-[2.25rem]">
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
        {/* El tipo va bajo el título, como etiqueta; las actividades cargadas desde el dashboard no tienen tipo ('otro'). */}
        {activity.activity_type !== 'otro' && (
          <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{ACTIVITY_TYPE_LABELS[activity.activity_type]}</p>
        )}
      </div>

      {activity.description && <p className="line-clamp-3 text-ink-soft whitespace-pre-line">{activity.description}</p>}

      {(activity.location || activity.opponent) && (
        <div className="mt-auto flex flex-col gap-1.5">
          {activity.opponent && (
            <p className="flex items-center gap-2 font-bold text-ink">
              <TeamLogo team={activity.opponent} size="sm" />
              {/* El título ya suele nombrar al rival: entonces solo va el escudo. */}
              {!activity.title.toLocaleLowerCase().includes(activity.opponent.name.toLocaleLowerCase()) && (
                <span className="min-w-0 truncate">vs {activity.opponent.name}</span>
              )}
            </p>
          )}
          {activity.location && (
            <p className="flex items-center gap-2 text-ink-soft">
              <MapPinIcon className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{activity.location}</span>
            </p>
          )}
        </div>
      )}
      <Cue className={activity.location || activity.opponent ? 'mt-2' : 'mt-auto'}>Ver detalle</Cue>
    </article>
  )
}

export function UpcomingActivityCardSkeleton() {
  return (
    <div className={`${SLIDE_CLASSES} border-t-[6px] border-line`}>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-14 w-4/5" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-9 w-3/4" />
      <Skeleton className="mt-auto h-5 w-1/2" />
    </div>
  )
}
