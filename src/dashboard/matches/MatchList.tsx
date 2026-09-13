import { Link } from 'react-router'
import type { MatchSummary } from '@shared/schemas'
import { formatMonthYear } from '@/lib/dates'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, Chip, Skeleton, TeamLogo } from '../ui'
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

/** Lista compacta agrupada por mes. Cada fila enlaza al detalle. */
export function MatchList({ matches }: MatchListProps) {
  return (
    <div className="flex flex-col gap-5">
      {groupByMonth(matches).map((group) => (
        <section key={group.month} aria-labelledby={`month-${group.month}`}>
          <h3 id={`month-${group.month}`} className="mb-2 text-2xl leading-none text-coyote-ash">
            {group.label}
          </h3>
          <Card as="ul" className="divide-y divide-coyote-steel/60 p-1">
            {group.items.map((match) => {
              const date = parseISO(match.played_on)
              return (
                <li key={match.id}>
                  <Link
                    to={`/matches/${match.slug}`}
                    aria-label={`${format(date, "EEEE d 'de' MMMM", { locale: es })}, ${match.is_home ? 'local' : 'visitante'} contra ${match.opponent.name}: ${OUTCOME_LABELS[match.outcome]} ${ourScoreLabel(match)}`}
                    className={[
                      'grid min-h-14 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2',
                      'transition-colors duration-150 ease-out hover:bg-coyote-ember/45 md:px-3',
                    ].join(' ')}
                  >
                    <span aria-hidden className="flex flex-col leading-tight text-coyote-ash tabular-nums">
                      <span className="text-sm font-medium text-coyote-silver">{format(date, 'd MMM', { locale: es })}</span>
                      <span className="text-xs">{format(date, 'EEE', { locale: es })}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TeamLogo team={match.opponent} size="md" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-coyote-silver">
                          {match.opponent.name}
                          <span className="ml-1.5 text-xs font-normal text-coyote-ash">{match.is_home ? 'Local' : 'Visitante'}</span>
                        </span>
                        {match.competition && (
                          <span className="truncate text-xs text-coyote-ash">
                            {[match.competition, match.phase].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`font-display text-3xl leading-none tabular-nums ${OUTCOME_TEXT_CLASSES[match.outcome]}`}>
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
          </Card>
        </section>
      ))}
    </div>
  )
}

export function MatchListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      <Skeleton className="h-6 w-40" />
      <Card className="flex flex-col gap-1 p-1">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </Card>
    </div>
  )
}
