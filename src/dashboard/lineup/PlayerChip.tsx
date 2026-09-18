import { PLAYER_POSITION_LABELS, PLAYER_POSITION_SHORT, type PlayerPosition } from '@shared/domain'
import type { Player } from '@shared/schemas'
import { initialsOf, POSITION_STYLES, positionsOf } from './positions'

type PositionChipProps = {
  position: PlayerPosition
  /** Secundaria: va después de la principal; el lector de pantalla lo indica. */
  secondary?: boolean
}

/** Abreviatura de la posición sobre su color; el lector de pantalla oye el nombre completo. */
export function PositionChip({ position, secondary = false }: PositionChipProps) {
  const style = POSITION_STYLES[position]
  return (
    <span
      title={PLAYER_POSITION_LABELS[position]}
      className={[
        'inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[11px] leading-none font-bold tracking-wide',
        style.bg,
        style.text,
      ].join(' ')}
    >
      <span aria-hidden>{PLAYER_POSITION_SHORT[position]}</span>
      <span className="sr-only">
        {PLAYER_POSITION_LABELS[position]}
        {secondary ? ' (secundaria)' : ''}
      </span>
    </span>
  )
}

/** Chips de las posiciones del jugador, la principal primero. */
export function PlayerPositions({ player }: { player: Player }) {
  return (
    <span className="flex items-center gap-1">
      {positionsOf(player).map((position, index) => (
        <PositionChip key={position} position={position} secondary={index > 0} />
      ))}
    </span>
  )
}

/** Número de camiseta en círculo (o iniciales si no tiene). */
export function JerseyBadge({ player, className = '' }: { player: Player; className?: string }) {
  return (
    <span
      aria-hidden
      className={[
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-key font-bold text-2xl leading-none text-on-key tabular-nums',
        className,
      ].join(' ')}
    >
      <span className="translate-y-px">{player.jersey_number ?? initialsOf(player.name)}</span>
    </span>
  )
}
