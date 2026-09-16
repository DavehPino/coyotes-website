import type { MatchStatLine } from '@shared/schemas'
import { pointsBreakdown, STAT_COLUMNS } from './setStats'

type TeamStatBarsProps = {
  us: MatchStatLine | null
  them: MatchStatLine | null
  usLabel: string
  themLabel: string
}

/**
 * Acciones de los dos equipos enfrentadas: las nuestras crecen hacia la izquierda en dorado y las del rival hacia la
 * derecha en gris, con la categoría en el centro. Todas las barras comparten escala.
 */
export function TeamStatBars({ us, them, usLabel, themLabel }: TeamStatBarsProps) {
  if (!us && !them) {
    return <p className="text-sm text-coyote-ash">CourtTrack no registró estadísticas de este set.</p>
  }
  const max = Math.max(1, ...STAT_COLUMNS.flatMap(({ key }) => [us?.[key] ?? 0, them?.[key] ?? 0]))
  const breakdown = { us: us && pointsBreakdown(us, them), them: them && pointsBreakdown(them, us) }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4 text-xs font-semibold text-coyote-silver">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-coyote-gold" />
          {usLabel}
        </span>
        <span className="flex items-center gap-1.5 text-right">
          {themLabel}
          <span aria-hidden className="size-2.5 rounded-sm bg-coyote-ash" />
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {STAT_COLUMNS.map(({ key, label }) => {
          const left = us?.[key] ?? 0
          const right = them?.[key] ?? 0
          return (
            <li
              key={key}
              className="grid grid-cols-[1.75rem_1fr_minmax(6.5rem,auto)_1fr_1.75rem] items-center gap-2 text-sm"
              aria-label={`${label}: ${usLabel} ${left}, ${themLabel} ${right}`}
            >
              <span className="text-right font-semibold tabular-nums text-coyote-silver">{left}</span>
              <span className="flex h-2.5 justify-end">
                <span
                  className="h-full rounded-l-[4px] bg-coyote-gold transition-[width] duration-300 ease-out"
                  style={{ width: `${(left / max) * 100}%`, minWidth: left > 0 ? 3 : 0 }}
                />
              </span>
              <span className="text-center text-xs text-coyote-ash">{label}</span>
              <span className="flex h-2.5">
                <span
                  className="h-full rounded-r-[4px] bg-coyote-ash transition-[width] duration-300 ease-out"
                  style={{ width: `${(right / max) * 100}%`, minWidth: right > 0 ? 3 : 0 }}
                />
              </span>
              <span className="font-semibold tabular-nums text-coyote-silver">{right}</span>
            </li>
          )
        })}
      </ul>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-coyote-steel/60 pt-3 text-xs text-coyote-ash">
        {(['us', 'them'] as const).map((side) => {
          const line = side === 'us' ? us : them
          const parts = breakdown[side]
          return (
            <div key={side} className={side === 'them' ? 'text-right' : ''}>
              <dt className="sr-only">{side === 'us' ? usLabel : themLabel}</dt>
              <dd>
                <span className="font-display text-2xl leading-none text-coyote-silver tabular-nums">{line?.points ?? '–'}</span>{' '}
                puntos
              </dd>
              {parts && (
                <dd className="mt-0.5 tabular-nums">
                  {parts.earned} propios · {parts.gifted} por errores del rival
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </div>
  )
}
