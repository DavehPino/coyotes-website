import type { ReactNode } from 'react'
import { InboxIcon } from './icons'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

/** Zona sin marcar todavía: un rectángulo de cinta discontinua sobre el suelo. */
export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-ink/30 px-6 py-12 text-center',
        className,
      ].join(' ')}
    >
      <span className="text-ink-soft">{icon ?? <InboxIcon className="size-8" />}</span>
      <p className="text-lg font-bold text-ink uppercase">{title}</p>
      {description && <p className="max-w-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  )
}
