import type { ComponentPropsWithoutRef, ElementType } from 'react'

type CardProps<T extends ElementType> = {
  as?: T
  /** Resalta con contorno de tinta plena (elemento elegido o activo). */
  highlighted?: boolean
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Recuadro sobre la hoja: casi sin relleno, solo un contorno de 2 px (de tinta suave, o de tinta plena de 3 px si
 * está destacado). No es una tarjeta: el contenido sigue apoyado en la hoja. Para bloques de página
 * con rótulo usa `Zone`; esto es para listas y agrupaciones pequeñas.
 */
export function Card<T extends ElementType = 'div'>({ as, highlighted, className = '', ...rest }: CardProps<T>) {
  const Component = as ?? 'div'
  return (
    <Component
      className={['rounded-md bg-surface/25', highlighted ? 'shadow-outline-selected' : 'shadow-outline', className].join(' ')}
      {...rest}
    />
  )
}
