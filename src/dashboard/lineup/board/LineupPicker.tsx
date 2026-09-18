import type { Lineup } from '@shared/schemas'
import { ChevronDownIcon } from '../../ui/icons'

/** Valor del selector para una formación nueva sin guardar. */
const NEW_VALUE = ''

type LineupPickerProps = {
  lineups: Lineup[]
  /** null: formación nueva. */
  currentId: string | null
  currentName: string
  dirty: boolean
  onChange: (lineupId: string | null) => void
}

/**
 * Desplegable nativo con las formaciones guardadas y «Nueva formación».
 * Nativo a propósito: en el móvil abre el selector del sistema, cómodo y accesible.
 */
export function LineupPicker({ lineups, currentId, currentName, dirty, onChange }: LineupPickerProps) {
  return (
    <div className="relative min-w-0 flex-1">
      <label className="sr-only" htmlFor="lineup-picker">
        Formación
      </label>
      <select
        id="lineup-picker"
        value={currentId ?? NEW_VALUE}
        onChange={(event) => onChange(event.target.value === NEW_VALUE ? null : event.target.value)}
        className={[
          'min-h-11 w-full appearance-none truncate rounded-sm border-2 border-ink/60 bg-surface py-1 pr-9 pl-3 text-base font-extrabold text-ink uppercase',
          'transition-[border-color] duration-150 ease-out hover:border-ink focus:border-ink focus:outline-none md:min-h-10',
        ].join(' ')}
      >
        <option value={NEW_VALUE}>{currentId === null && currentName ? currentName : 'Nueva formación'}</option>
        {lineups.map((lineup) => (
          <option key={lineup.id} value={lineup.id}>
            {lineup.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        aria-hidden
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-soft"
      />
      {dirty && (
        <span
          role="img"
          aria-label="Cambios sin guardar"
          title="Cambios sin guardar"
          className="pointer-events-none absolute top-1.5 right-8 size-2 rounded-full bg-ink"
        />
      )}
    </div>
  )
}
