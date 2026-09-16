// Cálculos del resumen de la Home. Todo se deriva de lo que ya piden Actividades y Partidos:
// no hay endpoints nuevos.
import type { Activity, MatchSummary } from '@shared/schemas'

export type Streak = { outcome: 'win' | 'loss'; count: number }

export type MatchStats = {
  played: number
  videos: number
  /** Racha en curso contando desde el partido más reciente con resultado. */
  streak: Streak | null
}

/** `matches` llega del más reciente al más antiguo (igual que en la lista de Partidos). */
export function matchStats(matches: MatchSummary[]): MatchStats {
  return {
    played: matches.length,
    videos: matches.reduce((total, match) => total + match.video_count, 0),
    streak: currentStreak(matches),
  }
}

function currentStreak(matches: MatchSummary[]): Streak | null {
  const decided = matches.filter((match) => match.outcome !== 'pending')
  const first = decided[0]
  if (!first) return null
  let count = 0
  while (decided[count]?.outcome === first.outcome) count += 1
  return { outcome: first.outcome as 'win' | 'loss', count }
}

/** "3 victorias seguidas" · "1 derrota" */
export function streakLabel(streak: Streak): string {
  const noun = streak.outcome === 'win' ? 'victoria' : 'derrota'
  if (streak.count === 1) return `1 ${noun}`
  return `${streak.count} ${noun}s seguidas`
}

/** Cuántas de las próximas actividades caen hoy. */
export function countToday(activities: Activity[], today: string): number {
  return activities.filter((activity) => activity.activity_date === today).length
}
