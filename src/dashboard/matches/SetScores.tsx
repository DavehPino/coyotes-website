import { lazy, Suspense, useState } from 'react'
import { TEAM_NAME } from '@/config'
import type { MatchDetail } from '@shared/schemas'
import { Zone } from '../ui'
import { ChevronRightIcon } from '../ui/icons'
import { setScoreParts, setWinner } from './matchLabels'

// El diálogo de progresión y estadísticas solo se descarga la primera vez que se abre un set.
const SetStatsDialog = lazy(() => import('./stats/SetStatsDialog'))

type SetScoresProps = { match: MatchDetail }

/** Cada parcial es una marca apoyada sobre la línea lateral: el set ganado lleva acento del club encima. */
const WINNER_CLASSES = {
  us: 'border-accent text-ink',
  them: 'border-transparent text-ink-soft',
  tie: 'border-transparent text-ink-soft',
} as const

const MARK_CLASSES = '-mt-0.5 flex w-full flex-col items-center border-t-4 pt-2 pb-1 leading-none'

/**
 * Parciales como marcas en fila. Si el partido vino de CourtTrack, cada marca abre la progresión punto a
 * punto y las estadísticas de ese set.
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
    <Zone id="set-scores-title" label="Parciales" actions={<span className="text-sm text-ink-soft">{homeName} – {awayName}</span>}>
      <ol className={interactive ? 'grid grid-cols-4 gap-2 sm:flex sm:gap-3' : 'hairline grid grid-cols-4 gap-x-2 sm:flex sm:gap-x-6'}>
        {match.set_scores.map((set, index) => {
          const [left, right] = setScoreParts(match, set)
          const winner = setWinner(set)
          const winnerName = winner === 'us' ? TEAM_NAME : winner === 'them' ? match.opponent.name : 'empate'
          const label = `Set ${index + 1}: ${left} a ${right}, ${winnerName}`
          const content = (
            <>
              <span className="font-figures text-3xl font-black sm:text-4xl">
                {left}-{right}
              </span>
              <span className="mt-1 text-[11px] font-bold tracking-wider uppercase">Set {index + 1}</span>
            </>
          )
          return (
            <li key={index}>
              {interactive ? (
                <button
                  type="button"
                  onClick={() => openSet(index + 1)}
                  aria-label={`${label}. Ver progresión y estadísticas`}
                  className={`btn btn-secondary group w-full flex-col gap-0 border-t-4 px-3 pt-1.5 pb-2 leading-none sm:min-w-24 ${winner === 'us' ? 'border-accent' : 'border-transparent text-ink-soft'}`}
                >
                  {content}
                  <span aria-hidden className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold tracking-wider text-ink">
                    Ver
                    <ChevronRightIcon className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" strokeWidth={2} />
                  </span>
                </button>
              ) : (
                <div className={`${MARK_CLASSES} ${WINNER_CLASSES[winner]}`}>
                  {content}
                  <span className="sr-only">, {winnerName}</span>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {interactive && <p className="mt-3 text-sm text-ink-soft">Cada set abre su progresión punto a punto y sus estadísticas.</p>}

      {dialog.mounted && (
        <Suspense fallback={null}>
          <SetStatsDialog key={dialog.session} open={dialog.open} match={match} initialSet={dialog.set} onClose={close} />
        </Suspense>
      )}
    </Zone>
  )
}
