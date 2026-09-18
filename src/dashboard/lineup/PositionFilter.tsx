import { PLAYER_POSITION_LABELS, PLAYER_POSITION_SHORT, PLAYER_POSITIONS, type PlayerPosition } from '@shared/domain'
import { POSITION_STYLES } from './positions'

type PositionFilterProps = {
  value: PlayerPosition | null
  onChange: (value: PlayerPosition | null) => void
  label: string
  /** Abreviaturas en vez de nombres (banco de la cancha). */
  compact?: boolean
  /** Dentro de la cancha (fondo oscuro): conserva la paleta del tablero, que no se rediseña. */
  onBoard?: boolean
  className?: string
}

const CHIP_BASE = [
  'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-sm px-3 text-xs font-bold tracking-wide whitespace-nowrap uppercase select-none',
  'transition-[background-color,color,box-shadow] duration-150 ease-out',
].join(' ')

/** Rótulos pintados sobre el suelo; el marcado pasa a vinilo negro con letras del club. */
const CHIP_FLOOR = 'aria-pressed:bg-ink aria-pressed:text-club bg-line/40 text-ink shadow-tape hover:bg-line/80'

/** Sobre la cancha oscura: la paleta del tablero. */
const CHIP_BOARD = [
  'rounded-full aria-pressed:bg-coyote-ember aria-pressed:text-coyote-gold aria-pressed:shadow-gold',
  'bg-coyote-black text-coyote-ash shadow-border hover:text-coyote-silver hover:shadow-border-hover',
].join(' ')

/** Rótulos de filtro por posición («Todas» + las 6). Uno activo a la vez. El punto lleva el color de la posición. */
export function PositionFilter({ value, onChange, label, compact = false, onBoard = false, className = '' }: PositionFilterProps) {
  const chip = `${CHIP_BASE} ${onBoard ? CHIP_BOARD : CHIP_FLOOR}`
  return (
    <div role="group" aria-label={label} className={['flex gap-2', className].join(' ')}>
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={chip}>
        Todas
      </button>
      {PLAYER_POSITIONS.map((position) => (
        <button
          key={position}
          type="button"
          aria-pressed={value === position}
          aria-label={compact ? PLAYER_POSITION_LABELS[position] : undefined}
          onClick={() => onChange(value === position ? null : position)}
          className={chip}
        >
          <span aria-hidden className={`size-2.5 rounded-full ${POSITION_STYLES[position].bg}`} />
          {compact ? PLAYER_POSITION_SHORT[position] : PLAYER_POSITION_LABELS[position]}
        </button>
      ))}
    </div>
  )
}
