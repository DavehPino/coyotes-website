import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { PLAYER_POSITION_SHORT } from '@shared/domain'
import type { Player } from '@shared/schemas'
import { initialsOf, POSITION_STYLES, shortName } from '../positions'

type TokenFaceProps = {
  player: Player
  selected?: boolean
  /** Ficha grande del fantasma que se arrastra. */
  lifted?: boolean
}

/**
 * Cara de la ficha: círculo (≥ 44 px) con el color de la posición principal, el número (o iniciales) y la abreviatura.
 * Con dos posiciones, la secundaria es un anillo exterior. Debajo, el nombre corto.
 */
export function TokenFace({ player, selected = false, lifted = false }: TokenFaceProps) {
  const primary = POSITION_STYLES[player.primary_position]
  const secondary = player.secondary_position ? POSITION_STYLES[player.secondary_position] : null
  const label = player.jersey_number ?? initialsOf(player.name)

  return (
    <>
      <span
        className={[
          'relative flex size-12 shrink-0 flex-col items-center justify-center rounded-full border-2 border-white/85',
          primary.bg,
          primary.text,
          secondary ? `ring-[3px] ring-offset-2 ring-offset-coyote-black ${secondary.ring}` : '',
          lifted ? 'scale-110 shadow-[0_10px_24px_rgb(0_0_0/0.55)]' : 'shadow-[0_2px_6px_rgb(0_0_0/0.45)]',
        ].join(' ')}
      >
        <span
          className={[
            'font-display leading-none tabular-nums',
            typeof label === 'number' ? 'translate-y-0.5 text-[1.6rem]' : 'translate-y-px text-lg',
          ].join(' ')}
        >
          {label}
        </span>
        <span className="text-[8px] leading-none font-bold tracking-wide">
          {PLAYER_POSITION_SHORT[player.primary_position]}
        </span>
        {selected && (
          <span
            aria-hidden
            className={[
              'pointer-events-none absolute rounded-full border-[3px] border-coyote-gold',
              secondary ? '-inset-[9px]' : '-inset-[6px]',
            ].join(' ')}
          />
        )}
      </span>
      <span
        className={[
          'mt-1 max-w-[5.5rem] truncate rounded px-1 text-[11px] leading-4 font-semibold',
          selected ? 'bg-coyote-gold text-coyote-black' : 'bg-coyote-black/75 text-coyote-silver',
        ].join(' ')}
      >
        {shortName(player.name)}
      </span>
    </>
  )
}

type PlayerTokenProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  player: Player
  selected: boolean
  /** Mientras se arrastra, la ficha original queda como hueco. */
  ghosted?: boolean
  /** Gesto que se deja al navegador: en el banco, desplazar la tira sin bloquear el arrastre hacia la cancha. */
  touch?: 'none' | 'pan-x' | 'pan-y'
}

// Propiedad completa (no las utilidades touch-pan-*, que se combinan entre sí) para poder sustituirla por variante.
const TOUCH = { none: '[touch-action:none]', 'pan-x': '[touch-action:pan-x]', 'pan-y': '[touch-action:pan-y]' } as const

/** Ficha pulsable (banco y cancha). El arrastre y el teclado los pone quien la usa. */
export const PlayerToken = forwardRef<HTMLButtonElement, PlayerTokenProps>(function PlayerToken(
  { player, selected, ghosted = false, touch = 'none', className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      data-token
      aria-pressed={selected}
      className={[
        'flex flex-col items-center rounded-2xl p-0.5 select-none [-webkit-touch-callout:none]',
        TOUCH[touch],
        'transition-opacity duration-150 ease-out',
        ghosted ? 'opacity-25' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      <TokenFace player={player} selected={selected} />
    </button>
  )
})
