import { lazy, Suspense, useState } from 'react'
import { TEAM_NAME } from '@/config'
import type { MatchDetail } from '@shared/schemas'
import { setScoreParts, setWinner } from './matchLabels'

// El diálogo de progresión y estadísticas solo se descarga la primera vez que se abre un set.
const SetStatsDialog = lazy(() => import('./stats/SetStatsDialog'))

type SetScoresProps = { match: MatchDetail }

const WINNER_CLASSES = {
  us: 'text-coyote-gold',
  them: 'text-coyote-orange',
  tie: 'text-coyote-silver',
} as const

const CHIP_CLASSES = 'flex min-w-[4.75rem] flex-col items-center rounded-xl bg-coyote-night px-3 py-2 shadow-border'

/**
 * Parciales como fila de chips; cada set toma el color del equipo que lo ganó. Si el partido vino de CourtTrack,
 * cada chip abre la progresión punto a punto y las estadísticas de ese set.
 */
export function SetScores({ match }: SetScoresProps) {
  const [dialog, setDialog] = useState({ mounted: false, open: false, set: 1, session: 0 })
  if (match.set_scores.length === 0) return null
  const homeName = match.is_home ? TEAM_NAME : match.opponent.name
  const awayName = match.is_home ? match.opponent.name : TEAM_NAME
  const interactive = match.courtrack_id !== null

  const openSet = (set: number) => setDialog((prev) => ({ mounted: true, open: true, set, session: prev.session + 1 }))
  const close = () => setDialog((prev) => ({ ...prev, open: false }))

  return (
    <section aria-labelledby="set-scores-title">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="set-scores-title" className="text-3xl leading-none text-coyote-silver">
          Parciales
        </h2>
        <p className="text-xs text-coyote-ash">
          {homeName} – {awayName}
        </p>
      </div>
      <ol className="flex flex-wrap gap-2">
        {match.set_scores.map((set, index) => {
          const [left, right] = setScoreParts(match, set)
          const winner = setWinner(set)
          const winnerName = winner === 'us' ? TEAM_NAME : winner === 'them' ? match.opponent.name : 'empate'
          const label = `Set ${index + 1}: ${left} a ${right}, ${winnerName}`
          const content = (
            <>
              <span className="text-[11px] font-medium tracking-wide text-coyote-ash uppercase">Set {index + 1}</span>
              <span className={`font-display text-3xl leading-none tabular-nums ${WINNER_CLASSES[winner]}`}>
                {left}-{right}
              </span>
            </>
          )
          return (
            <li key={index}>
              {interactive ? (
                <button
                  type="button"
                  onClick={() => openSet(index + 1)}
                  aria-label={`${label}. Ver progresión y estadísticas`}
                  className={`${CHIP_CLASSES} cursor-pointer transition-[background-color,box-shadow,scale] duration-150 ease-out hover:bg-coyote-ember/70 hover:shadow-border-hover active:scale-[0.96]`}
                >
                  {content}
                </button>
              ) : (
                <div className={CHIP_CLASSES} aria-label={label}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {interactive && <p className="mt-2 text-xs text-coyote-ash">Toca un set para ver su progresión punto a punto y las estadísticas.</p>}

      {dialog.mounted && (
        <Suspense fallback={null}>
          <SetStatsDialog key={dialog.session} open={dialog.open} match={match} initialSet={dialog.set} onClose={close} />
        </Suspense>
      )}
    </section>
  )
}
