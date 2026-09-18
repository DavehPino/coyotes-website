import { Link } from 'react-router'
import type { MatchSummary } from '@shared/schemas'
import { formatDateShort } from '@/lib/dates'
import { Chip, Cue, TeamLogo } from '../ui'
import { FilmIcon } from '../ui/icons'
import { matchTitle, OUTCOME_LABELS, OUTCOME_TONES, scoreParts, videoCountLabel } from './matchLabels'

type MatchCoverCardProps = {
  match: MatchSummary
  /** Primera del carrusel: su portada se carga sin `lazy`. */
  eager?: boolean
}

/**
 * Un partido en el carrusel: una zona de la hoja, abierta por su regla de tinta como las de Actividades, con
 * el marcador en cifras grandes entre los dos escudos. Sin marco ni tarjeta. Si el partido tiene foto, va
 * encima como franja. Toda la zona enlaza al detalle.
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
        'group flex h-full flex-col gap-3 border-t-[6px] border-line pt-3 pr-3 pb-1',
        'transition-[background-color,scale] duration-150 ease-out hover:bg-surface/40 active:scale-[0.98]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <Chip tone={OUTCOME_TONES[match.outcome]}>{OUTCOME_LABELS[match.outcome]}</Chip>
        {match.video_count > 0 && (
          <Chip tone="ash">
            <FilmIcon className="size-3" strokeWidth={2} />
            {videoCountLabel(match.video_count)}
          </Chip>
        )}
      </div>

      {match.cover_image_url && (
        <img src={match.cover_image_url} alt="" loading={loading} className="aspect-[16/7] w-full object-cover" />
      )}

      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <TeamLogo team={homeTeam} size="cover" loading={loading} />
        <p className="text-center font-figures text-6xl leading-none font-black text-ink sm:text-7xl">
          {left}
          <span className="mx-1 text-ink-soft">–</span>
          {right}
        </p>
        <TeamLogo team={awayTeam} size="cover" loading={loading} />
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="truncate text-lg leading-tight sm:text-xl">{matchTitle(match)}</h3>
        <p className="truncate text-xs text-ink-soft">{meta}</p>
      </div>
      <Cue className="mt-auto">Ver partido</Cue>
    </Link>
  )
}
