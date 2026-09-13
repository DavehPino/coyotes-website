import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'sm' | 'icon'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  /** Desactiva el efecto de escala al pulsar (p.ej. controles que se pulsan muy seguido). */
  static?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-coyote-gold text-coyote-black hover:bg-coyote-yellow',
  secondary: 'bg-coyote-ember text-coyote-silver shadow-border hover:shadow-border-hover hover:bg-coyote-rust/50',
  ghost: 'text-coyote-ash hover:bg-coyote-ember/60 hover:text-coyote-silver',
}

// Área de pulsación mínima de 44 px en todos los tamaños (uso principal desde el móvil).
const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 py-2 text-sm',
  sm: 'min-h-11 px-3 py-1.5 text-sm md:min-h-10',
  icon: 'size-11 p-0 md:size-10',
}

export function Button({ variant = 'secondary', size = 'md', static: isStatic, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium select-none',
        'transition-[background-color,color,box-shadow,scale] duration-150 ease-out',
        'disabled:pointer-events-none disabled:opacity-50',
        isStatic ? '' : 'active:scale-[0.96]',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    />
  )
}
