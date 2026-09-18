import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LOGO_SRC, TEAM_NAME } from '@/config'
import { ChevronLeftIcon } from './icons'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Enlace de vuelta, p.ej. { to: '/matches', label: 'Partidos' }. */
  back?: { to: string; label: string }
  /** Controles a la derecha del título (en móvil pasan debajo). */
  actions?: ReactNode
}

/**
 * La banda de la red: una franja blanca de lado a lado con el título en vinilo negro. Debajo lleva la línea
 * pintada del color de la sección (`--section-line`, que fija el layout según la ruta). En móvil la banda
 * también lleva el escudo y el nombre del club, porque ahí no hay pasillo lateral.
 */
export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <header
      className={[
        'on-line -mx-4 mb-6 flex flex-col gap-3 bg-line px-4 pt-3 pb-4 text-ink md:-mx-8 md:mb-8 md:px-8 md:pt-6 md:pb-5',
        'border-b-[6px] border-[color:var(--section-line,var(--color-line))]',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 md:hidden">
        <img src={LOGO_SRC} alt="" width={28} height={28} className="size-7 rounded-full" />
        <span className="text-sm font-extrabold tracking-[0.08em] uppercase">{TEAM_NAME}</span>
      </div>
      {back && (
        <Link
          to={back.to}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-sm pr-3 pl-1 text-sm font-bold tracking-wide text-ink-soft uppercase transition-colors duration-150 hover:text-ink md:min-h-9"
        >
          <ChevronLeftIcon className="size-4" strokeWidth={2} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[2.75rem] leading-[0.9] md:text-6xl">{title}</h1>
          {description && <p className="mt-1.5 text-ink-soft">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">{actions}</div>}
      </div>
    </header>
  )
}
