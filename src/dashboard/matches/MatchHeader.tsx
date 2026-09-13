import { TEAM_NAME } from '@/config'
import type { MatchDetail } from '@shared/schemas'
import { formatDateFull, shortTime } from '@/lib/dates'
import { Card, Chip, TeamLogo } from '../ui'
import { OUTCOME_LABELS, OUTCOME_TONES, scoreParts } from './matchLabels'

type MatchHeaderProps = { match: MatchDetail }

function TeamBlock({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {children}
      <span className="line-clamp-2 text-sm font-semibold text-coyote-silver md:text-base">{name}</span>
    </div>
  )
}

/** Cabecera del detalle: equipos, marcador, resultado y datos del partido. */
export function MatchHeader({ match }: MatchHeaderProps) {
  const [left, right] = scoreParts(match)
  const time = shortTime(match.start_time)
  const homeName = match.is_home ? TEAM_NAME : match.opponent.name
  const awayName = match.is_home ? match.opponent.name : TEAM_NAME

  return (
    <Card as="header" className="bg-ember-fade p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone={OUTCOME_TONES[match.outcome]} size="md">
          {OUTCOME_LABELS[match.outcome]}
        </Chip>
        {(match.competition || match.phase) && (
          <span className="text-sm text-coyote-ash">{[match.competition, match.phase].filter(Boolean).join(' · ')}</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
        <TeamBlock name={homeName}>
          <TeamLogo team={match.is_home ? null : match.opponent} size="xl" loading="eager" />
        </TeamBlock>
        <p
          aria-label={`Marcador de sets: ${left} a ${right}`}
          className="font-display text-7xl leading-none text-coyote-gold tabular-nums md:text-8xl"
        >
          {left}
          <span className="mx-2 text-coyote-rust md:mx-3">–</span>
          {right}
        </p>
        <TeamBlock name={awayName}>
          <TeamLogo team={match.is_home ? match.opponent : null} size="xl" loading="eager" />
        </TeamBlock>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-coyote-rust/50 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">Fecha</dt>
          <dd className="text-coyote-silver">
            {formatDateFull(match.played_on)}
            {time && <span className="tabular-nums"> · {time}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">Condición</dt>
          <dd className="text-coyote-silver">{match.is_home ? 'Local' : 'Visitante'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">Lugar</dt>
          <dd className="text-coyote-silver">{match.location ?? 'Sin especificar'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">Competición</dt>
          <dd className="text-coyote-silver">
            {[match.competition, match.phase].filter(Boolean).join(' · ') || 'Sin especificar'}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
