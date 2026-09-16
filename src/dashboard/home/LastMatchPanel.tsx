import { Link } from 'react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import type { MatchOutcome } from '@shared/domain'
import type { MatchSummary } from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { Button, Card, EmptyState, ErrorState, Skeleton } from '../ui'
import { BallIcon, PlusIcon } from '../ui/icons'
import { MatchCoverCard } from '../matches/MatchCoverCard'
import { matchTitle, OUTCOME_LABELS, ourScoreLabel } from '../matches/matchLabels'
import { SectionHeader } from './SectionHeader'
import { matchStats, streakLabel } from './stats'

type LastMatchPanelProps = {
  query: UseQueryResult<MatchSummary[]>
  onAdd: () => void
}

/** Cuántos resultados se muestran en la tira de forma reciente. */
const RECENT = 5

/** Inicial del resultado. Mismos tonos que los chips de Partidos. */
const OUTCOME_MARKS: Record<MatchOutcome, { letter: string; classes: string }> = {
  win: { letter: 'V', classes: 'bg-coyote-gold text-coyote-black' },
  loss: { letter: 'D', classes: 'bg-coyote-orange/15 text-coyote-orange' },
  pending: { letter: '·', classes: 'bg-coyote-ash/12 text-coyote-ash' },
}

/** El último partido con su portada y la forma de los cinco anteriores. */
export function LastMatchPanel({ query, onAdd }: LastMatchPanelProps) {
  const matches = query.data ?? []
  const last = matches[0]
  const stats = matchStats(matches)

  return (
    <section aria-labelledby="home-last-match">
      <SectionHeader id="home-last-match" title="Último partido" more={{ to: '/matches', label: 'Ver todos' }} />

      {query.isPending ? (
        <LastMatchPanelSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="No se pudieron cargar los partidos"
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : !last ? (
        <EmptyState
          icon={<BallIcon className="size-8" />}
          title="Todavía no hay partidos"
          description="Carga el primero con su marcador y sus videos."
          action={
            <Button variant="secondary" onClick={onAdd} className="mt-1 pr-4 pl-3.5">
              <PlusIcon className="size-4" strokeWidth={2} />
              Cargar partido
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <MatchCoverCard match={last} eager />
          <Card className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-3 md:p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold tracking-wide text-coyote-ash uppercase">Últimos resultados</span>
              <span className="text-sm text-coyote-silver">
                {stats.streak ? streakLabel(stats.streak) : 'Sin resultados todavía'}
              </span>
            </div>
            <ol aria-label="Resultados, del más reciente al más antiguo" className="-mr-1.5 flex items-center gap-0.5">
              {matches.slice(0, RECENT).map((match) => (
                <li key={match.id}>
                  <RecentResult match={match} />
                </li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </section>
  )
}

function RecentResult({ match }: { match: MatchSummary }) {
  const mark = OUTCOME_MARKS[match.outcome]
  return (
    <Link
      to={`/matches/${match.slug}`}
      aria-label={`${matchTitle(match)}, ${OUTCOME_LABELS[match.outcome]} ${ourScoreLabel(match)}, ${formatDateShort(match.played_on)}`}
      title={`${matchTitle(match, true)} · ${ourScoreLabel(match)}`}
      className={[
        'flex size-11 items-center justify-center rounded-xl',
        'transition-[background-color,scale] duration-150 ease-out hover:bg-coyote-ember/45 active:scale-[0.96]',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={`flex size-8 items-center justify-center rounded-md font-display text-xl leading-none ${mark.classes}`}
      >
        {mark.letter}
      </span>
    </Link>
  )
}

export function LastMatchPanelSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Cargando último partido">
      <Skeleton className="aspect-[4/3] rounded-2xl sm:aspect-[16/10]" />
      <Card className="flex items-center justify-between gap-4 p-3 md:p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-44" />
      </Card>
    </div>
  )
}
