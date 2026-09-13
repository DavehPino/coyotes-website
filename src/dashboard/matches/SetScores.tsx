import { TEAM_NAME } from '@/config'
import type { MatchDetail } from '@shared/schemas'
import { setScoreParts, setWinner } from './matchLabels'

type SetScoresProps = { match: MatchDetail }

const WINNER_CLASSES = {
  us: 'text-coyote-gold',
  them: 'text-coyote-orange',
  tie: 'text-coyote-silver',
} as const

/** Parciales como fila de chips; cada set toma el color del equipo que lo ganó. */
export function SetScores({ match }: SetScoresProps) {
  if (match.set_scores.length === 0) return null
  const homeName = match.is_home ? TEAM_NAME : match.opponent.name
  const awayName = match.is_home ? match.opponent.name : TEAM_NAME

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
          return (
            <li
              key={index}
              className="flex min-w-[4.75rem] flex-col items-center rounded-xl bg-coyote-night px-3 py-2 shadow-border"
              aria-label={`Set ${index + 1}: ${left} a ${right}, ${winnerName}`}
            >
              <span className="text-[11px] font-medium tracking-wide text-coyote-ash uppercase">Set {index + 1}</span>
              <span className={`font-display text-3xl leading-none tabular-nums ${WINNER_CLASSES[winner]}`}>
                {left}-{right}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
