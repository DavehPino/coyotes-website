import { useState, type ReactNode } from 'react'
import { TEAM_NAME } from '@/config'
import { ApiError } from '@/lib/api'
import { formatDateFull } from '@/lib/dates'
import type { MatchDetail, MatchSetEvent, MatchSetStats, MatchStats } from '@shared/schemas'
import { Chip, EmptyState, ErrorState, Modal, Skeleton, TabList, TabPanel, Tabs, type TabItem } from '../../ui'
import { useMatchStats } from '../api'
import { matchTitle, opponentLabel } from '../matchLabels'
import { PlayerStatsTable, type PlayerStatsRow } from './PlayerStatsTable'
import { ProgressionChart } from './ProgressionChart'
import { EVENT_KIND_LABELS, isPoint, longestRuns, maxLeads, playerLabel, playerLines, scorer } from './setStats'
import { StartingLineup } from './StartingLineup'
import { TeamStatBars } from './TeamStatBars'

type SetStatsDialogProps = {
  open: boolean
  match: MatchDetail
  /** Set que se abre al principio (1 = primero). */
  initialSet: number
  onClose: () => void
}

/** Pestaña: número de set o el partido completo. */
type Tab = number | 'match'

/** Progresión punto a punto, estadísticas y formación de cada set, y los totales del partido, desde CourtTrack. */
export default function SetStatsDialog({ open, match, initialSet, onClose }: SetStatsDialogProps) {
  const query = useMatchStats(match.slug)
  const [tab, setTab] = useState<Tab>(initialSet)
  const stats = query.data
  const themLabel = opponentLabel(match)

  // Mientras cargan las estadísticas, las pestañas salen de los parciales ya conocidos.
  const tabs: { number: number; us: number; them: number }[] = stats
    ? stats.sets.map((set) => ({ number: set.number, ...set.score }))
    : match.set_scores.map((score, index) => ({ number: index + 1, ...score }))
  const currentSet = stats?.sets.find((set) => set.number === tab)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Progresión y estadísticas"
      meta={
        <>
          <Chip tone="podio">CourtTrack</Chip>
          <span className="text-xs text-ink-soft">
            {matchTitle(match)} · {formatDateFull(match.played_on)}
          </span>
        </>
      }
      scrollResetKey={String(tab)}
    >
      <Tabs value={tab} onChange={setTab}>
        <div className="flex flex-col gap-5">
          <TabBar tabs={tabs} />
          <TabPanel value={tab} className="flex flex-col gap-5">
            {query.isPending ? (
              <StatsSkeleton />
            ) : query.isError ? (
              <StatsError error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
            ) : tab === 'match' ? (
              <MatchPanel stats={stats!} themLabel={themLabel} />
            ) : currentSet ? (
              <SetPanel set={currentSet} themLabel={themLabel} />
            ) : (
              <EmptyState title="Sin datos de este set" description="CourtTrack no tiene registrado este set del partido." />
            )}
          </TabPanel>
        </div>
      </Tabs>
    </Modal>
  )
}

function TabBar({ tabs }: { tabs: { number: number; us: number; them: number }[] }) {
  const items: TabItem<Tab>[] = [
    ...tabs.map((set) => ({
      value: set.number,
      children: (
        <>
          <span className="text-[10px] font-medium tracking-wide uppercase">Set {set.number}</span>
          <span className="font-bold text-xl leading-none tabular-nums">
            {set.us}-{set.them}
          </span>
        </>
      ),
    })),
    {
      value: 'match',
      children: (
        <>
          <span className="text-[10px] font-medium tracking-wide uppercase">Partido</span>
          <span className="text-sm leading-5">Totales</span>
        </>
      ),
    },
  ]
  return (
    // Radio exterior 12 px = interior 8 px + 4 px de padding. scroll-px: al enfocar una pestaña con el teclado,
    // la tira la trae a la vista conservando el margen lateral.
    <div className="-mx-5 flex scroll-px-6 overflow-x-auto px-5">
      <TabList
        label="Set"
        items={items}
        className="flex shrink-0 gap-1 rounded-md bg-line/40 p-1 shadow-tape"
        tabClassName="min-w-[4.5rem] shrink-0 flex-col px-3 py-1"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-2xl leading-none text-ink">{title}</h3>
      {children}
    </section>
  )
}

/** Un dato del set como fila sobre una regla de cinta: rótulo a la izquierda, valor a la derecha. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tape-rule flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">{label}</dt>
      <dd className="text-right text-sm font-bold text-ink">{children}</dd>
    </div>
  )
}

function SetPanel({ set, themLabel }: { set: MatchSetStats; themLabel: string }) {
  const runs = longestRuns(set.events)
  const leads = maxLeads(set.events)
  const rows: PlayerStatsRow[] = playerLines(set.events, 'us')

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <p className="flex items-baseline gap-2">
          <span className="font-bold text-5xl leading-none text-ink tabular-nums">{set.score.us}</span>
          <span className="font-bold text-3xl leading-none text-ink-soft">–</span>
          <span className="font-bold text-5xl leading-none text-ink tabular-nums">{set.score.them}</span>
        </p>
        <p className="text-xs text-ink-soft">
          {TEAM_NAME} / {themLabel}
        </p>
      </header>

      <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
        <Fact label="Duración">{set.duration_minutes === null ? '–' : `${set.duration_minutes} min`}</Fact>
        <Fact label="Tiempos">
          {set.timeouts.us}
          <span className="text-ink-soft"> / </span>
          {set.timeouts.them}
        </Fact>
        <Fact label="Cambios">
          {set.substitutions.us}
          <span className="text-ink-soft"> / </span>
          {set.substitutions.them}
        </Fact>
        <Fact label="Mayor racha">
          {runs.us}
          <span className="text-ink-soft"> / </span>
          {runs.them}
        </Fact>
        <Fact label="Máxima ventaja">
          +{leads.us}
          <span className="text-ink-soft"> / </span>+{leads.them}
        </Fact>
      </dl>

      <Section title="Progresión">
        {set.events.length === 0 ? (
          <p className="text-sm text-ink-soft">CourtTrack no registró la progresión de este set.</p>
        ) : (
          <>
            <ProgressionChart events={set.events} usLabel={TEAM_NAME} themLabel={themLabel} />
            <PointByPoint events={set.events} themLabel={themLabel} />
          </>
        )}
      </Section>

      <Section title="Cómo se hicieron los puntos">
        <TeamStatBars us={set.stats.us} them={set.stats.them} usLabel={TEAM_NAME} themLabel={themLabel} />
      </Section>

      <Section title={`Jugadores de ${TEAM_NAME}`}>
        <PlayerStatsTable rows={rows} emptyMessage="Sin acciones registradas de nuestros jugadores en este set." />
      </Section>

      <Section title="Formación inicial">
        <StartingLineup lineup={set.lineup} />
      </Section>
    </>
  )
}

/** Lista plegada de todos los puntos del set: la versión en tabla del gráfico. */
function PointByPoint({ events, themLabel }: { events: MatchSetEvent[]; themLabel: string }) {
  let point = 0
  return (
    <details className="group rounded-md bg-floor-deep/40">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm text-ink-soft select-none hover:text-ink">
        <span className="group-open:hidden">Ver punto a punto</span>
        <span className="hidden group-open:inline">Ocultar punto a punto</span>
      </summary>
      <ol className="max-h-72 overflow-y-auto px-3 pb-3 text-sm">
        {events.map((event, index) => {
          const scoring = isPoint(event)
          if (scoring) point += 1
          const team = event.team === 'us' ? TEAM_NAME : themLabel
          return (
            <li key={index} className={`flex items-start gap-2 py-1 ${scoring ? '' : 'text-ink-soft italic'}`}>
              <span className="w-12 shrink-0 font-semibold tabular-nums text-ink">
                {scoring ? `${event.us}–${event.them}` : ''}
              </span>
              {scoring && (
                <span
                  aria-label={scorer(event) === 'us' ? `Punto de ${TEAM_NAME}` : `Punto de ${themLabel}`}
                  className={`mt-[7px] size-2 shrink-0 rounded-full ${scorer(event) === 'us' ? 'bg-ink' : 'bg-ink-soft'}`}
                />
              )}
              <span className="min-w-0">
                {EVENT_KIND_LABELS[event.kind]}
                {event.player && ` · ${playerLabel(event.player)}`}
                {event.detail && ` · ${event.detail}`}
                <span className="text-ink-soft"> · {team}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </details>
  )
}

function MatchPanel({ stats, themLabel }: { stats: MatchStats; themLabel: string }) {
  const rows: PlayerStatsRow[] = stats.players.map((player) => ({
    key: String(player.id),
    number: player.number,
    name: player.short_name,
    captain: player.captain,
    libero: player.libero,
    points: player.attacks + player.aces + player.blocks,
    errors: player.serve_errors + player.unforced_errors,
    attacks: player.attacks,
    aces: player.aces,
    blocks: player.blocks,
    serve_errors: player.serve_errors,
    unforced_errors: player.unforced_errors,
    rallies: player.rallies,
    rating: player.rating,
  }))
  const schedule = [stats.started_at, stats.ended_at].filter(Boolean).join(' – ')

  return (
    <>
      <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
        <Fact label="Duración">{stats.duration ?? '–'}</Fact>
        <Fact label="Horario real">{schedule || '–'}</Fact>
        <Fact label="MVP del partido">
          {stats.mvp ? (
            <>
              {playerLabel(stats.mvp)}
              <span className="text-ink-soft"> · {stats.mvp.team === 'us' ? TEAM_NAME : themLabel}</span>
            </>
          ) : (
            '–'
          )}
        </Fact>
      </dl>

      <Section title="Cómo se hicieron los puntos">
        <TeamStatBars us={stats.totals.us} them={stats.totals.them} usLabel={TEAM_NAME} themLabel={themLabel} />
      </Section>

      <Section title={`Jugadores de ${TEAM_NAME}`}>
        <PlayerStatsTable rows={rows} matchColumns emptyMessage="CourtTrack no registró estadísticas de nuestros jugadores." />
      </Section>
    </>
  )
}

function StatsError({ error, onRetry, retrying }: { error: Error; onRetry: () => void; retrying: boolean }) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState
        title="Sin progresión ni estadísticas"
        description="Este partido no vino de CourtTrack. Solo los partidos sincronizados tienen el punto a punto."
      />
    )
  }
  if (error instanceof ApiError && error.status === 503) {
    return <EmptyState title="Sincronización no configurada" description={error.message} />
  }
  return <ErrorState title="No se pudieron cargar las estadísticas" message={error.message} onRetry={onRetry} retrying={retrying} />
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label="Cargando estadísticas">
      <Skeleton className="h-12 w-40" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-md" />
      <Skeleton className="h-40 rounded-md" />
    </div>
  )
}
