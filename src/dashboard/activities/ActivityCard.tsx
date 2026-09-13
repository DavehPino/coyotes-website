import { ACTIVITY_TYPE_LABELS } from '@shared/domain'
import type { Activity } from '@shared/schemas'
import { formatTimeRange } from '@/lib/dates'
import { Chip, TeamLogo } from '../ui'
import { ClockIcon, MapPinIcon } from '../ui/icons'
import { ACTIVITY_TYPE_TONES } from './activityTypeStyles'

type ActivityCardProps = {
  activity: Activity
  onOpen: (activity: Activity) => void
}

/** Tarjeta del tablero. Es un botón: clic o Enter abren el detalle. */
export function ActivityCard({ activity, onOpen }: ActivityCardProps) {
  const time = formatTimeRange(activity.start_time, activity.end_time)

  return (
    <button
      type="button"
      onClick={() => onOpen(activity)}
      aria-haspopup="dialog"
      aria-label={`${activity.title}${activity.is_cancelled ? ' (cancelada)' : ''}. Ver detalle`}
      className={[
        'flex w-full flex-col gap-1.5 rounded-lg bg-coyote-black/70 p-3 text-left shadow-border',
        'transition-[box-shadow,background-color,scale] duration-150 ease-out',
        'hover:bg-coyote-ember/45 hover:shadow-border-hover active:scale-[0.96]',
        activity.is_cancelled ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={ACTIVITY_TYPE_TONES[activity.activity_type]}>{ACTIVITY_TYPE_LABELS[activity.activity_type]}</Chip>
        {activity.is_cancelled && <Chip tone="orange">Cancelada</Chip>}
      </div>

      <p className="flex items-center gap-1 text-xs text-coyote-ash tabular-nums">
        <ClockIcon className="size-3.5" />
        {time ?? 'Sin hora'}
      </p>

      <h3
        className={[
          'font-sans text-base leading-snug font-semibold tracking-normal normal-case',
          activity.is_cancelled ? 'text-coyote-ash line-through' : 'text-coyote-silver',
        ].join(' ')}
      >
        {activity.title}
      </h3>

      {activity.location && (
        <p className="flex items-start gap-1 text-sm text-coyote-ash">
          <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 truncate">{activity.location}</span>
        </p>
      )}

      {activity.opponent && (
        <p className="flex items-center gap-1.5 text-sm text-coyote-silver">
          <TeamLogo team={activity.opponent} size="sm" />
          <span className="min-w-0 truncate">vs {activity.opponent.name}</span>
        </p>
      )}

      {activity.description && <p className="line-clamp-2 text-sm text-coyote-ash">{activity.description}</p>}
    </button>
  )
}
