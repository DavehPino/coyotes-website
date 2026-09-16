import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type RefObject } from 'react'
import { PLAYER_POSITION_LABELS, type PlayerPosition } from '@shared/domain'
import type { Player } from '@shared/schemas'
import { PositionFilter } from '../PositionFilter'
import { positionsLabel } from '../positions'
import { PlayerToken } from './PlayerToken'
import type { BoardDragBinder } from './useBoardDrag'

type BenchProps = {
  /** Activos fuera de la cancha, ya filtrados y ordenados. */
  players: Player[]
  /** Total en el banco sin filtrar (para el título y el estado vacío). */
  total: number
  filter: PlayerPosition | null
  onFilterChange: (value: PlayerPosition | null) => void
  selectedId: string | null
  draggingId: string | null
  /** Se arrastra una ficha de la cancha por encima: soltarla la devuelve al banco. */
  highlighted: boolean
  /** Hay una ficha de la cancha seleccionada: tocar el banco la devuelve. */
  canReceive: boolean
  /** Ficha que debe recibir el foco (p.ej. tras moverla con el teclado). Cada petición es un objeto nuevo. */
  focusRequest: { playerId: string } | null
  benchRef: RefObject<HTMLDivElement | null>
  bind: BoardDragBinder
  onTap: () => void
  onTokenClick: (playerId: string, event: MouseEvent) => void
  onTokenKeyDown: (playerId: string, event: KeyboardEvent) => void
}

/**
 * Jugadores activos que no están en cancha. En móvil vertical es una tira horizontal bajo la cancha;
 * en escritorio u horizontal, una columna lateral.
 */
export function Bench({
  players,
  total,
  filter,
  onFilterChange,
  selectedId,
  draggingId,
  highlighted,
  canReceive,
  focusRequest,
  benchRef,
  bind,
  onTap,
  onTokenClick,
  onTokenKeyDown,
}: BenchProps) {
  const tokenRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    if (focusRequest) tokenRefs.current.get(focusRequest.playerId)?.focus()
  }, [focusRequest])

  return (
    <div
      ref={benchRef}
      onClick={(event) => {
        if (event.detail !== 0 && !(event.target as Element).closest('[data-token], button')) onTap()
      }}
      className={[
        'flex min-h-0 shrink-0 flex-col gap-2 border-t border-coyote-rust/50 bg-coyote-night pt-2 pb-2',
        'transition-[background-color,box-shadow] duration-150 ease-out',
        'wide:w-60 wide:border-t-0 wide:border-l wide:pt-3 lg:w-72',
        highlighted ? 'bg-coyote-ember shadow-[inset_0_0_0_2px_var(--color-coyote-gold)]' : '',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between gap-2 px-3">
        <h3 className="text-2xl leading-none text-coyote-silver">
          Banco <span className="font-sans text-sm font-medium text-coyote-ash tabular-nums">({total})</span>
        </h3>
        {canReceive && (
          <button
            type="button"
            onClick={onTap}
            className="min-h-9 rounded-lg px-2 text-xs font-semibold text-coyote-gold hover:bg-coyote-ember"
          >
            Devolver al banco
          </button>
        )}
      </div>

      <PositionFilter
        compact
        label="Filtrar el banco por posición"
        value={filter}
        onChange={onFilterChange}
        className="scrollbar-none shrink-0 overflow-x-auto px-3 wide:flex-wrap"
      />

      {players.length === 0 ? (
        <p className="px-3 py-3 text-sm text-coyote-ash wide:py-6">
          {total === 0 ? 'Todos los jugadores activos están en cancha.' : 'Nadie en el banco con esa posición.'}
        </p>
      ) : (
        <ul
          aria-label="Jugadores en el banco"
          className={[
            'scrollbar-none flex min-h-0 gap-1 overflow-x-auto px-2 pb-1',
            'wide:grid wide:grid-cols-3 wide:content-start wide:gap-y-2 wide:overflow-x-hidden wide:overflow-y-auto',
          ].join(' ')}
        >
          {players.map((player) => (
            <li key={player.id} className="flex shrink-0 justify-center">
              <PlayerToken
                ref={(element) => {
                  if (element) tokenRefs.current.set(player.id, element)
                  else tokenRefs.current.delete(player.id)
                }}
                player={player}
                selected={selectedId === player.id}
                ghosted={draggingId === player.id}
                touch="pan-x"
                aria-label={`${player.name}, ${positionsLabel(player)}, en el banco`}
                title={`${player.name} · ${PLAYER_POSITION_LABELS[player.primary_position]}`}
                className="w-[4.75rem] wide:w-auto wide:[touch-action:pan-y]"
                {...bind(player.id, 'bench')}
                onClick={(event) => onTokenClick(player.id, event)}
                onKeyDown={(event) => onTokenKeyDown(player.id, event)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
