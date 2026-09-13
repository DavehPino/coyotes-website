import type { ComponentPropsWithoutRef, ElementType } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
  /** Resalta con anillo dorado (p.ej. columna de hoy, tarjeta activa). */
  highlighted?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Superficie base del dashboard. La profundidad la da una sombra-anillo translúcida,
 * de modo que funciona sobre cualquier fondo. Radio 16 px: los hijos con 8 px de
 * padding deben usar radio 8 px (radios concéntricos).
 */
export function Card<T extends ElementType = 'div'>({ as, highlighted, className = '', ...rest }: CardProps<T>) {
  const Component = as ?? 'div'
  return (
    <Component
      className={['rounded-2xl bg-coyote-night', highlighted ? 'shadow-gold' : 'shadow-border', className].join(' ')}
      {...rest}
    />
  )
}
