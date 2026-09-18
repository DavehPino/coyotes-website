import { Link } from 'react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import { TEAM_NAME } from '@/config'
import type { MatchOutcome } from '@shared/domain'
import type { MatchSummary } from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { useMatch } from '../matches/api'
import { matchTitle, opponentLabel, OUTCOME_LABELS, OUTCOME_TONES, ourScoreLabel, setScoreParts, setWinner, videoCountLabel } from '../matches/matchLabels'
import { buttonClasses, Chip, Cue, EmptyState, ErrorState, MetaLine, Skeleton, TeamLogo, Zone } from '../ui'
import { BallIcon, FilmIcon } from '../ui/icons'
import { matchStats, streakLabel } from './stats'

type LastResultZoneProps = {
  query: UseQueryResult<MatchSummary[]>
}

/** Cuántos resultados se muestran en la tira de forma reciente. */
const RECENT = 5

/** Marca de cada resultado: acento del club para la victoria, etiqueta blanca para la derrota. */
const OUTCOME_MARKS: Record<MatchOutcome, { letter: string; classes: string }> = {
  win: { letter: 'V', classes: 'btn-primary' },
  loss: { letter: 'D', classes: 'btn-secondary' },
  pending: { letter: '·', classes: 'btn-secondary text-ink-soft' },
}

/** El último partido como marcador, sus parciales sobre la línea lateral y la forma reciente. */
export function LastResultZone({ query }: LastResultZoneProps) {
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
          description="Se cargan desde la sección Partidos, con su marcador y sus videos."
          action={
            <Link to="/matches" className={buttonClasses({ variant: 'primary', className: 'mt-1 pr-4 pl-3.5' })}>
              <BallIcon className="size-4" strokeWidth={2} />
              Ir a Partidos
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <Scoreboard match={last} />
          <SetMarks slug={last.slug} />
          <div className="hairline flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3">
            <span className="font-bold text-ink">{stats.streak ? streakLabel(stats.streak) : 'Sin resultados todavía'}</span>
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

/** Marcador: los dos equipos y los sets en cifras condensadas, con el rival a la derecha si jugamos de local. */
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
        <Chip tone={OUTCOME_TONES[match.outcome]} size="md">
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
        <span aria-hidden className="font-figures text-[5rem] leading-none font-black text-ink sm:text-[6rem]">
          {us}
          <span className="mx-1 text-ink-soft">–</span>
          {them}
        </span>
        <span className="flex min-w-0 flex-col items-end gap-1.5 text-right">
          <TeamLogo team={match.opponent} size="lg" loading="eager" />
          <span className="line-clamp-2 text-lg leading-tight font-extrabold text-ink uppercase">{opponentLabel(match)}</span>
        </span>
      </div>
      <p className="text-sm text-ink-soft transition-colors group-hover:text-ink">
        <MetaLine parts={[formatDateShort(match.played_on), match.competition?.name, match.phase]} />
      </p>
      <Cue>Ver partido</Cue>
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

  // Marcas apoyadas sobre la línea lateral: el set ganado lleva acento del club encima.
  return (
    <ol aria-label="Parciales" className="hairline grid grid-cols-5 gap-x-2">
      {sets.map((set, index) => {
        const [left, right] = setScoreParts(detail.data!, set)
        const winner = setWinner(set)
        return (
          <li
            key={index}
            className={[
              '-mt-0.5 flex flex-col items-center border-t-4 pt-2 leading-none',
              winner === 'us' ? 'border-accent text-ink' : 'border-transparent text-ink-soft',
            ].join(' ')}
          >
            <span className="font-figures text-2xl font-black sm:text-3xl">
              {left}-{right}
            </span>
            <span className="mt-1 text-[11px] font-bold tracking-wider uppercase">Set {index + 1}</span>
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
      className="group flex size-11 items-center justify-center"
    >
      <span aria-hidden className={`btn size-9 text-xl leading-none font-black ${mark.classes}`}>
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
