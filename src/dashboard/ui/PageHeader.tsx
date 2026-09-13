import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeftIcon } from './icons'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Enlace de vuelta, p.ej. { to: '/matches', label: 'Partidos' }. */
  back?: { to: string; label: string }
  /** Controles a la derecha del título (en móvil pasan debajo). */
  actions?: ReactNode
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 md:mb-6">
      {back && (
        <Link
          to={back.to}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-lg pr-3 pl-1 text-sm font-medium text-coyote-orange transition-colors duration-150 hover:text-coyote-gold md:min-h-9"
        >
          <ChevronLeftIcon className="size-4" strokeWidth={2} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-5xl leading-none text-coyote-gold md:text-6xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-coyote-ash">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">{actions}</div>}
      </div>
    </header>
  )
}
