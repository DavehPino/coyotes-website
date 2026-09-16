import { PLAYER_POSITION_LABELS, PLAYER_POSITION_SHORT, PLAYER_POSITIONS, type PlayerPosition } from '@shared/domain'
import { POSITION_STYLES } from './positions'

type PositionFilterProps = {
  value: PlayerPosition | null
  onChange: (value: PlayerPosition | null) => void
  label: string
  /** Abreviaturas en vez de nombres (banco de la cancha). */
  compact?: boolean
  className?: string
}

const CHIP = [
  'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap select-none',
  'transition-[background-color,color,box-shadow] duration-150 ease-out',
  'aria-pressed:bg-coyote-ember aria-pressed:text-coyote-gold aria-pressed:shadow-gold',
  'bg-coyote-black text-coyote-ash shadow-border hover:text-coyote-silver hover:shadow-border-hover',
].join(' ')

/** Chips de filtro por posición («Todas» + las 6). Uno activo a la vez. */
export function PositionFilter({ value, onChange, label, compact = false, className = '' }: PositionFilterProps) {
  return (
    <div role="group" aria-label={label} className={['flex gap-1.5', className].join(' ')}>
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={CHIP}>
        Todas
      </button>
      {PLAYER_POSITIONS.map((position) => (
        <button
          key={position}
          type="button"
          aria-pressed={value === position}
          aria-label={compact ? PLAYER_POSITION_LABELS[position] : undefined}
          onClick={() => onChange(value === position ? null : position)}
          className={CHIP}
        >
          <span aria-hidden className={`size-2.5 rounded-full ${POSITION_STYLES[position].bg}`} />
          {compact ? PLAYER_POSITION_SHORT[position] : PLAYER_POSITION_LABELS[position]}
        </button>
      ))}
    </div>
  )
}
