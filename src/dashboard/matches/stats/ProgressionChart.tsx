import { useEffect, useId, useRef, useState } from 'react'
import type { MatchSetEvent } from '@shared/schemas'
import { EVENT_KIND_LABELS, isPoint, playerLabel, scorer } from './setStats'

type ProgressionChartProps = {
  events: MatchSetEvent[]
  usLabel: string
  themLabel: string
}

const HEIGHT = 184
const PAD = { top: 14, right: 14, bottom: 22, left: 30 }

/** Ancho real del contenedor: el SVG se dibuja en píxeles para que el texto no escale con el viewBox. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(element)
    setWidth(element.clientWidth)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0')

/**
 * Diferencia de puntos a lo largo del set (positiva: vamos por delante). Escalera con relleno dorado por encima
 * del cero y gris por debajo; los tiempos técnicos se marcan en el borde del lado que los pidió. Al pasar el
 * puntero (o el dedo) se muestra el punto: marcador, acción y jugador.
 */
export function ProgressionChart({ events, usLabel, themLabel }: ProgressionChartProps) {
  const [containerRef, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const clipId = useId()

  const points = events.filter(isPoint)
  const total = points.length
  const diffs = points.map((point) => point.us - point.them)
  const maxAbs = Math.max(2, ...diffs.map(Math.abs))

  const plotWidth = Math.max(0, width - PAD.left - PAD.right)
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const mid = PAD.top + plotHeight / 2
  const x = (index: number) => PAD.left + (total === 0 ? 0 : (index / total) * plotWidth)
  const y = (diff: number) => mid - (diff / maxAbs) * (plotHeight / 2)

  // Escalera: en cada punto sube o baja en vertical y avanza en horizontal hasta el siguiente.
  let path = `M${x(0)},${mid}`
  diffs.forEach((diff, index) => {
    path += `V${y(diff)}H${x(index + 1)}`
  })
  const area = `${path}V${mid}Z`

  // Tiempos técnicos: tras cuántos puntos se pidieron.
  const timeouts: { after: number; team: MatchSetEvent['team'] }[] = []
  let played = 0
  for (const event of events) {
    if (isPoint(event)) played += 1
    else if (event.kind === 'timeout') timeouts.push({ after: played, team: event.team })
  }

  const hovered = hover !== null ? points[hover - 1] : undefined

  /** Punto bajo el puntero: con ratón sigue al cursor; con el dedo, un toque lo fija hasta el siguiente. */
  const locate = (event: React.PointerEvent<SVGSVGElement>) => {
    if (total === 0 || plotWidth === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left - PAD.left) / plotWidth
    setHover(Math.min(total, Math.max(1, Math.ceil(ratio * total))))
  }

  const ticks = [maxAbs, Math.round(maxAbs / 2), 0, -Math.round(maxAbs / 2), -maxAbs].filter(
    (tick, index, all) => all.indexOf(tick) === index,
  )

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft" aria-label="Leyenda">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-accent" />
          {usLabel} por delante
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-ink-soft" />
          {themLabel} por delante
        </li>
        {timeouts.length > 0 && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border-2 border-ink" />
            Tiempo técnico
          </li>
        )}
      </ul>

      <div ref={containerRef} className="relative w-full touch-pan-y select-none">
        {width > 0 && (
          <svg
            role="img"
            aria-label={`Diferencia de puntos a lo largo del set: ${total} puntos jugados`}
            width={width}
            height={HEIGHT}
            className="block"
            onPointerDown={locate}
            onPointerMove={locate}
            onPointerLeave={(event) => {
              // El dedo siempre "sale" al levantarse: el punto fijado se queda hasta el siguiente toque.
              if (event.pointerType === 'mouse') setHover(null)
            }}
          >
            <defs>
              <clipPath id={`${clipId}-above`}>
                <rect x={0} y={0} width={width} height={mid} />
              </clipPath>
              <clipPath id={`${clipId}-below`}>
                <rect x={0} y={mid} width={width} height={HEIGHT - mid} />
              </clipPath>
            </defs>

            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  className={tick === 0 ? 'stroke-ink/30' : 'stroke-ink/20'}
                  strokeWidth={1}
                />
                <text x={PAD.left - 6} y={y(tick)} dy="0.35em" textAnchor="end" className="fill-ink-soft text-[10px] tabular-nums">
                  {signed(tick)}
                </text>
              </g>
            ))}

            {total > 0 && (
              <>
                <path d={area} className="fill-accent/25" clipPath={`url(#${clipId}-above)`} />
                <path d={area} className="fill-ink/15" clipPath={`url(#${clipId}-below)`} />
                <path d={path} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" clipPath={`url(#${clipId}-above)`} />
                <path d={path} fill="none" className="stroke-ink-soft" strokeWidth={2} strokeLinejoin="round" clipPath={`url(#${clipId}-below)`} />
              </>
            )}

            {timeouts.map((timeout, index) => (
              <circle
                key={index}
                cx={x(timeout.after)}
                cy={timeout.team === 'us' ? PAD.top - 6 : HEIGHT - PAD.bottom + 6}
                r={4}
                className="fill-surface stroke-ink"
                strokeWidth={2}
              >
                <title>{`Tiempo técnico de ${timeout.team === 'us' ? usLabel : themLabel} tras ${timeout.after} puntos`}</title>
              </circle>
            ))}

            <text x={PAD.left} y={HEIGHT - 6} className="fill-ink-soft text-[10px]">
              Inicio
            </text>
            <text x={width - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-ink-soft text-[10px] tabular-nums">
              {total} puntos
            </text>

            {hover !== null && hovered && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="stroke-ink/50" strokeWidth={1} />
                <circle
                  cx={x(hover)}
                  cy={y(diffs[hover - 1] ?? 0)}
                  r={5}
                  className={`${scorer(hovered) === 'us' ? 'fill-accent' : 'fill-ink-soft'} stroke-line`}
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>
        )}

        {hover !== null && hovered && (
          // Detalle visual del punto: el gráfico es una imagen y el punto a punto de abajo es su versión accesible.
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 z-10 w-max max-w-[14rem] rounded-sm bg-ink px-2.5 py-1.5 text-xs text-surface"
            style={x(hover) > width / 2 ? { right: width - x(hover) + 8 } : { left: x(hover) + 8 }}
          >
            <p className="font-bold text-xl leading-none tabular-nums">
              {hovered.us}–{hovered.them}
            </p>
            <p className="mt-1 text-ink-soft">
              Punto {hover} · {EVENT_KIND_LABELS[hovered.kind]}
              {hovered.player && ` · ${playerLabel(hovered.player)}`}
            </p>
            <p className="text-ink-soft">{hovered.team === 'us' ? usLabel : themLabel}</p>
          </div>
        )}
      </div>
    </div>
  )
}
