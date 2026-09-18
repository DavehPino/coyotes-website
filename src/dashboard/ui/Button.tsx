import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm' | 'icon'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  /** Desactiva el efecto de escala al pulsar (p.ej. controles que se pulsan muy seguido). */
  static?: boolean
}

/**
 * Rótulos de vinilo pegados al suelo: la acción principal es vinilo negro con las letras del club;
 * la secundaria, un rectángulo pintado (línea blanca de 2 px) con el texto en negro.
 */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-club hover:bg-ink/88',
  secondary: 'bg-line/40 text-ink shadow-tape hover:bg-line/80',
  ghost: 'text-ink-soft hover:bg-ink/8 hover:text-ink',
  /** Acciones que borran datos. */
  danger: 'bg-antenna text-white hover:bg-antenna/88',
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
  return [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-sm font-bold tracking-wide uppercase select-none',
    'transition-[background-color,color,box-shadow,scale] duration-150 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    isStatic ? '' : 'active:scale-[0.96]',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ')
}

export function Button({ variant, size, static: isStatic, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, static: isStatic, className })} {...rest} />
}
