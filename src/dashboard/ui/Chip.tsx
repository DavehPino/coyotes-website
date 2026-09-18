import type { HTMLAttributes } from 'react'

/**
 * Cintas de suelo. Los nombres se conservan de la paleta anterior para no tocar cada uso;
 * el material es el mismo en todos: un rectángulo de cinta con el texto en mayúsculas.
 * - gold / gold-solid: vinilo negro con letras del club (victoria, lo principal)
 * - orange / yellow: cinta naranja del club (hoy, derrota, avisos)
 * - podio: cinta azul de Liga Podio
 * - silver / ash / steel / rust: cinta blanca pintada, texto negro (neutros)
 */
export type ChipTone = 'gold' | 'gold-solid' | 'orange' | 'yellow' | 'rust' | 'silver' | 'ash' | 'steel' | 'podio'

const TONES: Record<ChipTone, string> = {
  gold: 'bg-ink text-club',
  'gold-solid': 'bg-ink text-club',
  orange: 'bg-tape text-ink',
  yellow: 'bg-tape text-ink',
  rust: 'bg-line text-ink-soft',
  silver: 'bg-line text-ink',
  ash: 'bg-line text-ink-soft',
  steel: 'bg-line text-ink',
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
