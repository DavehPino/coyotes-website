import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm' | 'icon'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  /** Desactiva el hundimiento al pulsar (p.ej. controles que se pulsan muy seguido). */
  static?: boolean
}

/**
 * El cuerpo del botón vive en `index.css` (`.btn`, `.btn-primary`…): relleno sólido, contorno y un canto
 * desplazado que desaparece al pulsar. Los colores salen de los tokens del club (`key`, `on-key`), así que otro
 * club cambia el botón sin tocar este componente. El fantasma es una celda con contorno y sin canto: tiene que leerse como botón, no como texto
 * suelto. El gris plano queda solo para lo desactivado.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  /** Acciones que borran datos. */
  danger: 'btn-danger',
}

// Área de pulsación mínima de 44 px en todos los tamaños (uso principal desde el móvil).
const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 py-2 text-[0.9375rem]',
  sm: 'min-h-11 px-3 py-1.5 text-[0.9375rem] md:min-h-10',
  icon: 'size-11 p-0 md:size-10',
}

/** Clases del botón, también para enlaces con aspecto de botón (`<Link className={buttonClasses(...)}>`). */
export function buttonClasses({
  variant = 'secondary',
  size = 'md',
  static: isStatic = false,
  className = '',
}: Pick<ButtonProps, 'variant' | 'size' | 'static' | 'className'> = {}) {
  return ['btn', isStatic ? 'btn-static' : '', VARIANTS[variant], SIZES[size], className].join(' ')
}

export function Button({ variant, size, static: isStatic, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, static: isStatic, className })} {...rest} />
}
