// Etiquetas y presentación derivada de un partido (título, marcador, resultado).
import { TEAM_NAME } from '@/config'
import { VIDEO_CATEGORY_LABELS, type MatchOutcome } from '@shared/domain'
import type { MatchSummary, SetScore, Video } from '@shared/schemas'
import type { ChipTone } from '../ui/Chip'

export const OUTCOME_LABELS: Record<MatchOutcome, string> = {
  win: 'Victoria',
  loss: 'Derrota',
  pending: 'Sin resultado',
}

export const OUTCOME_TONES: Record<MatchOutcome, ChipTone> = {
  win: 'gold',
  loss: 'orange',
  pending: 'ash',
}

export function opponentLabel(match: MatchSummary, short = false): string {
  return (short && match.opponent.short_name) || match.opponent.name
}

/** "COYOTES vs RIVAL" o "RIVAL vs COYOTES" si jugamos fuera. */
export function matchTitle(match: MatchSummary, short = false): string {
  const rival = opponentLabel(match, short)
  return match.is_home ? `${TEAM_NAME} vs ${rival}` : `${rival} vs ${TEAM_NAME}`
}

/** Marcador de sets en el mismo orden que el título (local a la izquierda). */
export function scoreParts(match: MatchSummary): [string, string] {
  const us = match.sets_won === null ? '–' : String(match.sets_won)
  const them = match.sets_lost === null ? '–' : String(match.sets_lost)
  return match.is_home ? [us, them] : [them, us]
}

export function scoreLabel(match: MatchSummary): string {
  const [left, right] = scoreParts(match)
  return `${left} – ${right}`
}

/** Marcador siempre desde el punto de vista de Coyotes ("1 – 3"), para listas junto al rival. */
export function ourScoreLabel(match: MatchSummary): string {
  const us = match.sets_won === null ? '–' : String(match.sets_won)
  const them = match.sets_lost === null ? '–' : String(match.sets_lost)
  return `${us} – ${them}`
}

export const OUTCOME_TEXT_CLASSES: Record<MatchOutcome, string> = {
  win: 'text-ink',
  loss: 'text-ink-soft',
  pending: 'text-ink-soft',
}

/** Parcial en el orden del título. */
export function setScoreParts(match: MatchSummary, set: SetScore): [number, number] {
  return match.is_home ? [set.us, set.them] : [set.them, set.us]
}

export function setWinner(set: SetScore): 'us' | 'them' | 'tie' {
  if (set.us > set.them) return 'us'
  if (set.us < set.them) return 'them'
  return 'tie'
}

/** "Set 2" o la categoría del video. */
export function videoLabel(video: Video): string {
  return video.set_number !== null ? `Set ${video.set_number}` : VIDEO_CATEGORY_LABELS[video.category]
}

export function videoCountLabel(count: number): string {
  return count === 1 ? '1 video' : `${count} videos`
}
