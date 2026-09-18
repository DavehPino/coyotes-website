import { TEAM_NAME } from '@/config'
import type { MatchDetail } from '@shared/schemas'
import { formatDateFull, shortTime } from '@/lib/dates'
import { Chip, MetaLine, TeamLogo } from '../ui'
import { OUTCOME_LABELS, OUTCOME_TONES, scoreParts } from './matchLabels'

type MatchHeaderProps = { match: MatchDetail }

function TeamBlock({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {children}
      <span className="line-clamp-2 text-lg leading-tight font-extrabold text-ink uppercase md:text-xl">{name}</span>
    </div>
  )
}

/** Cabecera del detalle: el marcador en cifras condensadas y, bajo una filete, los datos del partido. */
export function MatchHeader({ match }: MatchHeaderProps) {
  const [left, right] = scoreParts(match)
  const time = shortTime(match.start_time)
  const homeName = match.is_home ? TEAM_NAME : match.opponent.name
  const awayName = match.is_home ? match.opponent.name : TEAM_NAME

  return (
    <header className="line-top pt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone={OUTCOME_TONES[match.outcome]} size="md">
          {OUTCOME_LABELS[match.outcome]}
        </Chip>
        {(match.competition || match.phase) && (
          <MetaLine className="text-ink-soft" parts={[match.competition?.name, match.phase]} />
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 md:gap-6">
        <TeamBlock name={homeName}>
          <TeamLogo team={match.is_home ? null : match.opponent} size="xl" loading="eager" />
        </TeamBlock>
        <p
          aria-label={`Marcador de sets: ${left} a ${right}`}
          className="font-figures text-7xl leading-none font-black text-ink sm:text-8xl md:text-[7.5rem]"
        >
          {left}
          <span className="mx-1 text-ink-soft sm:mx-2">–</span>
          {right}
        </p>
        <TeamBlock name={awayName}>
          <TeamLogo team={match.is_home ? match.opponent : null} size="xl" loading="eager" />
        </TeamBlock>
      </div>

      <dl className="hairline mt-5 grid grid-cols-1 gap-x-6 gap-y-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-bold tracking-wider text-ink-soft uppercase">Fecha</dt>
          <dd className="font-bold text-ink">
            {formatDateFull(match.played_on)}
            {time && <span> · {time}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold tracking-wider text-ink-soft uppercase">Condición</dt>
          <dd className="font-bold text-ink">{match.is_home ? 'Local' : 'Visitante'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold tracking-wider text-ink-soft uppercase">Lugar</dt>
          <dd className="font-bold text-ink">{match.location ?? 'Sin especificar'}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold tracking-wider text-ink-soft uppercase">Competición</dt>
          <dd className="font-bold text-ink">
            {match.competition || match.phase ? <MetaLine parts={[match.competition?.name, match.phase]} /> : 'Sin especificar'}
          </dd>
        </div>
      </dl>
    </header>
  )
}
