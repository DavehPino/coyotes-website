import type { ComponentPropsWithoutRef, ElementType } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
  /** Resalta con cinta del club (p.ej. columna de hoy, elemento activo). */
  highlighted?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Rectángulo pintado sobre el suelo: sin relleno, solo una línea de 2 px (blanca, o cinta del club si
 * está destacado). No es una tarjeta: el contenido sigue apoyado en el parquet. Para bloques de página
 * con rótulo usa `Zone`; esto es para listas y agrupaciones pequeñas.
 */
export function Card<T extends ElementType = 'div'>({ as, highlighted, className = '', ...rest }: CardProps<T>) {
  const Component = as ?? 'div'
  return (
    <Component
      className={['rounded-md bg-line/25', highlighted ? 'shadow-tape-club' : 'shadow-tape', className].join(' ')}
      {...rest}
    />
  )
}
