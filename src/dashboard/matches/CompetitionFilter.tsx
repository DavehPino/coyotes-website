import type { CompetitionListItem } from '@shared/schemas'

type CompetitionFilterProps = {
  competitions: CompetitionListItem[]
  /** id de la competición elegida; null = todas. */
  value: string | null
  onChange: (competitionId: string | null) => void
}

const CHIP = [
  'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium select-none md:min-h-10',
  'transition-[background-color,color,box-shadow,scale] duration-150 ease-out active:scale-[0.96]',
].join(' ')
const SELECTED = 'bg-coyote-gold text-coyote-black'
const IDLE = 'bg-coyote-ember text-coyote-silver shadow-border hover:bg-coyote-rust/50 hover:shadow-border-hover'

/** Fila de chips "Todas · Liga Podio · Amistoso…" para filtrar los partidos por competición. */
export function CompetitionFilter({ competitions, value, onChange }: CompetitionFilterProps) {
  const total = competitions.reduce((sum, item) => sum + item.match_count, 0)
  return (
    <div role="group" aria-label="Filtrar por liga" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={`${CHIP} ${value === null ? SELECTED : IDLE}`}
      >
        Todas
        <span className="text-xs opacity-70 tabular-nums">{total}</span>
      </button>
      {competitions.map((competition) => {
        const selected = value === competition.id
        return (
          <button
            key={competition.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : competition.id)}
            className={`${CHIP} ${selected ? SELECTED : IDLE}`}
          >
            {competition.name}
            <span className="text-xs opacity-70 tabular-nums">{competition.match_count}</span>
          </button>
        )
      })}
    </div>
  )
}
