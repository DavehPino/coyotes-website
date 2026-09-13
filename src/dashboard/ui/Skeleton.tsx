type SkeletonProps = { className?: string }

/** Bloque de carga. Combina con clases de tamaño: `<Skeleton className="h-4 w-32" />`. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={['animate-pulse rounded-md bg-coyote-steel/50', className].join(' ')} />
}
