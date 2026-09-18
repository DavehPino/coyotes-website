import { Link } from 'react-router'
import type { MatchSummary } from '@shared/schemas'
import { Skeleton } from '../ui'
import { matchStats } from './stats'

type SeasonLineProps = {
  matches: MatchSummary[]
  pending: boolean
}

/** Los números de temporada en una sola línea de fondo, como el rótulo de una cancha. */
export function SeasonLine({ matches, pending }: SeasonLineProps) {
  if (pending) {
    return (
      <div className="tape-rule pt-3" aria-hidden>
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
    )
  }
  const stats = matchStats(matches)
  const wins = matches.filter((match) => match.outcome === 'win').length
  const losses = matches.filter((match) => match.outcome === 'loss').length
  const items = [
    { label: stats.played === 1 ? 'partido' : 'partidos', value: stats.played },
    { label: wins === 1 ? 'victoria' : 'victorias', value: wins },
    { label: losses === 1 ? 'derrota' : 'derrotas', value: losses },
    { label: stats.videos === 1 ? 'video' : 'videos', value: stats.videos },
  ]

  return (
    <Link
      to="/matches"
      className="tape-rule group flex flex-wrap items-baseline gap-x-5 gap-y-1 pt-3 text-ink-soft uppercase transition-colors hover:text-ink"
    >
      <span className="text-xs font-bold tracking-[0.12em]">Temporada</span>
      {items.map((item) => (
        <span key={item.label} className="flex items-baseline gap-1">
          <span className="text-2xl leading-none font-black text-ink">{item.value}</span>
          <span className="text-xs font-bold tracking-wider">{item.label}</span>
        </span>
      ))}
    </Link>
  )
}
