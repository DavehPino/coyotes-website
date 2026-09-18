import { Link } from 'react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import { TEAM_NAME } from '@/config'
import type { MatchOutcome } from '@shared/domain'
import type { MatchSummary } from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { useMatch } from '../matches/api'
import { matchTitle, opponentLabel, OUTCOME_LABELS, ourScoreLabel, setScoreParts, setWinner, videoCountLabel } from '../matches/matchLabels'
import { Button, Chip, EmptyState, ErrorState, Skeleton, TeamLogo, Zone } from '../ui'
import { BallIcon, FilmIcon, PlusIcon } from '../ui/icons'
import { matchStats, streakLabel } from './stats'

type LastResultZoneProps = {
  query: UseQueryResult<MatchSummary[]>
  onAdd: () => void
}

/** Cuántos resultados se muestran en la tira de forma reciente. */
const RECENT = 5

/** Marca de cada resultado: cinta del club para la victoria, cinta blanca para la derrota. */
const OUTCOME_MARKS: Record<MatchOutcome, { letter: string; classes: string }> = {
  win: { letter: 'V', classes: 'bg-ink text-club' },
  loss: { letter: 'D', classes: 'bg-line text-ink' },
  pending: { letter: '·', classes: 'bg-line text-ink-soft' },
}

/** El último partido como marcador de pared, sus parciales sobre la línea lateral y la forma reciente. */
export function LastResultZone({ query, onAdd }: LastResultZoneProps) {
  const matches = query.data ?? []
  const last = matches[0]
  const stats = matchStats(matches)

  return (
    <Zone id="home-last-match" label="Último resultado" more={{ to: '/matches', label: 'Partidos' }}>
      {query.isPending ? (
        <LastResultSkeleton />
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
            <Button variant="primary" onClick={onAdd} className="mt-1 pr-4 pl-3.5">
              <PlusIcon className="size-4" strokeWidth={2} />
              Cargar partido
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <Scoreboard match={last} />
          <SetMarks slug={last.slug} />
          <div className="tape-rule flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider text-ink-soft uppercase">Últimos resultados</span>
              <span className="font-bold text-ink">{stats.streak ? streakLabel(stats.streak) : 'Sin resultados todavía'}</span>
            </div>
            <ol aria-label="Resultados, del más reciente al más antiguo" className="-mr-1 flex items-center gap-1">
              {matches.slice(0, RECENT).map((match) => (
                <li key={match.id}>
                  <RecentResult match={match} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Zone>
  )
}

/** Marcador: los dos equipos y los sets en stencil, con el rival a la derecha si jugamos de local. */
function Scoreboard({ match }: { match: MatchSummary }) {
  const us = match.sets_won === null ? '–' : String(match.sets_won)
  const them = match.sets_lost === null ? '–' : String(match.sets_lost)
  const meta = [formatDateShort(match.played_on), match.competition?.name, match.phase].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/matches/${match.slug}`}
      aria-label={`${matchTitle(match)}, ${OUTCOME_LABELS[match.outcome]} ${ourScoreLabel(match)}, ${meta}. Ver partido`}
      className="group flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={match.outcome === 'win' ? 'gold' : match.outcome === 'loss' ? 'orange' : 'ash'} size="md">
          {OUTCOME_LABELS[match.outcome]}
        </Chip>
        {match.video_count > 0 && (
          <Chip tone="silver" size="md">
            <FilmIcon className="size-3.5" strokeWidth={2} />
            {videoCountLabel(match.video_count)}
          </Chip>
        )}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3">
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <TeamLogo team={null} size="lg" loading="eager" />
          <span className="line-clamp-2 text-lg leading-tight font-extrabold text-ink uppercase">{TEAM_NAME}</span>
        </span>
        <span aria-hidden className="font-stencil text-[5rem] leading-none font-black text-ink sm:text-[6rem]">
          {us}
          <span className="mx-1 text-ink-soft">–</span>
          {them}
        </span>
        <span className="flex min-w-0 flex-col items-end gap-1.5 text-right">
          <TeamLogo team={match.opponent} size="lg" loading="eager" />
          <span className="line-clamp-2 text-lg leading-tight font-extrabold text-ink uppercase">{opponentLabel(match)}</span>
        </span>
      </div>
      <p className="text-sm text-ink-soft transition-colors group-hover:text-ink">{meta}</p>
    </Link>
  )
}

/** Los parciales del último partido como marcas sobre la línea lateral (llegan con el detalle del partido). */
function SetMarks({ slug }: { slug: string }) {
  const detail = useMatch(slug)
  const sets = detail.data?.set_scores ?? []
  if (detail.isPending) {
    return (
      <div className="flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-16" />
        ))}
      </div>
    )
  }
  if (!detail.data || sets.length === 0) return null

  // Marcas apoyadas sobre la línea lateral: el set ganado lleva cinta del club encima.
  return (
    <ol aria-label="Parciales" className="tape-rule grid grid-cols-5 gap-x-2">
      {sets.map((set, index) => {
        const [left, right] = setScoreParts(detail.data!, set)
        const winner = setWinner(set)
        return (
          <li
            key={index}
            className={[
              '-mt-0.5 flex flex-col items-center border-t-4 pt-2 leading-none',
              winner === 'us' ? 'border-tape text-ink' : 'border-transparent text-ink-soft',
            ].join(' ')}
          >
            <span className="font-stencil text-2xl font-black sm:text-3xl">
              {left}-{right}
            </span>
            <span className="mt-1 text-[10px] font-bold tracking-wider uppercase opacity-80">Set {index + 1}</span>
            <span className="sr-only">, {winner === 'us' ? TEAM_NAME : winner === 'them' ? 'rival' : 'empate'}</span>
          </li>
        )
      })}
    </ol>
  )
}

function RecentResult({ match }: { match: MatchSummary }) {
  const mark = OUTCOME_MARKS[match.outcome]
  return (
    <Link
      to={`/matches/${match.slug}`}
      aria-label={`${matchTitle(match)}, ${OUTCOME_LABELS[match.outcome]} ${ourScoreLabel(match)}, ${formatDateShort(match.played_on)}`}
      title={`${matchTitle(match, true)} · ${ourScoreLabel(match)}`}
      className="flex size-11 items-center justify-center rounded-sm transition-[background-color,scale] duration-150 ease-out hover:bg-line/60 active:scale-[0.96]"
    >
      <span aria-hidden className={`flex size-8 items-center justify-center rounded-[2px] text-xl leading-none font-black ${mark.classes}`}>
        {mark.letter}
      </span>
    </Link>
  )
}

function LastResultSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label="Cargando último partido">
      <Skeleton className="h-6 w-28" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-20 w-36" />
        <Skeleton className="ml-auto size-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-16" />
        ))}
      </div>
    </div>
  )
}
