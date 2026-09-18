import type { Player } from '@shared/schemas'
import { Skeleton } from '../ui'
import { PencilIcon } from '../ui/icons'
import { JerseyBadge, PlayerPositions } from './PlayerChip'
import { positionsLabel } from './positions'

type PlayerListProps = {
  players: Player[]
  onSelect: (player: Player) => void
}

/** Plantel en filas con filete: activos primero (el orden lo da la API), los inactivos en gris al final. */
export function PlayerList({ players, onSelect }: PlayerListProps) {
  return (
    <ul className="divide-hairline hairline">
      {players.map((player) => (
        <li key={player.id}>
          <button
            type="button"
            onClick={() => onSelect(player)}
            aria-label={`Editar a ${player.name}${player.jersey_number === null ? '' : `, número ${player.jersey_number}`}, ${positionsLabel(player)}${player.is_active ? '' : ', inactivo'}`}
            className={[
              'flex min-h-16 w-full items-center gap-3 px-1 py-2.5 text-left',
              'transition-colors duration-150 ease-out hover:bg-surface/50 focus-visible:-outline-offset-2',
              player.is_active ? '' : 'opacity-60 grayscale',
            ].join(' ')}
          >
            <JerseyBadge player={player} />
            <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="truncate text-lg font-bold text-ink">
                {player.name}
                {!player.is_active && <span className="ml-2 text-xs font-bold tracking-wide text-ink-soft uppercase">Inactivo</span>}
              </span>
              <PlayerPositions player={player} />
            </span>
            <span aria-hidden className="btn btn-secondary btn-static size-10 shrink-0">
              <PencilIcon className="size-4" strokeWidth={2} />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function PlayerListSkeleton() {
  return (
    <div className="divide-hairline hairline" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex min-h-16 items-center gap-3 px-1">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  )
}
