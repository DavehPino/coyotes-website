import type { MatchSummary } from '@shared/schemas'
import { Skeleton } from '../ui'
import { matchStats } from './stats'

type SeasonLineProps = {
  matches: MatchSummary[]
  pending: boolean
}

/**
 * Los números de temporada al pie de Inicio. Es solo lectura: a Partidos ya se llega por la navegación, por la
 * zona del último resultado y por la tecla principal. En móvil van en una rejilla de cuatro columnas iguales
 * (cifra arriba, rótulo debajo) para que ninguna salte sola a otra línea; desde `sm` caben en una fila.
 */
export function SeasonLine({ matches, pending }: SeasonLineProps) {
  if (pending) {
    return (
      <div className="hairline pt-3" aria-hidden>
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
    <section
      aria-label="Temporada"
      className="hairline flex flex-col gap-3 pt-3 text-ink-soft uppercase sm:flex-row sm:items-baseline sm:gap-x-5"
    >
      <h2 className="text-xs font-bold tracking-[0.12em] text-ink-soft">Temporada</h2>
      <dl className="grid grid-cols-4 gap-x-3 sm:flex sm:gap-x-5">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col-reverse gap-1 sm:flex-row-reverse sm:items-baseline">
            <dt className="truncate text-xs font-bold tracking-wider">{item.label}</dt>
            <dd className="text-3xl leading-none font-black text-ink sm:text-2xl">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
