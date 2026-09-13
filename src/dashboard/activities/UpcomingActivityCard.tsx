import podioLogoUrl from '@assets/podio-logo.png'
import { ACTIVITY_TYPE_LABELS } from '@shared/domain'
import type { Activity } from '@shared/schemas'
import { formatDateCompact, formatDaysFromToday, formatTimeRange } from '@/lib/dates'
import { Chip, Skeleton, TeamLogo } from '../ui'
import { ClockIcon, MapPinIcon } from '../ui/icons'

type UpcomingActivityCardProps = {
  activity: Activity
  today: string
  onOpen: (activity: Activity) => void
}

const CARD_CLASSES = 'flex h-full min-h-72 w-full flex-col gap-4 rounded-2xl p-5 text-left md:p-6'

/**
 * Tarjeta del carrusel. Dos variantes: general (superficie neutra, sin etiqueta) y
 * Liga Podio (celeste, etiqueta PODIO y logo). Clic o Enter abren el detalle.
 */
export function UpcomingActivityCard({ activity, today, onOpen }: UpcomingActivityCardProps) {
  const podio = activity.category === 'podio'
  const time = formatTimeRange(activity.start_time, activity.end_time)
  const date = formatDateCompact(activity.activity_date)
  const muted = podio ? 'text-podio-mist' : 'text-coyote-ash'

  return (
    <button
      type="button"
      onClick={() => onOpen(activity)}
      aria-haspopup="dialog"
      aria-label={`${podio ? 'Liga Podio. ' : ''}${activity.title}, ${date}${time ? `, ${time}` : ''}. Ver detalle`}
      className={[
        CARD_CLASSES,
        'transition-[box-shadow,filter,scale] duration-150 ease-out active:scale-[0.96]',
        podio
          ? 'bg-podio-fade text-white shadow-[0_0_0_1px_oklch(1_0_0/0.16)] hover:brightness-110'
          : 'bg-coyote-night text-coyote-silver shadow-border hover:shadow-border-hover',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-3xl leading-none tracking-wide uppercase md:text-4xl">{date}</p>
          <p className={`mt-1 flex flex-wrap items-center gap-x-1.5 text-sm tabular-nums ${muted}`}>
            <span className="font-medium">{formatDaysFromToday(activity.activity_date, today)}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {time ?? 'Hora por confirmar'}
            </span>
          </p>
        </div>
        {podio && (
          <div className="flex shrink-0 items-center gap-2">
            <Chip tone="podio" size="md">
              Podio
            </Chip>
            <span className="flex size-11 items-center justify-center rounded-xl bg-podio-mist">
              <img src={podioLogoUrl} alt="" width={64} height={64} className="size-8 outline-none" />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className={`text-xs font-medium tracking-wide uppercase ${muted}`}>
          {ACTIVITY_TYPE_LABELS[activity.activity_type]}
        </p>
        <h3 className="text-3xl leading-none md:text-4xl">{activity.title}</h3>
      </div>

      {activity.description && (
        <p className={`line-clamp-3 text-sm whitespace-pre-line ${muted}`}>{activity.description}</p>
      )}

      {(activity.location || activity.opponent) && (
        <div className="mt-auto flex flex-col gap-1.5 text-sm">
          {activity.opponent && (
            <p className="flex items-center gap-2">
              <TeamLogo team={activity.opponent} size="sm" />
              <span className="min-w-0 truncate">vs {activity.opponent.name}</span>
            </p>
          )}
          {activity.location && (
            <p className={`flex items-center gap-2 ${muted}`}>
              <MapPinIcon className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{activity.location}</span>
            </p>
          )}
        </div>
      )}
    </button>
  )
}

export function UpcomingActivityCardSkeleton() {
  return (
    <div className={`${CARD_CLASSES} bg-coyote-night shadow-border`}>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-9 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-auto h-4 w-1/2" />
    </div>
  )
}
