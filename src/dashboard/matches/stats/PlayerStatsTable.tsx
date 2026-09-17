import { Chip } from '../../ui'
import { comparePlayerLines, STAT_COLUMNS } from './setStats'

export type PlayerStatsRow = {
  key: string
  number: number | null
  name: string
  captain?: boolean
  libero?: boolean
  points: number
  errors: number
  attacks: number
  aces: number
  blocks: number
  serve_errors: number
  unforced_errors: number
  /** Solo en los totales del partido. */
  rallies?: number
  rating?: number | null
}

type PlayerStatsTableProps = {
  rows: PlayerStatsRow[]
  /** Añade "En cancha" (puntos disputados) y el puntaje de CourtTrack. */
  matchColumns?: boolean
  emptyMessage: string
}

/** Acciones por jugador: puntos primero, errores después. En móvil la tabla se desplaza en horizontal. */
export function PlayerStatsTable({ rows, matchColumns = false, emptyMessage }: PlayerStatsTableProps) {
  if (rows.length === 0) return <p className="text-sm text-coyote-ash">{emptyMessage}</p>
  const sorted = [...rows].sort(comparePlayerLines)

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[30rem] border-separate border-spacing-0 text-sm tabular-nums">
        <thead>
          <tr className="text-[11px] font-medium tracking-wide text-coyote-ash uppercase">
            <th scope="col" className="pb-2 text-left font-medium">
              Jugador
            </th>
            <th scope="col" className="pb-2 pl-2 text-right font-medium">
              <abbr title="Puntos (ataques, saques y bloqueos)" className="no-underline">
                Pts
              </abbr>
            </th>
            {STAT_COLUMNS.map(({ key, label, short }) => (
              <th key={key} scope="col" className="pb-2 pl-2 text-right font-medium">
                <abbr title={label} className="no-underline">
                  {short}
                </abbr>
              </th>
            ))}
            {matchColumns && (
              <>
                <th scope="col" className="pb-2 pl-2 text-right font-medium">
                  <abbr title="Puntos disputados en cancha" className="no-underline">
                    En cancha
                  </abbr>
                </th>
                <th scope="col" className="pb-2 pl-2 text-right font-medium">
                  <abbr title="Puntaje que calcula CourtTrack (AIScore)" className="no-underline">
                    Score
                  </abbr>
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="border-t border-coyote-steel/60 py-2 pr-2 text-left font-normal whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  {row.number !== null && <span className="w-7 text-coyote-ash">#{row.number}</span>}
                  <span className="font-medium text-coyote-silver">{row.name}</span>
                  {row.captain && (
                    <Chip tone="gold" aria-label="Capitán">
                      C
                    </Chip>
                  )}
                  {row.libero && (
                    <Chip tone="yellow" aria-label="Líbero">
                      L
                    </Chip>
                  )}
                </span>
              </th>
              <td className="border-t border-coyote-steel/60 py-2 pl-2 text-right font-semibold text-coyote-silver">{row.points}</td>
              {STAT_COLUMNS.map(({ key }) => (
                <td
                  key={key}
                  className={`border-t border-coyote-steel/60 py-2 pl-2 text-right ${row[key] === 0 ? 'text-coyote-ash' : 'text-coyote-silver'}`}
                >
                  {row[key]}
                </td>
              ))}
              {matchColumns && (
                <>
                  <td className="border-t border-coyote-steel/60 py-2 pl-2 text-right text-coyote-ash">{row.rallies ?? '–'}</td>
                  <td className="border-t border-coyote-steel/60 py-2 pl-2 text-right text-coyote-ash">{row.rating ?? '–'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
