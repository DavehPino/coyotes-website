import type { ReactNode } from 'react'
import { InboxIcon } from './icons'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-coyote-steel px-6 py-12 text-center',
        className,
      ].join(' ')}
    >
      <span className="text-coyote-ash">{icon ?? <InboxIcon className="size-8" />}</span>
      <p className="font-medium text-coyote-silver">{title}</p>
      {description && <p className="max-w-sm text-sm text-coyote-ash">{description}</p>}
      {action}
    </div>
  )
}
