import { Link } from 'react-router'
import { ArrowRightIcon } from '../ui/icons'

type SectionHeaderProps = {
  title: string
  /** Id del título, para que la sección lo referencie con `aria-labelledby`. */
  id: string
  /** Enlace a la sección completa, p.ej. { to: '/matches', label: 'Ver todos' }. */
  more: { to: string; label: string }
}

/** Título de bloque de la Home con su enlace a la sección. */
export function SectionHeader({ title, id, more }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 id={id} className="text-3xl leading-none text-coyote-silver">
        {title}
      </h2>
      <Link
        to={more.to}
        className={[
          'group -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium',
          'text-coyote-orange transition-colors duration-150 ease-out hover:text-coyote-gold md:min-h-9',
        ].join(' ')}
      >
        {more.label}
        <ArrowRightIcon
          className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </Link>
    </div>
  )
}
