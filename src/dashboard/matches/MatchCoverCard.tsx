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

/**
 * Portada del partido: un rectángulo pintado sobre el suelo con los escudos (o la foto del partido) en la
 * franja central y el marcador en stencil de tinta debajo. Sin tarjeta oscura ni degradado: es el mismo
 * suelo con sus líneas. Toda la portada enlaza al detalle.
 */
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
        'group flex h-full flex-col gap-3 rounded-sm bg-line/25 p-3 shadow-tape',
        'transition-[box-shadow,scale] duration-150 ease-out hover:shadow-tape-hover active:scale-[0.97]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <Chip tone={OUTCOME_TONES[match.outcome]}>{OUTCOME_LABELS[match.outcome]}</Chip>
        {match.video_count > 0 && (
          <Chip tone="silver">
            <FilmIcon className="size-3" strokeWidth={2} />
            {videoCountLabel(match.video_count)}
          </Chip>
        )}
      </div>

      {match.cover_image_url ? (
        <img src={match.cover_image_url} alt="" loading={loading} className="aspect-[16/7] w-full rounded-[2px] object-cover" />
      ) : (
        <div className="flex aspect-[16/7] items-center justify-center gap-4 rounded-[2px] bg-floor-deep/60 md:gap-6">
          <TeamLogo team={homeTeam} size="cover" loading={loading} />
          <span className="text-xl font-black text-ink/60 uppercase md:text-2xl">vs</span>
          <TeamLogo team={awayTeam} size="cover" loading={loading} />
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <h3 className="truncate text-lg leading-tight sm:text-xl">{matchTitle(match)}</h3>
        <p className="font-stencil text-4xl leading-none font-black text-ink sm:text-5xl">
          {left}
          <span className="mx-1 text-ink-soft">–</span>
          {right}
        </p>
        <p className="truncate text-xs text-ink-soft">{meta}</p>
      </div>
    </Link>
  )
}
