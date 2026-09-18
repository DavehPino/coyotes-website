import type { CompetitionListItem } from '@shared/schemas'
import { CheckIcon } from '../ui/icons'

type CompetitionFilterProps = {
  competitions: CompetitionListItem[]
  /** ids de las competiciones elegidas; vacío = todas. */
  value: string[]
  onChange: (competitionIds: string[]) => void
}

/** Teclas de filtro: la marcada es la tecla del club (negro con letras doradas); el resto, celdas blancas. */
const CHIP = [
  'btn min-h-11 gap-1.5 px-3 text-sm md:min-h-10',

].join(' ')
const SELECTED = 'btn-primary'
const IDLE = 'btn-secondary'

/** Fila de rótulos para quedarse solo con los partidos de las ligas marcadas (se pueden marcar varias). */
export function CompetitionFilter({ competitions, value, onChange }: CompetitionFilterProps) {
  const all = value.length === 0
  const total = competitions.reduce((sum, item) => sum + item.match_count, 0)

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  }

  return (
    <div role="group" aria-label="Filtrar por liga" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:px-0">
      <button type="button" aria-pressed={all} onClick={() => onChange([])} className={`${CHIP} ${all ? SELECTED : IDLE}`}>
        Todas
        <span className="text-xs opacity-70">{total}</span>
      </button>
      {competitions.map((competition) => {
        const selected = value.includes(competition.id)
        return (
          <button
            key={competition.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(competition.id)}
            className={`${CHIP} ${selected ? SELECTED : IDLE}`}
          >
            {selected && <CheckIcon className="-ml-0.5 size-3.5" strokeWidth={2} />}
            {competition.name}
            <span className="text-xs opacity-70">{competition.match_count}</span>
          </button>
        )
      })}
    </div>
  )
}
