import { formatDistanceToNowStrict } from 'date-fns'
import { es } from 'date-fns/locale'
import { lazy, Suspense, useMemo, useState } from 'react'
import type { PlayerPosition } from '@shared/domain'
import type { Lineup, Player } from '@shared/schemas'
import { useDialogSession } from '../admin/useDialogSession'
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../ui'
import { ChevronRightIcon, CourtIcon, PlusIcon, UsersIcon } from '../ui/icons'
import { useLineups, usePlayers } from './api'
import { indexPlayers, lineupSummary, type PlayersById } from './board/rules'
import { PlayerList, PlayerListSkeleton } from './PlayerList'
import { PositionFilter } from './PositionFilter'
import { matchesPosition } from './positions'
import { ShareLineupButton } from './share/ShareLineupButton'

// El formulario y la cancha solo se descargan la primera vez que se abren.
const PlayerDialog = lazy(() => import('./player/PlayerDialog'))
const LineupBoard = lazy(() => import('./board/LineupBoard'))

type BoardState = { open: boolean; lineupId: string | null; session: number }

/** Plantel y formaciones guardadas; la cancha se abre a pantalla completa. */
export function LineupPage() {
  const players = usePlayers()
  const lineups = useLineups()
  const [filter, setFilter] = useState<PlayerPosition | null>(null)
  const [editing, setEditing] = useState<Player | null>(null)
  const dialog = useDialogSession()
  const [board, setBoard] = useState<BoardState | null>(null)
  const byId = useMemo(() => indexPlayers(players.data ?? []), [players.data])

  const openNew = () => {
    setEditing(null)
    dialog.openDialog()
  }
  const openEdit = (player: Player) => {
    // Cada edición empieza del estado guardado del jugador.
    setEditing(player)
    dialog.restart()
    dialog.openDialog()
  }
  const openBoard = (lineupId: string | null) =>
    setBoard((prev) => ({ open: true, lineupId, session: (prev?.session ?? 0) + 1 }))

  const addButton = (
    <Button variant="primary" onClick={openNew} className="pr-4 pl-3.5">
      <PlusIcon className="size-4" strokeWidth={2} />
      Cargar jugador
    </Button>
  )

  const roster = players.data ?? []
  const visible = roster.filter((player) => matchesPosition(player, filter))
  const hasActive = roster.some((player) => player.is_active)

  return (
    <section className="flex flex-col gap-8">
      <PageHeader title="Alineación" description="El plantel y las formaciones del equipo." actions={addButton} />

      {/* ─── Formaciones ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl leading-none text-coyote-silver">Formaciones</h2>
          <Button onClick={() => openBoard(null)} disabled={!players.data} className="pr-4 pl-3.5">
            <CourtIcon className="size-4" strokeWidth={2} />
            Armar en cancha
          </Button>
        </div>

        {lineups.isPending || players.isPending ? (
          <Card className="divide-y divide-coyote-steel/50" aria-busy aria-label="Cargando formaciones">
            {[0, 1].map((i) => (
              <div key={i} className="flex min-h-16 items-center gap-3 px-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </Card>
        ) : lineups.isError ? (
          <ErrorState
            title="No se pudieron cargar las formaciones"
            message={lineups.error.message}
            onRetry={() => void lineups.refetch()}
            retrying={lineups.isFetching}
          />
        ) : lineups.data.length === 0 ? (
          <EmptyState
            icon={<CourtIcon className="size-8" />}
            title="Todavía no hay formaciones"
            description="Arrastra jugadores a la cancha y guarda la formación con un nombre para usarla después."
            action={
              <Button variant="primary" onClick={() => openBoard(null)} disabled={!hasActive} className="pr-4 pl-3.5">
                <CourtIcon className="size-4" strokeWidth={2} />
                Armar la primera
              </Button>
            }
          />
        ) : (
          <LineupList lineups={lineups.data} players={roster} byId={byId} onOpen={(lineup) => openBoard(lineup.id)} />
        )}
      </div>

      {/* ─── Plantel ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl leading-none text-coyote-silver">
            Plantel
            {players.data && (
              <span className="ml-2 font-sans text-base font-medium text-coyote-ash tabular-nums">
                ({roster.length})
              </span>
            )}
          </h2>
          {roster.length > 0 && (
            <PositionFilter
              label="Filtrar el plantel por posición"
              value={filter}
              onChange={setFilter}
              className="scrollbar-none -mx-4 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:px-0"
            />
          )}
        </div>

        {players.isPending ? (
          <PlayerListSkeleton />
        ) : players.isError ? (
          <ErrorState
            title="No se pudo cargar el plantel"
            message={players.error.message}
            onRetry={() => void players.refetch()}
            retrying={players.isFetching}
          />
        ) : roster.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="size-8" />}
            title="Todavía no hay jugadores"
            description="Carga el plantel para poder armar formaciones en la cancha."
            action={addButton}
          />
        ) : visible.length === 0 ? (
          <EmptyState title="Nadie juega en esa posición" description="Prueba con otro filtro." />
        ) : (
          <PlayerList players={visible} onSelect={openEdit} />
        )}
      </div>

      {dialog.mounted && (
        <Suspense fallback={null}>
          <PlayerDialog
            key={`${dialog.session}-${editing?.id ?? 'new'}`}
            open={dialog.open}
            player={editing}
            players={roster}
            lineups={lineups.data ?? []}
            onClose={dialog.close}
            onRestart={dialog.restart}
          />
        </Suspense>
      )}

      {board && players.data && lineups.data && (
        <Suspense fallback={null}>
          <LineupBoard
            key={board.session}
            open={board.open}
            initialLineupId={board.lineupId}
            players={players.data}
            lineups={lineups.data}
            onClose={() => setBoard((prev) => prev && { ...prev, open: false })}
          />
        </Suspense>
      )}
    </section>
  )
}

type LineupListProps = {
  lineups: Lineup[]
  players: Player[]
  byId: PlayersById
  onOpen: (lineup: Lineup) => void
}

function LineupList({ lineups, players, byId, onOpen }: LineupListProps) {
  return (
    <Card as="ul" className="divide-y divide-coyote-steel/50 overflow-hidden">
      {lineups.map((lineup) => {
        const edited = formatDistanceToNowStrict(new Date(lineup.updated_at), { locale: es, addSuffix: true })
        const summary = lineupSummary(lineup.slots, byId)
        return (
          <li key={lineup.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onOpen(lineup)}
              className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 pr-2 pl-4 text-left transition-colors duration-150 ease-out hover:bg-coyote-ember/50 focus-visible:-outline-offset-2"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="truncate font-medium text-coyote-silver">{lineup.name}</span>
                <span className="text-sm text-coyote-ash tabular-nums">
                  <span className="font-semibold text-coyote-gold">{summary}</span>
                  <span aria-hidden> · </span>
                  <span className="sr-only">, </span>
                  editada {edited}
                </span>
              </span>
              <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-coyote-ash" />
            </button>
            <div className="shrink-0 pr-2">
              <ShareLineupButton lineup={lineup} players={players} variant="icon" />
            </div>
          </li>
        )
      })}
    </Card>
  )
}
