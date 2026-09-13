import type { HTMLAttributes } from 'react'

export type ChipTone = 'gold' | 'gold-solid' | 'orange' | 'yellow' | 'rust' | 'silver' | 'ash' | 'steel' | 'podio'

const TONES: Record<ChipTone, string> = {
  gold: 'bg-coyote-gold/15 text-coyote-gold',
  'gold-solid': 'bg-coyote-gold text-coyote-black',
  orange: 'bg-coyote-orange/15 text-coyote-orange',
  yellow: 'bg-coyote-yellow/15 text-coyote-yellow',
  rust: 'bg-coyote-rust/45 text-coyote-silver',
  silver: 'bg-coyote-silver/12 text-coyote-silver',
  ash: 'bg-coyote-ash/12 text-coyote-ash',
  steel: 'bg-coyote-steel/70 text-coyote-silver',
  podio: 'bg-podio-mist text-podio-deep',
}

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone
  size?: 'sm' | 'md'
}

export function Chip({ tone = 'ash', size = 'sm', className = '', ...rest }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded-md font-semibold tracking-wide whitespace-nowrap uppercase',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px] leading-4' : 'px-2.5 py-1 text-xs leading-4',
        TONES[tone],
        className,
      ].join(' ')}
      {...rest}
    />
  )
}
