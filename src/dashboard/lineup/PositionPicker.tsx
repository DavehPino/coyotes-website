import { useId, type ReactNode } from 'react'
import { PLAYER_POSITION_LABELS, PLAYER_POSITION_SHORT, PLAYER_POSITIONS, type PlayerPosition } from '@shared/domain'
import { POSITION_STYLES } from './positions'

type PositionPickerProps = {
  label: ReactNode
  value: PlayerPosition | null
  onChange: (value: PlayerPosition | null) => void
  /** Posición que no se puede elegir (en la secundaria, la principal). */
  disabledPosition?: PlayerPosition | null
  /** Añade «Ninguna» (posición secundaria). */
  allowNone?: boolean
  optional?: boolean
  error?: string | null
  autoFocus?: boolean
}

const OPTION = [
  'relative flex min-h-11 cursor-pointer items-center gap-2 rounded-sm bg-surface/40 px-2 py-1.5 text-sm text-ink shadow-outline select-none',
  'transition-[box-shadow,background-color,opacity] duration-150 ease-out hover:shadow-outline-hover',
  'has-checked:bg-surface has-checked:font-bold has-checked:shadow-outline-selected',
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
  'has-disabled:cursor-not-allowed has-disabled:opacity-35 has-disabled:hover:shadow-outline',
].join(' ')

/**
 * Grupo de radios con el color de cada posición: se ve cómo quedará la ficha.
 * Radios nativos (ocultos): las flechas cambian la opción y se saltan las deshabilitadas.
 */
export function PositionPicker({
  label,
  value,
  onChange,
  disabledPosition = null,
  allowNone = false,
  optional = false,
  error,
  autoFocus,
}: PositionPickerProps) {
  const id = useId()
  const name = `${id}-position`

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-ink-soft">Opcional</span>}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={['grid grid-cols-2 gap-2 rounded-md sm:grid-cols-3', error ? 'p-1 shadow-[0_0_0_1px_var(--color-danger)]' : ''].join(' ')}
      >
        {PLAYER_POSITIONS.map((position, index) => {
          const style = POSITION_STYLES[position]
          const disabled = position === disabledPosition
          return (
            <label key={position} className={OPTION}>
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={value === position}
                disabled={disabled}
                data-autofocus={autoFocus && index === 0 ? true : undefined}
                onChange={() => onChange(position)}
              />
              <span
                aria-hidden
                className={[
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-wide ring-2 ring-white/25',
                  style.bg,
                  style.text,
                ].join(' ')}
              >
                {PLAYER_POSITION_SHORT[position]}
              </span>
              <span className="min-w-0 truncate">{PLAYER_POSITION_LABELS[position]}</span>
              {disabled && <span className="sr-only">(es la principal)</span>}
            </label>
          )
        })}
        {allowNone && (
          <label className={`${OPTION} col-span-2 justify-center sm:col-span-3`}>
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value === null}
              onChange={() => onChange(null)}
            />
            Ninguna
          </label>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger-deep">
          {error}
        </p>
      )}
    </div>
  )
}
