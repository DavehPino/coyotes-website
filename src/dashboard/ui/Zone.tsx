import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRightIcon } from './icons'

type ZoneProps = {
  /** Rótulo de la zona, pintado justo bajo la línea. */
  label: string
  /** Id del rótulo, para que la sección lo referencie con `aria-labelledby`. */
  id: string
  /** Enlace a la sección completa, p.ej. { to: '/matches', label: 'Ver partidos' }. */
  more?: { to: string; label: string }
  /** Controles a la derecha del rótulo (en lugar del enlace). */
  actions?: ReactNode
  /** Color de la línea superior; por defecto, pintura blanca. */
  line?: 'line' | 'tape' | 'podio' | 'ink'
  className?: string
  children: ReactNode
}

const LINES = {
  line: 'border-line',
  tape: 'border-tape',
  podio: 'border-podio',
  ink: 'border-ink',
} as const

/**
 * Zona del suelo: una línea pintada de 6 px arriba y el rótulo en vinilo pegado a ella. Sustituye a la
 * tarjeta: el contenido queda sobre el parquet y las zonas se separan por líneas, no por cajas.
 */
export function Zone({ label, id, more, actions, line = 'line', className = '', children }: ZoneProps) {
  return (
    <section aria-labelledby={id} className={['border-t-[6px] pt-2', LINES[line], className].join(' ')}>
      <div className="mb-3 flex min-h-11 items-center justify-between gap-3">
        <h2 id={id} className="text-2xl leading-none text-ink md:text-[1.75rem]">
          {label}
        </h2>
        {more ? (
          <Link
            to={more.to}
            className={[
              'group -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-bold tracking-wide uppercase',
              'text-ink-soft transition-colors duration-150 ease-out hover:text-ink md:min-h-9',
            ].join(' ')}
          >
            {more.label}
            <ArrowRightIcon
              className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </Link>
        ) : (
          actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </section>
  )
}
