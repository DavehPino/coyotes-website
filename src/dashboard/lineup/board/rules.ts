// Geometría de la media cancha y reglas de la formación: funciones puras que comparten la vista y el PNG.
import {
  LINEUP_MAX_STARTERS,
  lineupLimitMessage,
  lineupRoleOf,
  type PlayerPosition,
} from '@shared/domain'
import type { Lineup, LineupSlot, Player } from '@shared/schemas'

// ─── Geometría (metros) ──────────────────────────────────────────────────────
/**
 * Media cancha propia de 9 × 9 m vista desde arriba, con la red arriba y una zona libre alrededor.
 * El lienzo mide 11 × 11 m; las fichas se guardan en coordenadas 0..1 sobre la cancha (sin la zona libre).
 */
export const COURT = {
  size: 9,
  /** Zona libre a los lados, encima de la red y detrás de la línea de fondo. */
  marginX: 1,
  marginTop: 0.8,
  marginBottom: 1.2,
  /** La línea de ataque está a 3 m de la red. */
  attackLine: 3,
} as const

export const CANVAS_WIDTH = COURT.size + COURT.marginX * 2
export const CANVAS_HEIGHT = COURT.size + COURT.marginTop + COURT.marginBottom

/** Rectángulo de la cancha dentro del lienzo, en fracciones del lienzo (para superponer las fichas). */
export const COURT_BOX = {
  left: COURT.marginX / CANVAS_WIDTH,
  top: COURT.marginTop / CANVAS_HEIGHT,
  width: COURT.size / CANVAS_WIDTH,
  height: COURT.size / CANVAS_HEIGHT,
} as const

/** Punto normalizado (0..1) de la cancha → metros del lienzo. */
export function toCanvasPoint(x: number, y: number): { x: number; y: number } {
  return { x: COURT.marginX + x * COURT.size, y: COURT.marginTop + y * COURT.size }
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Las coordenadas se guardan con 3 decimales (numeric(4,3)). */
export const roundCoord = (value: number) => Math.round(clamp01(value) * 1000) / 1000

/** Posición del puntero → punto normalizado dentro de la cancha, limitado a sus bordes. */
export function pointFromClient(clientX: number, clientY: number, courtRect: DOMRect): { x: number; y: number } {
  return {
    x: roundCoord((clientX - courtRect.left) / courtRect.width),
    y: roundCoord((clientY - courtRect.top) / courtRect.height),
  }
}

// ─── Zonas ───────────────────────────────────────────────────────────────────
export type Zone = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Zona por tercios: la fila delantera va de la red a la línea de ataque (primer tercio).
 * Delante, de izquierda a derecha: 4 · 3 · 2. Detrás: 5 · 6 · 1.
 */
export function zoneOf(x: number, y: number): Zone {
  const column = Math.min(2, Math.floor(clamp01(x) * 3))
  const front = y < COURT.attackLine / COURT.size
  return (front ? ([4, 3, 2] as const) : ([5, 6, 1] as const))[column]
}

/** Centro de cada zona (normalizado), para los números de guía y para ubicar con el teclado. */
export const ZONE_CENTERS: Record<Zone, { x: number; y: number }> = {
  4: { x: 1 / 6, y: 1 / 6 },
  3: { x: 3 / 6, y: 1 / 6 },
  2: { x: 5 / 6, y: 1 / 6 },
  5: { x: 1 / 6, y: 2 / 3 },
  6: { x: 3 / 6, y: 2 / 3 },
  1: { x: 5 / 6, y: 2 / 3 },
}

/** Paso de las flechas del teclado: medio metro. */
export const KEYBOARD_STEP = 0.5 / COURT.size

// ─── Reglas de la formación ──────────────────────────────────────────────────
export type PlayersById = ReadonlyMap<string, Player>

export const indexPlayers = (players: Player[]): PlayersById => new Map(players.map((player) => [player.id, player]))

function positionsOnCourt(slots: LineupSlot[], players: PlayersById, exceptId?: string): PlayerPosition[] {
  return slots.flatMap((slot) => {
    const player = players.get(slot.player_id)
    return player && slot.player_id !== exceptId ? [player.primary_position] : []
  })
}

export function countRoles(slots: LineupSlot[], players: PlayersById): { starters: number; libero: number } {
  const positions = positionsOnCourt(slots, players)
  const libero = positions.filter((position) => lineupRoleOf(position) === 'libero').length
  return { starters: positions.length - libero, libero }
}

/** «6 + L», «5», «Vacía». */
export function lineupSummary(slots: LineupSlot[], players: PlayersById): string {
  const { starters, libero } = countRoles(slots, players)
  if (starters === 0 && libero === 0) return 'Vacía'
  return libero > 0 ? `${starters} + L` : String(starters)
}

/** Por qué el jugador no puede entrar en cancha, o null si puede (si ya está, se mueve y siempre puede). */
export function placementBlocker(player: Player, slots: LineupSlot[], players: PlayersById): string | null {
  if (!player.is_active) return `${player.name} está inactivo`
  if (slots.some((slot) => slot.player_id === player.id)) return null
  return lineupLimitMessage(lineupRoleOf(player.primary_position), positionsOnCourt(slots, players))
}

/** Pone o mueve un jugador (sin comprobar límites: eso lo hace placementBlocker antes). */
export function placeSlot(slots: LineupSlot[], playerId: string, x: number, y: number): LineupSlot[] {
  const next = { player_id: playerId, x: roundCoord(x), y: roundCoord(y) }
  return slots.some((slot) => slot.player_id === playerId)
    ? slots.map((slot) => (slot.player_id === playerId ? next : slot))
    : [...slots, next]
}

export const removeSlot = (slots: LineupSlot[], playerId: string) =>
  slots.filter((slot) => slot.player_id !== playerId)

// Orden en que el teclado rellena las zonas: los titulares en orden de lectura; el líbero, atrás.
const STARTER_ZONE_ORDER: Zone[] = [4, 3, 2, 5, 6, 1]
const LIBERO_ZONE_ORDER: Zone[] = [5, 6, 1]

/** Punto donde ubicar a un jugador sin elegir sitio (teclado): el centro de la primera zona libre. */
export function nextFreePoint(player: Player, slots: LineupSlot[]): { x: number; y: number } {
  const taken = new Set(slots.filter((slot) => slot.player_id !== player.id).map((slot) => zoneOf(slot.x, slot.y)))
  const order = lineupRoleOf(player.primary_position) === 'libero' ? LIBERO_ZONE_ORDER : STARTER_ZONE_ORDER
  const zone = order.find((candidate) => !taken.has(candidate)) ?? order[0]
  const center = ZONE_CENTERS[zone]
  // Si todas están ocupadas, un poco desplazado para no tapar la ficha que ya está ahí.
  return taken.has(zone) ? { x: center.x, y: clamp01(center.y + 0.12) } : center
}

/** Solo los jugadores que existen y están activos (una formación vieja puede tener bajas). */
export function usableSlots(slots: LineupSlot[], players: PlayersById): LineupSlot[] {
  return slots.filter((slot) => players.get(slot.player_id)?.is_active)
}

export const MAX_STARTERS = LINEUP_MAX_STARTERS

/** Orden del banco: por posición principal (el orden de PLAYER_POSITIONS) y número. */
export function compareBench(order: readonly PlayerPosition[]) {
  return (a: Player, b: Player) => {
    const byPosition = order.indexOf(a.primary_position) - order.indexOf(b.primary_position)
    if (byPosition !== 0) return byPosition
    return (a.jersey_number ?? 1000) - (b.jersey_number ?? 1000) || a.name.localeCompare(b.name, 'es')
  }
}

/** Firma para detectar cambios sin guardar (el orden de los jugadores no importa). */
export function lineupSignature(name: string, slots: LineupSlot[]): string {
  const sorted = [...slots].sort((a, b) => a.player_id.localeCompare(b.player_id))
  return JSON.stringify([name.trim(), sorted.map((slot) => [slot.player_id, slot.x, slot.y])])
}

/** Titulares y líbero para listarlos (imagen y resumen), de delante hacia atrás y de izquierda a derecha. */
export function orderedOnCourt(slots: LineupSlot[], players: PlayersById): { player: Player; slot: LineupSlot; zone: Zone }[] {
  return slots
    .flatMap((slot) => {
      const player = players.get(slot.player_id)
      return player ? [{ player, slot, zone: zoneOf(slot.x, slot.y) }] : []
    })
    .sort((a, b) => {
      const liberoA = lineupRoleOf(a.player.primary_position) === 'libero' ? 1 : 0
      const liberoB = lineupRoleOf(b.player.primary_position) === 'libero' ? 1 : 0
      return liberoA - liberoB || a.zone - b.zone
    })
}

export type LineupLike = Pick<Lineup, 'name' | 'slots'>
