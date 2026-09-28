// Cálculos sobre la progresión de un set (MatchStats de CourtTrack): puntos, rachas y líneas por jugador.
import type { MatchSetEvent, MatchSetEventKind, MatchSetRosterPlayer, MatchSide, MatchStatLine } from '@shared/schemas'

export const EVENT_KIND_LABELS: Record<MatchSetEventKind, string> = {
  attack: 'Ataque',
  ace: 'Punto de saque',
  block: 'Bloqueo',
  serve_error: 'Error de saque',
  unforced_error: 'Error no forzado',
  timeout: 'Tiempo técnico',
  substitution: 'Sustitución',
  sanction: 'Sanción',
  other: 'Punto',
}

export type StatKey = Exclude<keyof MatchStatLine, 'points'>

/** Columnas de acciones, en el orden en que se muestran. `short` es la cabecera de tabla. */
export const STAT_COLUMNS: { key: StatKey; label: string; short: string }[] = [
  { key: 'attacks', label: 'Ataques', short: 'Atq' },
  { key: 'aces', label: 'Puntos de saque', short: 'Saq' },
  { key: 'blocks', label: 'Bloqueos', short: 'Blq' },
  { key: 'serve_errors', label: 'Errores de saque', short: 'E. sq' },
  { key: 'unforced_errors', label: 'Errores no forzados', short: 'E. nf' },
]

const ERROR_KINDS = new Set<MatchSetEventKind>(['serve_error', 'unforced_error'])
const NON_POINT_KINDS = new Set<MatchSetEventKind>(['timeout', 'substitution', 'sanction'])

export const other = (side: MatchSide): MatchSide => (side === 'us' ? 'them' : 'us')

/** Tiempos, cambios y sanciones no mueven el marcador. */
export const isPoint = (event: MatchSetEvent) => !NON_POINT_KINDS.has(event.kind)

/** Quién sumó el punto: el protagonista, salvo en los errores. */
export const scorer = (event: MatchSetEvent): MatchSide => (ERROR_KINDS.has(event.kind) ? other(event.team) : event.team)

/** "#12 Grassi", o solo el nombre si no hay dorsal. */
export function playerLabel(player: { number: number | null; name: string }): string {
  return player.number === null ? player.name : `#${player.number} ${player.name}`
}

export type PlayerLine = {
  key: string
  number: number | null
  name: string
  attacks: number
  aces: number
  blocks: number
  serve_errors: number
  unforced_errors: number
  /** Veces que un ataque o un saque rival le forzó el error (solo si el partido trae el detalle de las jugadas). */
  forced_errors: number
  libero: boolean
  points: number
  errors: number
}

const KIND_TO_STAT: Partial<Record<MatchSetEventKind, StatKey>> = {
  attack: 'attacks',
  ace: 'aces',
  block: 'blocks',
  serve_error: 'serve_errors',
  unforced_error: 'unforced_errors',
}

/**
 * Acciones de cada jugador de `team` en el set, a partir de la progresión, más los errores que le forzó el rival.
 * `roster` (quienes estuvieron en cancha) añade con ceros a los que no hicieron nada y da nombre y líbero.
 * Ordenadas por puntos y menos errores.
 */
export function playerLines(events: MatchSetEvent[], team: MatchSide, roster: MatchSetRosterPlayer[] = []): PlayerLine[] {
  const lines = new Map<string, PlayerLine>()
  const lineFor = (player: { number: number | null; name: string }, libero = false): PlayerLine => {
    const key = player.number === null ? `-${player.name}` : String(player.number)
    let line = lines.get(key)
    if (!line) {
      line = {
        key,
        number: player.number,
        name: player.name,
        attacks: 0,
        aces: 0,
        blocks: 0,
        serve_errors: 0,
        unforced_errors: 0,
        forced_errors: 0,
        libero,
        points: 0,
        errors: 0,
      }
      lines.set(key, line)
    }
    return line
  }
  for (const player of roster) lineFor(player, player.libero)
  for (const event of events) {
    const stat = KIND_TO_STAT[event.kind]
    if (event.team === team && stat && event.player) {
      const line = lineFor(event.player)
      line[stat] += 1
      if (ERROR_KINDS.has(event.kind)) line.errors += 1
      else line.points += 1
    } else if (event.team !== team && event.opponent?.relation === 'forced_error') {
      lineFor(event.opponent).forced_errors += 1
    }
  }
  return [...lines.values()].sort(comparePlayerLines)
}

/** Errores que el rival le forzó a cada jugador propio (por dorsal), en los eventos dados. */
export function forcedErrorsByNumber(events: MatchSetEvent[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const event of events) {
    const number = event.opponent?.number
    if (event.team !== 'them' || event.opponent?.relation !== 'forced_error' || number === null || number === undefined) continue
    counts.set(number, (counts.get(number) ?? 0) + 1)
  }
  return counts
}

export function comparePlayerLines(a: { points: number; errors: number; number: number | null }, b: typeof a): number {
  if (a.points !== b.points) return b.points - a.points
  if (a.errors !== b.errors) return a.errors - b.errors
  return (a.number ?? 999) - (b.number ?? 999)
}

/** Mayor racha de puntos seguidos de cada equipo. */
export function longestRuns(events: MatchSetEvent[]): Record<MatchSide, number> {
  const best = { us: 0, them: 0 }
  let current: MatchSide | null = null
  let length = 0
  for (const event of events.filter(isPoint)) {
    const side = scorer(event)
    length = side === current ? length + 1 : 1
    current = side
    best[side] = Math.max(best[side], length)
  }
  return best
}

/** Máxima ventaja que llegó a tener cada equipo en el set (0 si nunca fue por delante). */
export function maxLeads(events: MatchSetEvent[]): Record<MatchSide, number> {
  const lead = { us: 0, them: 0 }
  for (const event of events.filter(isPoint)) {
    lead.us = Math.max(lead.us, event.us - event.them)
    lead.them = Math.max(lead.them, event.them - event.us)
  }
  return lead
}

/** Puntos hechos por mérito propio (ataques, saques y bloqueos) y regalados por errores del rival. */
export function pointsBreakdown(own: MatchStatLine, rival: MatchStatLine | null): { earned: number; gifted: number } {
  return {
    earned: own.attacks + own.aces + own.blocks,
    gifted: rival ? rival.serve_errors + rival.unforced_errors : Math.max(0, own.points - (own.attacks + own.aces + own.blocks)),
  }
}
