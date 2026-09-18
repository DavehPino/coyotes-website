import type { HTMLAttributes } from 'react'

/**
 * Etiquetas. Los nombres se conservan de la paleta anterior para no tocar cada uso;
 * el material es el mismo en todos: un rectángulo con el texto en mayúsculas.
 * - gold / gold-solid: tecla del club (negro con letras doradas) (victoria, lo principal)
 * - orange / yellow: acento naranja del club (hoy, avisos); nunca el resultado de un partido
 * - podio: etiqueta azul de Liga Podio
 * - silver / ash / steel / rust: etiqueta blanca, texto negro (neutros)
 */
export type ChipTone = 'gold' | 'gold-solid' | 'orange' | 'yellow' | 'rust' | 'silver' | 'ash' | 'steel' | 'podio'

const TONES: Record<ChipTone, string> = {
  gold: 'bg-key text-on-key',
  'gold-solid': 'bg-key text-on-key',
  orange: 'bg-accent text-on-accent',
  yellow: 'bg-accent text-on-accent',
  rust: 'bg-surface text-ink-soft shadow-[inset_0_0_0_1.5px_var(--color-ink-soft)]',
  silver: 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]',
  ash: 'bg-surface text-ink-soft shadow-[inset_0_0_0_1.5px_var(--color-ink-soft)]',
  steel: 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]',
  podio: 'bg-podio text-white',
}

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone
  size?: 'sm' | 'md'
}

export function Chip({ tone = 'ash', size = 'sm', className = '', ...rest }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded-[2px] font-bold tracking-wider whitespace-nowrap uppercase',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs leading-4' : 'px-2.5 py-1 text-sm leading-4',
        TONES[tone],
        className,
      ].join(' ')}
      {...rest}
    />
  )
}
