import type { ReactNode } from 'react'
import { ArrowRightIcon } from './icons'

type CueProps = {
  children: ReactNode
  /** `key`: tecla del club (la acción de la zona). `cell`: celda blanca con contorno (acciones secundarias). */
  tone?: 'cell' | 'key'
  className?: string
}

/**
 * Señal de «esto se pulsa» para bloques que son enteros un enlace o un botón (el último resultado, una actividad,
 * una portada). Tiene el cuerpo de una tecla, pero es solo visual: el control real es el bloque que la contiene,
 * así que va con `aria-hidden` y el nombre accesible lo da ese bloque. Al pasar el cursor por el bloque
 * (`group`), la flecha avanza.
 */
export function Cue({ children, tone = 'cell', className = '' }: CueProps) {
  return (
    <span
      aria-hidden
      className={[
        'btn btn-static min-h-10 w-fit gap-1.5 pr-3 pl-3.5 text-sm',
        tone === 'key' ? 'btn-primary' : 'btn-secondary',
        className,
      ].join(' ')}
    >
      {children}
      <ArrowRightIcon className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" strokeWidth={2} />
    </span>
  )
}
