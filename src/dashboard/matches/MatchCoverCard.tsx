import { Link } from 'react-router'
import type { MatchSummary } from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { Chip, TeamLogo } from '../ui'
import { FilmIcon } from '../ui/icons'
import { matchTitle, OUTCOME_LABELS, OUTCOME_TONES, scoreParts, videoCountLabel } from './matchLabels'

type MatchCoverCardProps = {
  match: MatchSummary
  /** Primera del carrusel: su portada se carga sin `lazy`. */
  eager?: boolean
}

/** Tarjeta con portada, compacta: en móvil caben casi dos por pantalla. Toda la tarjeta enlaza al detalle. */
export function MatchCoverCard({ match, eager }: MatchCoverCardProps) {
  const [left, right] = scoreParts(match)
  const meta = [formatDateShort(match.played_on), match.competition?.name, match.phase].filter(Boolean).join(' · ')
  const homeTeam = match.is_home ? null : match.opponent
  const awayTeam = match.is_home ? match.opponent : null
  const loading = eager ? 'eager' : 'lazy'

  return (
    <Link
      to={`/matches/${match.slug}`}
      aria-label={`${matchTitle(match)}, ${OUTCOME_LABELS[match.outcome]} ${left} a ${right}, ${meta}`}
      className={[
        'group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-coyote-night shadow-border',
        'transition-[box-shadow,scale] duration-150 ease-out hover:shadow-border-hover active:scale-[0.96]',
      ].join(' ')}
    >
      {match.cover_image_url ? (
        <img src={match.cover_image_url} alt="" loading={loading} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-ember-fade">
          {/* Escudos enfrentados en la franja libre entre los chips y el texto inferior */}
          <div className="absolute inset-x-0 top-9 bottom-20 flex items-center justify-center gap-4 sm:bottom-22 md:gap-6">
            <TeamLogo team={homeTeam} size="cover" loading={loading} />
            <span className="font-display text-xl text-coyote-rust md:text-2xl">VS</span>
            <TeamLogo team={awayTeam} size="cover" loading={loading} />
          </div>
        </div>
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-coyote-black via-coyote-black/50 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 md:p-3">
        <Chip tone={OUTCOME_TONES[match.outcome]}>{OUTCOME_LABELS[match.outcome]}</Chip>
        {match.video_count > 0 && (
          <Chip tone="steel">
            <FilmIcon className="size-3" strokeWidth={2} />
            {videoCountLabel(match.video_count)}
          </Chip>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 md:p-4">
        <h3 className="truncate text-base leading-tight text-coyote-silver sm:text-lg md:text-xl">{matchTitle(match)}</h3>
        <p className="font-display text-3xl leading-none text-coyote-gold tabular-nums sm:text-4xl">
          {left}
          <span className="mx-1.5 text-coyote-rust">–</span>
          {right}
        </p>
        <p className="truncate text-xs text-coyote-ash">{meta}</p>
      </div>
    </Link>
  )
}
