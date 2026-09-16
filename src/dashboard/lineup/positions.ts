// Posición → estilos. Un único mapa para la lista, el formulario, el banco, la cancha y el PNG.
import { PLAYER_POSITION_LABELS, type PlayerPosition } from '@shared/domain'
import type { Player } from '@shared/schemas'

type PositionStyle = {
  /** Relleno con el color de la posición. */
  bg: string
  /** Texto legible (AA) sobre ese relleno. */
  text: string
  /** Anillo exterior del color (posición secundaria de una ficha). */
  ring: string
  /** Variable CSS del color, para SVG y canvas. */
  cssVar: string
  /** Tono del texto encima, para dibujar en canvas. */
  onColor: 'light' | 'dark'
}

export const POSITION_STYLES: Record<PlayerPosition, PositionStyle> = {
  armador: {
    bg: 'bg-pos-armador',
    text: 'text-white',
    ring: 'ring-pos-armador',
    cssVar: '--color-pos-armador',
    onColor: 'light',
  },
  punta: {
    bg: 'bg-pos-punta',
    text: 'text-coyote-black',
    ring: 'ring-pos-punta',
    cssVar: '--color-pos-punta',
    onColor: 'dark',
  },
  central: {
    bg: 'bg-pos-central',
    text: 'text-white',
    ring: 'ring-pos-central',
    cssVar: '--color-pos-central',
    onColor: 'light',
  },
  opuesto: {
    bg: 'bg-pos-opuesto',
    text: 'text-white',
    ring: 'ring-pos-opuesto',
    cssVar: '--color-pos-opuesto',
    onColor: 'light',
  },
  libero: {
    bg: 'bg-pos-libero',
    text: 'text-coyote-black',
    ring: 'ring-pos-libero',
    cssVar: '--color-pos-libero',
    onColor: 'dark',
  },
  comodin: {
    bg: 'bg-pos-comodin',
    text: 'text-coyote-black',
    ring: 'ring-pos-comodin',
    cssVar: '--color-pos-comodin',
    onColor: 'dark',
  },
}

/** Valor de una variable de color de index.css (`@theme static`), para dibujar en canvas. */
export function readCssColor(cssVar: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || fallback
}

/** Posiciones del jugador en orden: la principal primero. */
export function positionsOf(player: Player): PlayerPosition[] {
  return player.secondary_position ? [player.primary_position, player.secondary_position] : [player.primary_position]
}

/** "Armador y Comodín" — para lectores de pantalla y la imagen compartida. */
export function positionsLabel(player: Player): string {
  return positionsOf(player)
    .map((position) => PLAYER_POSITION_LABELS[position])
    .join(' y ')
}

/** Iniciales para la ficha de un jugador sin número: "Juan Pérez" → "JP". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return letters
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('es')
}

/** Nombre corto bajo la ficha: "Juan Pérez" → "Juan P." */
export function shortName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return words[0] ?? ''
  return `${words[0]} ${words[words.length - 1].charAt(0)}.`
}

/** Filtro por posición: principal o secundaria. `null` = todas. */
export function matchesPosition(player: Player, filter: PlayerPosition | null): boolean {
  return filter === null || player.primary_position === filter || player.secondary_position === filter
}
