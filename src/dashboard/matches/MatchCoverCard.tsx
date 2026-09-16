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

/** Tarjeta grande con portada. Toda la tarjeta enlaza al detalle. */
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
        'group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-coyote-night shadow-border sm:aspect-[16/10]',
        'transition-[box-shadow,scale] duration-150 ease-out hover:shadow-border-hover active:scale-[0.96]',
      ].join(' ')}
    >
      {match.cover_image_url ? (
        <img src={match.cover_image_url} alt="" loading={loading} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-ember-fade">
          {/* Escudos enfrentados en la franja libre entre los chips y el texto inferior */}
          <div className="absolute inset-x-0 top-12 bottom-32 flex items-center justify-center gap-5 sm:bottom-36 md:gap-10">
            <TeamLogo team={homeTeam} size="cover" loading={loading} />
            <span className="font-display text-3xl text-coyote-rust md:text-5xl">VS</span>
            <TeamLogo team={awayTeam} size="cover" loading={loading} />
          </div>
        </div>
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-coyote-black via-coyote-black/50 to-transparent" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 md:p-4">
        <Chip tone={OUTCOME_TONES[match.outcome]} size="md">
          {OUTCOME_LABELS[match.outcome]}
        </Chip>
        {match.video_count > 0 && (
          <Chip tone="steel" size="md">
            <FilmIcon className="size-3.5" strokeWidth={2} />
            {videoCountLabel(match.video_count)}
          </Chip>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 md:p-5">
        <h3 className="text-2xl leading-none text-coyote-silver sm:text-3xl md:text-4xl">{matchTitle(match)}</h3>
        <p className="font-display text-5xl leading-none text-coyote-gold tabular-nums sm:text-6xl md:text-7xl">
          {left}
          <span className="mx-2 text-coyote-rust">–</span>
          {right}
        </p>
        <p className="text-sm text-coyote-ash">{meta}</p>
      </div>
    </Link>
  )
}
