import { Link } from 'react-router'
import type { MatchSummary } from '@shared/schemas'
import { formatDayMonth, formatMonthYear, formatWeekdayShort } from '@/lib/dates'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Chip, Skeleton, TeamLogo } from '../ui'
import { OUTCOME_LABELS, OUTCOME_TEXT_CLASSES, OUTCOME_TONES, ourScoreLabel } from './matchLabels'

type MatchListProps = { matches: MatchSummary[] }

function groupByMonth(matches: MatchSummary[]): { month: string; label: string; items: MatchSummary[] }[] {
  const groups = new Map<string, MatchSummary[]>()
  for (const match of matches) {
    const month = match.played_on.slice(0, 7)
    groups.set(month, [...(groups.get(month) ?? []), match])
  }
  return [...groups.entries()].map(([month, items]) => ({
    month,
    label: formatMonthYear(items[0]!.played_on),
    items,
  }))
}

/** Lista agrupada por mes: filas separadas por cinta, cada una enlaza al detalle. */
export function MatchList({ matches }: MatchListProps) {
  return (
    <div className="flex flex-col gap-6">
      {groupByMonth(matches).map((group) => (
        <section key={group.month} aria-labelledby={`month-${group.month}`}>
          <h3 id={`month-${group.month}`} className="mb-1 text-xl leading-none text-ink-soft">
            {group.label}
          </h3>
          <ul className="divide-tape tape-rule">
            {group.items.map((match) => {
              const date = parseISO(match.played_on)
              return (
                <li key={match.id}>
                  <Link
                    to={`/matches/${match.slug}`}
                    aria-label={`${format(date, "EEEE d 'de' MMMM", { locale: es })}, ${match.is_home ? 'local' : 'visitante'} contra ${match.opponent.name}: ${OUTCOME_LABELS[match.outcome]} ${ourScoreLabel(match)}`}
                    className={[
                      'grid min-h-16 grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 px-1 py-2',
                      'transition-colors duration-150 ease-out hover:bg-line/50',
                    ].join(' ')}
                  >
                    <span aria-hidden className="flex flex-col leading-tight uppercase">
                      <span className="text-lg font-extrabold text-ink">{formatDayMonth(match.played_on)}</span>
                      <span className="text-xs font-bold text-ink-soft">{formatWeekdayShort(match.played_on)}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TeamLogo team={match.opponent} size="md" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-lg font-bold text-ink">
                          {match.opponent.name}
                          <span className="ml-1.5 text-xs font-bold tracking-wide text-ink-soft uppercase">{match.is_home ? 'Local' : 'Visitante'}</span>
                        </span>
                        {(match.competition || match.phase) && (
                          <span className="truncate text-sm text-ink-soft">
                            {[match.competition?.name, match.phase].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`font-stencil text-3xl leading-none font-black ${OUTCOME_TEXT_CLASSES[match.outcome]}`}>
                        {ourScoreLabel(match)}
                      </span>
                      <Chip tone={OUTCOME_TONES[match.outcome]} className="max-sm:hidden">
                        {OUTCOME_LABELS[match.outcome]}
                      </Chip>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function MatchListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <Skeleton className="h-6 w-40" />
      <div className="divide-tape tape-rule">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 py-2">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="ml-auto h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
