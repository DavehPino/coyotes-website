// PNG de una formación (1080 × 1350, vertical para WhatsApp e Instagram), dibujado en <canvas>.
// Usa la misma geometría que la cancha de la vista (board/rules.ts) para que la imagen coincida con lo que se ve.
import { LOGO_SRC, TEAM_NAME } from '@/config'
import { lineupRoleOf, PLAYER_POSITION_LABELS, PLAYER_POSITIONS, type PlayerPosition } from '@shared/domain'
import type { Player } from '@shared/schemas'
import { canvasToBlob, loadFlyerFonts, loadImage } from '../../flyers/render'
import { initialsOf, POSITION_STYLES, positionsOf, readCssColor, shortName } from '../positions'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COURT,
  indexPlayers,
  orderedOnCourt,
  toCanvasPoint,
  usableSlots,
  ZONE_CENTERS,
  type LineupLike,
  type PlayersById,
} from '../board/rules'

export const LINEUP_IMAGE = { width: 1080, height: 1350 } as const

const DISPLAY = "Teko, 'Arial Narrow', sans-serif"
const SANS = 'Inter, system-ui, sans-serif'

// Paleta Coyotes (misma que el flyer «brasa»).
const INK = {
  gold: '#f5b014',
  orange: '#f07c13',
  silver: '#e4e4e4',
  ash: '#9a9a9a',
  black: '#0a0a0a',
  white: '#ffffff',
}

type Assets = { logo: HTMLImageElement | null }

let assetsPromise: Promise<Assets> | null = null

/**
 * Fuentes y escudo, cargados una sola vez. Se puede llamar al montar el botón de compartir para que, al pulsarlo,
 * la imagen salga enseguida (la hoja de compartir exige que no pase mucho tiempo desde el toque).
 */
export function preloadLineupAssets(): Promise<Assets> {
  assetsPromise ??= Promise.all([loadFlyerFonts(), loadImage(LOGO_SRC).catch(() => null)]).then(([, logo]) => ({
    logo,
  }))
  return assetsPromise
}

function positionColor(position: PlayerPosition): string {
  return readCssColor(POSITION_STYLES[position].cssVar, INK.ash)
}

const onColor = (position: PlayerPosition) => (POSITION_STYLES[position].onColor === 'light' ? INK.white : INK.black)

/** Recorta el texto con «…» para que quepa en `maxWidth`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let end = text.length
  while (end > 1 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) end--
  return `${text.slice(0, end).trimEnd()}…`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Ficha: círculo del color principal con borde blanco, anillo de la secundaria y número o iniciales. */
function drawToken(ctx: CanvasRenderingContext2D, player: Player, cx: number, cy: number, radius: number) {
  const primary = player.primary_position
  const secondary = player.secondary_position
  if (secondary) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius + radius * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = positionColor(secondary)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + radius * 0.12, 0, Math.PI * 2)
    ctx.fillStyle = INK.black
    ctx.fill()
  }
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
  ctx.shadowBlur = radius * 0.3
  ctx.shadowOffsetY = radius * 0.08
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = positionColor(primary)
  ctx.fill()
  ctx.restore()
  ctx.lineWidth = radius * 0.08
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.stroke()

  const label = player.jersey_number === null ? initialsOf(player.name) : String(player.jersey_number)
  ctx.fillStyle = onColor(primary)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${Math.round(radius * (player.jersey_number === null ? 0.8 : 1.1))}px ${DISPLAY}`
  ctx.fillText(label, cx, cy + radius * 0.1)
}

function drawCourt(
  ctx: CanvasRenderingContext2D,
  lineup: LineupLike,
  players: PlayersById,
  x: number,
  y: number,
  size: number,
) {
  const scale = size / CANVAS_WIDTH
  const px = (meters: number) => meters * scale
  const court = {
    free: readCssColor('--color-court-free', '#1f130b'),
    floor: readCssColor('--color-court', '#4a2c17'),
    line: readCssColor('--color-court-line', '#f4ede4'),
  }

  ctx.save()
  ctx.translate(x, y)

  roundRect(ctx, 0, 0, size, px(CANVAS_HEIGHT), px(0.35))
  ctx.fillStyle = court.free
  ctx.fill()

  const origin = toCanvasPoint(0, 0)
  ctx.fillStyle = court.floor
  ctx.fillRect(px(origin.x), px(origin.y), px(COURT.size), px(COURT.size))

  ctx.strokeStyle = court.line
  ctx.lineWidth = px(0.07)
  ctx.strokeRect(px(origin.x), px(origin.y), px(COURT.size), px(COURT.size))
  const attackY = px(COURT.marginTop + COURT.attackLine)
  ctx.beginPath()
  ctx.moveTo(px(origin.x), attackY)
  ctx.lineTo(px(origin.x + COURT.size), attackY)
  ctx.stroke()

  // Zonas como guía
  ctx.fillStyle = court.line
  ctx.globalAlpha = 0.13
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${Math.round(px(1.9))}px ${DISPLAY}`
  for (const [zone, center] of Object.entries(ZONE_CENTERS)) {
    const point = toCanvasPoint(center.x, center.y)
    ctx.fillText(zone, px(point.x), px(point.y) + px(0.1))
  }
  ctx.globalAlpha = 1

  // Red
  ctx.lineCap = 'round'
  ctx.lineWidth = px(0.16)
  ctx.beginPath()
  ctx.moveTo(px(0.35), px(origin.y))
  ctx.lineTo(size - px(0.35), px(origin.y))
  ctx.stroke()
  ctx.fillStyle = INK.gold
  for (const postX of [px(0.35), size - px(0.35)]) {
    ctx.beginPath()
    ctx.arc(postX, px(origin.y), px(0.16), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = court.line
  ctx.globalAlpha = 0.75
  ctx.font = `600 ${Math.round(px(0.5))}px ${DISPLAY}`
  ctx.fillText('RED', size / 2, px(origin.y / 2) + px(0.04))
  ctx.globalAlpha = 1

  // Fichas: las de atrás primero, para que las de delante queden encima si se tocan.
  const radius = px(0.5)
  const slots = [...lineup.slots].sort((a, b) => a.y - b.y)
  for (const slot of slots) {
    const player = players.get(slot.player_id)
    if (!player) continue
    const point = toCanvasPoint(slot.x, slot.y)
    const cx = px(point.x)
    const cy = px(point.y)
    drawToken(ctx, player, cx, cy, radius)

    const name = shortName(player.name)
    ctx.font = `700 ${Math.round(radius * 0.52)}px ${SANS}`
    const text = fitText(ctx, name, radius * 3.4)
    const width = ctx.measureText(text).width + radius * 0.4
    const top = cy + radius * 1.22
    roundRect(ctx, cx - width / 2, top, width, radius * 0.78, radius * 0.16)
    ctx.fillStyle = 'rgba(10, 10, 10, 0.78)'
    ctx.fill()
    ctx.fillStyle = INK.silver
    ctx.textBaseline = 'middle'
    ctx.fillText(text, cx, top + radius * 0.41)
  }

  ctx.restore()
}

/** Dibuja la formación en el lienzo (tamaño real 1080 × 1350). */
export function renderLineup(canvas: HTMLCanvasElement, lineup: LineupLike, roster: Player[], assets: Assets): void {
  const { width, height } = LINEUP_IMAGE
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('El navegador no permite dibujar la imagen')

  const players = indexPlayers(roster)
  const shown: LineupLike = { name: lineup.name, slots: usableSlots(lineup.slots, players) }
  const onCourt = orderedOnCourt(shown.slots, players)

  // Fondo: brasa → negro con un brillo naranja arriba.
  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#3a1e0e')
  background.addColorStop(0.45, '#140b06')
  background.addColorStop(1, INK.black)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  const glow = ctx.createRadialGradient(width * 0.85, 0, 0, width * 0.85, 0, 700)
  glow.addColorStop(0, 'rgba(240, 124, 19, 0.28)')
  glow.addColorStop(1, 'rgba(240, 124, 19, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  // ─── Cabecera: escudo, equipo y nombre de la formación ─────────────────
  const margin = 56
  const logoSize = 132
  if (assets.logo) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(margin + logoSize / 2, 60 + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(assets.logo, margin, 60, logoSize, logoSize)
    ctx.restore()
    ctx.beginPath()
    ctx.arc(margin + logoSize / 2, 60 + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(245, 176, 20, 0.6)'
    ctx.stroke()
  }
  const textX = margin + (assets.logo ? logoSize + 32 : 0)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = INK.orange
  ctx.font = `600 30px ${SANS}`
  ctx.fillText(`ALINEACIÓN · ${TEAM_NAME.toUpperCase()}`, textX, 100)
  ctx.fillStyle = INK.gold
  // El nombre se achica hasta 64 px antes de recortarse.
  const title = lineup.name.toUpperCase()
  const titleWidth = width - textX - margin
  let titleSize = 104
  ctx.font = `700 ${titleSize}px ${DISPLAY}`
  while (titleSize > 64 && ctx.measureText(title).width > titleWidth) {
    titleSize -= 4
    ctx.font = `700 ${titleSize}px ${DISPLAY}`
  }
  ctx.fillText(fitText(ctx, title, titleWidth), textX, 188)

  // ─── Cancha ────────────────────────────────────────────────────────────
  const courtTop = 236
  const courtSize = 690
  drawCourt(ctx, shown, players, margin - 16, courtTop, courtSize)

  // ─── Lista de titulares y líbero ───────────────────────────────────────
  const listX = margin - 16 + courtSize + 28
  const listWidth = width - listX - margin + 16
  let cursor = courtTop + 34
  const starters = onCourt.filter((item) => lineupRoleOf(item.player.primary_position) === 'starter')
  const liberos = onCourt.filter((item) => lineupRoleOf(item.player.primary_position) === 'libero')

  const section = (title: string) => {
    ctx.fillStyle = INK.gold
    ctx.font = `600 44px ${DISPLAY}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(title, listX, cursor)
    cursor += 20
  }
  const row = (player: Player) => {
    const radius = 24
    drawToken(ctx, player, listX + radius, cursor + radius + 4, radius)
    const textLeft = listX + radius * 2 + 16
    const textWidth = listWidth - radius * 2 - 16
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = INK.silver
    ctx.font = `600 25px ${SANS}`
    ctx.fillText(fitText(ctx, player.name, textWidth), textLeft, cursor + 24)
    ctx.fillStyle = INK.ash
    ctx.font = `400 20px ${SANS}`
    const positions = positionsOf(player)
      .map((position) => PLAYER_POSITION_LABELS[position])
      .join(' · ')
    ctx.fillText(fitText(ctx, positions, textWidth), textLeft, cursor + 52)
    cursor += 76
  }

  section(`TITULARES (${starters.length})`)
  for (const { player } of starters) row(player)
  if (liberos.length > 0) {
    cursor += 44
    section('LÍBERO')
    for (const { player } of liberos) row(player)
  }

  // ─── Leyenda: solo las posiciones que aparecen ─────────────────────────
  const present = PLAYER_POSITIONS.filter((position) =>
    onCourt.some(({ player }) => positionsOf(player).includes(position)),
  )
  let legendX = margin
  let legendY = courtTop + courtSize * (CANVAS_HEIGHT / CANVAS_WIDTH) + 64
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `600 26px ${SANS}`
  for (const position of present) {
    const label = PLAYER_POSITION_LABELS[position]
    const itemWidth = 28 + 12 + ctx.measureText(label).width + 36
    if (legendX + itemWidth > width - margin) {
      legendX = margin
      legendY += 48
    }
    ctx.beginPath()
    ctx.arc(legendX + 14, legendY, 14, 0, Math.PI * 2)
    ctx.fillStyle = positionColor(position)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.stroke()
    ctx.fillStyle = INK.silver
    ctx.fillText(label, legendX + 40, legendY + 1)
    legendX += itemWidth
  }
  if (present.some((position) => onCourt.some(({ player }) => player.secondary_position === position))) {
    ctx.fillStyle = INK.ash
    ctx.font = `400 22px ${SANS}`
    ctx.fillText('El anillo exterior es la posición secundaria.', margin, legendY + 48)
  }

  // Pie
  ctx.fillStyle = 'rgba(245, 176, 20, 0.35)'
  ctx.fillRect(margin, height - 72, width - margin * 2, 2)
  ctx.fillStyle = INK.ash
  ctx.font = `500 22px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText(`${TEAM_NAME} Volley`, margin, height - 38)
  ctx.textAlign = 'right'
  ctx.fillText(
    new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }),
    width - margin,
    height - 38,
  )
}

export async function renderLineupBlob(lineup: LineupLike, roster: Player[]): Promise<Blob> {
  const assets = await preloadLineupAssets()
  const canvas = document.createElement('canvas')
  renderLineup(canvas, lineup, roster, assets)
  return canvasToBlob(canvas)
}
