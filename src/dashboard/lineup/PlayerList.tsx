import type { Player } from '@shared/schemas'
import { Card, Skeleton } from '../ui'
import { PencilIcon } from '../ui/icons'
import { JerseyBadge, PlayerPositions } from './PlayerChip'
import { positionsLabel } from './positions'

type PlayerListProps = {
  players: Player[]
  onSelect: (player: Player) => void
}

/** Plantel en lista: activos primero (el orden lo da la API), los inactivos atenuados al final. */
export function PlayerList({ players, onSelect }: PlayerListProps) {
  return (
    <Card as="ul" className="divide-y divide-coyote-steel/50 overflow-hidden">
      {players.map((player) => (
        <li key={player.id}>
          <button
            type="button"
            onClick={() => onSelect(player)}
            aria-label={`Editar a ${player.name}${player.jersey_number === null ? '' : `, número ${player.jersey_number}`}, ${positionsLabel(player)}${player.is_active ? '' : ', inactivo'}`}
            className={[
              'flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left md:px-4',
              'transition-colors duration-150 ease-out hover:bg-coyote-ember/50 focus-visible:-outline-offset-2',
              player.is_active ? '' : 'opacity-55',
            ].join(' ')}
          >
            <JerseyBadge player={player} />
            <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="truncate font-medium text-coyote-silver">
                {player.name}
                {!player.is_active && <span className="ml-2 text-xs font-normal text-coyote-ash">Inactivo</span>}
              </span>
              <PlayerPositions player={player} />
            </span>
            <PencilIcon aria-hidden className="size-4 shrink-0 text-coyote-ash" />
          </button>
        </li>
      ))}
    </Card>
  )
}

export function PlayerListSkeleton() {
  return (
    <Card className="divide-y divide-coyote-steel/50" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex min-h-16 items-center gap-3 px-3 md:px-4">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </Card>
  )
}
