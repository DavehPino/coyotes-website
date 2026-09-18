type SkeletonProps = { className?: string }

/** Bloque de carga: una mancha de cinta sin pintar. Combina con clases de tamaño: `<Skeleton className="h-4 w-32" />`. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={['animate-pulse rounded-sm bg-ink/10', className].join(' ')} />
}
