// Dibujo de flyers en <canvas>. La vista previa y el PNG descargado salen del mismo código, así que lo
// que se ve es exactamente lo que se exporta. Coordenadas en píxeles del tamaño final (1080 de ancho).
import { FLYER_FORMAT_SIZES, type FlyerAgendaItem, type FlyerContent, type FlyerPalette } from '@shared/flyers'

type Colors = {
  /** Degradado de fondo, de arriba a la izquierda hacia abajo a la derecha. */
  background: string[]
  glow: string
  title: string
  text: string
  muted: string
  accent: string
  onAccent: string
  panel: string
  line: string
}

export const PALETTE_COLORS: Record<FlyerPalette, Colors> = {
  brasa: {
    background: ['#3a1e0e', '#140b06', '#0a0a0a'],
    glow: '#f07c13',
    title: '#f5b014',
    text: '#e4e4e4',
    muted: '#9a9a9a',
    accent: '#f07c13',
    onAccent: '#0a0a0a',
    panel: 'rgba(255, 255, 255, 0.06)',
    line: 'rgba(245, 176, 20, 0.35)',
  },
  dorado: {
    background: ['#f8d31c', '#f5b014', '#f07c13'],
    glow: '#fff3b0',
    title: '#0a0a0a',
    text: '#151311',
    muted: 'rgba(21, 19, 17, 0.72)',
    accent: '#0a0a0a',
    onAccent: '#f5b014',
    panel: 'rgba(10, 10, 10, 0.1)',
    line: 'rgba(10, 10, 10, 0.3)',
  },
  atardecer: {
    background: ['#f07c13', '#7a3412', '#1a0d06'],
    glow: '#f8d31c',
    title: '#fff7e6',
    text: '#fff7e6',
    muted: 'rgba(255, 247, 230, 0.75)',
    accent: '#f8d31c',
    onAccent: '#0a0a0a',
    panel: 'rgba(10, 10, 10, 0.25)',
    line: 'rgba(248, 211, 28, 0.45)',
  },
  podio: {
    background: ['#2383b0', '#1f6f96', '#0b2736'],
    glow: '#d4eef9',
    title: '#ffffff',
    text: '#d4eef9',
    muted: 'rgba(212, 238, 249, 0.75)',
    accent: '#f5b014',
    onAccent: '#0a0a0a',
    panel: 'rgba(255, 255, 255, 0.08)',
    line: 'rgba(212, 238, 249, 0.35)',
  },
}

const DISPLAY = "Teko, 'Arial Narrow', sans-serif"
const SANS = "Inter, system-ui, sans-serif"

/** Fuentes que usa el flyer: hay que esperarlas antes de dibujar o el canvas usa la de reserva. */
export async function loadFlyerFonts(): Promise<void> {
  if (!('fonts' in document)) return
  await Promise.allSettled(
    ['600 100px Teko', '700 100px Teko', '400 40px Inter', '600 40px Inter', '700 40px Inter'].map((font) =>
      document.fonts.load(font, 'ÁÉÍÓÚÑáéíóúñ¡¿'),
    ),
  )
}

/**
 * `crossOrigin`: las imágenes del bucket se piden con CORS; sin eso el lienzo queda "contaminado" y no se puede
 * exportar el PNG. El bucket tiene que permitir GET desde el dominio del dashboard.
 */
export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    if (crossOrigin) image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    image.src = src
  })
}

export type FlyerAssets = {
  logo: HTMLImageElement | null
  /** Foto de fondo elegida por el usuario (solo local: no se guarda ni se envía a la IA). */
  photo: HTMLImageElement | null
  /** Imágenes de la biblioteca por id (logos de rivales, auspiciantes). Las que falten no se dibujan. */
  images: ReadonlyMap<string, HTMLImageElement>
}

type Ctx = CanvasRenderingContext2D
type Align = 'left' | 'center'

// ─── Bloques ─────────────────────────────────────────────────────────────────
// Cada plantilla es una lista de bloques en tres zonas (arriba, centro, abajo). Los bloques se miden
// primero y se dibujan después, así el centro se reparte el espacio libre y todo encoge si no cabe.

type Block = { height: number; draw: (y: number) => void }

type Frame = { ctx: Ctx; width: number; height: number; pad: number; colors: Colors; assets: FlyerAssets }

function setFont(ctx: Ctx, family: string, weight: number, size: number, spacing = 0) {
  ctx.font = `${weight} ${size}px ${family}`
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`
}

function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

type TextOptions = {
  text: string
  family: 'display' | 'sans'
  weight: number
  size: number
  /** Tamaño mínimo al que puede encoger para caber en `maxLines`. */
  minSize?: number
  maxLines: number
  color: string
  align: Align
  lineHeight?: number
  spacing?: number
  uppercase?: boolean
  maxWidth?: number
  shadow?: string
}

function textBlock(frame: Frame, options: TextOptions): Block | null {
  const { ctx, width, pad } = frame
  const raw = options.uppercase ? options.text.toLocaleUpperCase('es') : options.text
  if (!raw.trim()) return null
  const family = options.family === 'display' ? DISPLAY : SANS
  const maxWidth = options.maxWidth ?? width - pad * 2
  const minSize = options.minSize ?? options.size

  let size = options.size
  let lines: string[] = []
  for (;;) {
    setFont(ctx, family, options.weight, size, options.spacing)
    lines = wrap(ctx, raw, maxWidth)
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width))
    if ((lines.length <= options.maxLines && widest <= maxWidth) || size <= minSize) break
    size = Math.max(minSize, Math.floor(size * 0.93))
  }
  if (lines.length > options.maxLines) {
    lines = lines.slice(0, options.maxLines)
    lines[lines.length - 1] = `${lines[lines.length - 1]}…`
  } else if (lines.length > 1) {
    // Si encogiendo un poco cabe en menos líneas, mejor: evita palabras sueltas ("SUMATE A / LA / MANADA").
    for (let candidate = Math.floor(size * 0.95); candidate >= Math.max(minSize, size * 0.8); candidate = Math.floor(candidate * 0.95)) {
      setFont(ctx, family, options.weight, candidate, options.spacing)
      const fewer = wrap(ctx, raw, maxWidth)
      if (fewer.length < lines.length) {
        size = candidate
        lines = fewer
        break
      }
    }
    // Reparte las palabras entre las líneas (como `text-wrap: balance`): el ancho mínimo con las mismas líneas.
    setFont(ctx, family, options.weight, size, options.spacing)
    let low = maxWidth * 0.4
    let high = maxWidth
    while (high - low > 8) {
      const mid = (low + high) / 2
      if (wrap(ctx, raw, mid).length <= lines.length) high = mid
      else low = mid
    }
    lines = wrap(ctx, raw, high)
  }

  // Teko tiene ascendentes cortos: su interlineado útil es menor que el de Inter.
  const lineHeight = size * (options.lineHeight ?? (options.family === 'display' ? 0.92 : 1.3))
  const ascent = size * (options.family === 'display' ? 0.72 : 0.78)
  const height = ascent + lineHeight * (lines.length - 1) + size * (options.family === 'display' ? 0.08 : 0.24)

  return {
    height,
    draw: (y) => {
      setFont(ctx, family, options.weight, size, options.spacing)
      ctx.fillStyle = options.color
      ctx.textAlign = options.align
      ctx.textBaseline = 'alphabetic'
      const x = options.align === 'center' ? width / 2 : pad
      if (options.shadow) {
        ctx.shadowColor = options.shadow
        ctx.shadowBlur = size * 0.25
      }
      lines.forEach((line, index) => ctx.fillText(line, x, y + ascent + index * lineHeight))
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    },
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Etiqueta rellena (eyebrow) o píldora grande (cta). */
function pillBlock(
  frame: Frame,
  text: string,
  { align, size, fill, color, uppercase = true }: { align: Align; size: number; fill: string; color: string; uppercase?: boolean },
): Block | null {
  const { ctx, width, pad } = frame
  const label = uppercase ? text.trim().toLocaleUpperCase('es') : text.trim()
  if (!label) return null
  const padX = size * 0.7
  const height = size * 1.9
  const maxText = width - pad * 2 - padX * 2
  let fontSize = size
  setFont(ctx, SANS, 700, fontSize, size * 0.06)
  while (ctx.measureText(label).width > maxText && fontSize > size * 0.6) {
    fontSize -= 2
    setFont(ctx, SANS, 700, fontSize, size * 0.06)
  }
  const textWidth = Math.min(ctx.measureText(label).width, maxText)
  const boxWidth = textWidth + padX * 2

  return {
    height,
    draw: (y) => {
      const x = align === 'center' ? (width - boxWidth) / 2 : pad
      ctx.fillStyle = fill
      roundRect(ctx, x, y, boxWidth, height, height / 2)
      ctx.fill()
      setFont(ctx, SANS, 700, fontSize, size * 0.06)
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x + boxWidth / 2, y + height / 2 + fontSize * 0.04, maxText)
    },
  }
}

function logoBlock(frame: Frame, size: number, align: Align): Block | null {
  const { ctx, width, pad, assets } = frame
  const logo = assets.logo
  if (!logo) return null
  const h = size * (logo.naturalHeight / logo.naturalWidth)
  return {
    height: h,
    draw: (y) => {
      const x = align === 'center' ? (width - size) / 2 : pad
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
      ctx.shadowBlur = size * 0.08
      ctx.shadowOffsetY = size * 0.02
      ctx.drawImage(logo, x, y, size, h)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    },
  }
}

/** Dibuja la imagen centrada en una caja cuadrada, sin deformarla. */
function drawContained(ctx: Ctx, image: HTMLImageElement, x: number, y: number, box: number) {
  const ratio = Math.min(box / image.naturalWidth, box / image.naturalHeight)
  const w = image.naturalWidth * ratio
  const h = image.naturalHeight * ratio
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
  ctx.shadowBlur = box * 0.06
  ctx.shadowOffsetY = box * 0.015
  ctx.drawImage(image, x + (box - w) / 2, y + (box - h) / 2, w, h)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
}

const imageFor = (frame: Frame, id: string) => (id ? (frame.assets.images.get(id) ?? null) : null)

type MatchupOptions = {
  left: HTMLImageElement | null
  right: HTMLImageElement | null
  center: string
  logoSize: number
  textSize: number
  minTextSize: number
  color: string
  shadow?: string
}

/** Escudo propio · texto central ("VS" o marcador) · logo del rival, en una fila. */
function matchupBlock(frame: Frame, options: MatchupOptions): Block {
  const { ctx, width, pad } = frame
  const { left, right, logoSize } = options
  const center = options.center.trim().toLocaleUpperCase('es')
  const spacing = logoSize * 0.14
  const textRoom = width - pad * 2 - (logoSize + spacing) * 2

  let size = options.textSize
  setFont(ctx, DISPLAY, 700, size)
  while (center && ctx.measureText(center).width > textRoom && size > options.minTextSize) {
    size = Math.max(options.minTextSize, Math.floor(size * 0.93))
    setFont(ctx, DISPLAY, 700, size)
  }
  const textWidth = center ? Math.min(ctx.measureText(center).width, textRoom) : 0
  // Mayúsculas de Teko: ~0,72 del tamaño. La fila mide lo que el más alto de sus elementos.
  const height = Math.max(logoSize, size * 0.8)
  const rowWidth = logoSize * 2 + (center ? textWidth + spacing * 2 : spacing * 2)

  return {
    height,
    draw: (y) => {
      const x = (width - rowWidth) / 2
      if (left) drawContained(ctx, left, x, y + (height - logoSize) / 2, logoSize)
      if (right) drawContained(ctx, right, x + rowWidth - logoSize, y + (height - logoSize) / 2, logoSize)
      if (!center) return
      setFont(ctx, DISPLAY, 700, size)
      ctx.fillStyle = options.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      if (options.shadow) {
        ctx.shadowColor = options.shadow
        ctx.shadowBlur = size * 0.25
      }
      ctx.fillText(center, width / 2, y + height / 2 + size * 0.36, textRoom)
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    },
  }
}

/** Fila de logos extra (auspiciantes, liga...). Encoge si no caben a lo ancho. */
function logoRowBlock(frame: Frame, ids: string[], size: number, align: Align): Block | null {
  const { ctx, width, pad } = frame
  const images = ids.map((id) => imageFor(frame, id)).filter((image): image is HTMLImageElement => image !== null)
  if (images.length === 0) return null
  const spacing = size * 0.35
  const available = width - pad * 2
  const box = Math.min(size, (available - spacing * (images.length - 1)) / images.length)
  const rowWidth = box * images.length + spacing * (images.length - 1)
  return {
    height: box,
    draw: (y) => {
      const start = align === 'center' ? (width - rowWidth) / 2 : pad
      images.forEach((image, index) => drawContained(ctx, image, start + index * (box + spacing), y, box))
    },
  }
}

/** Fila con logo a la izquierda y etiqueta a la derecha (cabecera de las plantillas alineadas a la izquierda). */
function headerRow(frame: Frame, eyebrow: string, logoSize: number, showLogo: boolean): Block | null {
  const { ctx, width, pad, colors } = frame
  const chip = pillBlock(frame, eyebrow, { align: 'left', size: 30, fill: colors.accent, color: colors.onAccent })
  const logo = showLogo ? logoBlock(frame, logoSize, 'left') : null
  if (!chip && !logo) return null
  const height = Math.max(chip?.height ?? 0, logo?.height ?? 0)
  return {
    height,
    draw: (y) => {
      chip?.draw(y + (height - chip.height) / 2)
      if (logo && frame.assets.logo) {
        ctx.save()
        ctx.translate(width - pad * 2 - logoSize, 0)
        logo.draw(y + (height - logo.height) / 2)
        ctx.restore()
      }
    },
  }
}

type InfoItem = { label: string; value: string }

/** Panel con fecha, hora y lugar en columnas (o en filas si no caben). */
function infoPanel(frame: Frame, items: InfoItem[], scale: number): Block | null {
  const { ctx, width, pad, colors } = frame
  const filled = items.filter((item) => item.value.trim())
  if (filled.length === 0) return null
  const inner = 44 * scale
  const panelWidth = width - pad * 2
  const labelSize = 24 * scale
  const valueSize = 62 * scale

  // Lugar suele ser largo: va en su propia fila bajo fecha y hora.
  const columns = filled.filter((item) => item.label !== 'Lugar')
  const place = filled.find((item) => item.label === 'Lugar')
  const rowHeight = labelSize * 1.5 + valueSize * 0.95
  const placeBlock = place
    ? textBlock(frame, {
        text: place.value,
        family: 'display',
        weight: 600,
        size: valueSize,
        minSize: valueSize * 0.7,
        maxLines: 2,
        color: colors.text,
        align: 'left',
        uppercase: true,
        maxWidth: panelWidth - inner * 2,
      })
    : null
  const placeHeight = placeBlock ? labelSize * 1.5 + placeBlock.height : 0
  const gap = columns.length > 0 && placeBlock ? 36 * scale : 0
  const height = inner * 2 + (columns.length > 0 ? rowHeight : 0) + gap + placeHeight

  const drawLabel = (text: string, x: number, y: number) => {
    setFont(ctx, SANS, 600, labelSize, labelSize * 0.14)
    ctx.fillStyle = colors.muted
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(text.toLocaleUpperCase('es'), x, y)
  }

  return {
    height,
    draw: (y) => {
      ctx.fillStyle = colors.panel
      roundRect(ctx, pad, y, panelWidth, height, 28)
      ctx.fill()
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 2
      ctx.stroke()

      let cursor = y + inner
      if (columns.length > 0) {
        const columnWidth = (panelWidth - inner * 2) / columns.length
        columns.forEach((item, index) => {
          const x = pad + inner + index * columnWidth
          drawLabel(item.label, x, cursor)
          setFont(ctx, DISPLAY, 600, valueSize)
          ctx.fillStyle = colors.text
          ctx.textBaseline = 'alphabetic'
          ctx.fillText(item.value.toLocaleUpperCase('es'), x, cursor + labelSize * 1.5 + valueSize * 0.72, columnWidth - 24)
          if (index > 0) {
            ctx.fillStyle = colors.line
            ctx.fillRect(x - 24, cursor, 2, rowHeight)
          }
        })
        cursor += rowHeight + gap
      }
      if (place && placeBlock) {
        drawLabel(place.label, pad + inner, cursor)
        ctx.save()
        ctx.translate(inner, 0)
        placeBlock.draw(cursor + labelSize * 1.5)
        ctx.restore()
      }
    },
  }
}

/**
 * Una actividad de la agenda: barra de acento, cuándo (en color de acento), qué (destacado) y dónde (apagado).
 * Dibuja a partir de `pad`; quien la monta desplaza el lienzo hasta el interior del panel.
 */
function agendaRowBlock(frame: Frame, item: FlyerAgendaItem, s: number, contentWidth: number): Block | null {
  const { ctx, pad, colors } = frame
  if (!item.what.trim()) return null
  const rail = 10 * s
  const railGap = 22 * s
  const maxWidth = contentWidth - rail - railGap
  const parts = [
    textBlock(frame, { text: item.when, family: 'sans', weight: 600, size: 28 * s, minSize: 22 * s, maxLines: 1, color: colors.accent, align: 'left', uppercase: true, spacing: 2 * s, maxWidth }),
    textBlock(frame, { text: item.what, family: 'display', weight: 600, size: 78 * s, minSize: 46 * s, maxLines: 1, color: colors.title, align: 'left', uppercase: true, maxWidth }),
    textBlock(frame, { text: item.where, family: 'sans', weight: 400, size: 28 * s, minSize: 22 * s, maxLines: 1, color: colors.muted, align: 'left', maxWidth }),
  ].filter((block): block is Block => block !== null)
  if (parts.length === 0) return null

  const lineGap = 6 * s
  const height = parts.reduce((total, block) => total + block.height, 0) + lineGap * (parts.length - 1)
  return {
    height,
    draw: (y) => {
      ctx.fillStyle = item.highlight ? colors.accent : colors.line
      ctx.fillRect(pad, y, rail, height)
      ctx.save()
      ctx.translate(rail + railGap, 0)
      let cursor = y
      for (const block of parts) {
        block.draw(cursor)
        cursor += block.height + lineGap
      }
      ctx.restore()
    },
  }
}

/** Panel con las actividades separadas por una línea fina. Null si ninguna fila tiene qué mostrar. */
function agendaListBlock(frame: Frame, items: FlyerAgendaItem[], s: number): Block | null {
  const { ctx, width, pad, colors } = frame
  const inner = 40 * s
  const panelWidth = width - pad * 2
  const contentWidth = panelWidth - inner * 2
  const rows = items
    .map((item) => agendaRowBlock(frame, item, s, contentWidth))
    .filter((block): block is Block => block !== null)
  if (rows.length === 0) return null

  const rowGap = 24 * s
  const separator = 2
  const height =
    inner * 2 + rows.reduce((total, row) => total + row.height, 0) + (rowGap * 2 + separator) * (rows.length - 1)

  return {
    height,
    draw: (y) => {
      ctx.fillStyle = colors.panel
      roundRect(ctx, pad, y, panelWidth, height, 28)
      ctx.fill()
      ctx.strokeStyle = colors.line
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(inner, 0)
      let cursor = y + inner
      rows.forEach((row, index) => {
        row.draw(cursor)
        cursor += row.height
        if (index === rows.length - 1) return
        cursor += rowGap
        ctx.fillStyle = colors.line
        ctx.fillRect(pad, cursor, contentWidth, separator)
        cursor += separator + rowGap
      })
      ctx.restore()
    },
  }
}

function barBlock(frame: Frame, align: Align, scale: number): Block {
  const { ctx, width, pad, colors } = frame
  const w = 150 * scale
  const h = 12 * scale
  return {
    height: h,
    draw: (y) => {
      ctx.fillStyle = colors.accent
      ctx.fillRect(align === 'center' ? (width - w) / 2 : pad, y, w, h)
    },
  }
}

const gap = (height: number): Block => ({ height, draw: () => undefined })

// ─── Fondo ───────────────────────────────────────────────────────────────────

function drawBackground({ ctx, width, height, colors, assets }: Frame, showLogo: boolean) {
  const gradient = ctx.createLinearGradient(0, 0, width * 0.6, height)
  colors.background.forEach((color, index) => gradient.addColorStop(index / (colors.background.length - 1), color))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  if (assets.photo) {
    const photo = assets.photo
    const cover = Math.max(width / photo.naturalWidth, height / photo.naturalHeight)
    const w = photo.naturalWidth * cover
    const h = photo.naturalHeight * cover
    ctx.globalAlpha = 0.55
    ctx.drawImage(photo, (width - w) / 2, (height - h) / 2, w, h)
    ctx.globalAlpha = 1
    // Velo con el color de la paleta para que el texto siga leyéndose sobre cualquier foto.
    const veil = ctx.createLinearGradient(0, 0, 0, height)
    veil.addColorStop(0, withAlpha(colors.background[colors.background.length - 1], 0.35))
    veil.addColorStop(0.55, withAlpha(colors.background[colors.background.length - 1], 0.7))
    veil.addColorStop(1, withAlpha(colors.background[colors.background.length - 1], 0.92))
    ctx.fillStyle = veil
    ctx.fillRect(0, 0, width, height)
  }

  // Resplandor cálido arriba a la derecha.
  const glow = ctx.createRadialGradient(width * 0.85, height * 0.12, 0, width * 0.85, height * 0.12, width * 0.9)
  glow.addColorStop(0, withAlpha(colors.glow, 0.35))
  glow.addColorStop(1, withAlpha(colors.glow, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  // Coyote gigante y tenue como marca de agua, cortado por el borde.
  if (showLogo && assets.logo) {
    const size = width * 1.05
    ctx.globalAlpha = 0.06
    ctx.drawImage(assets.logo, width * 0.32, height - size * 0.78, size, size * (assets.logo.naturalHeight / assets.logo.naturalWidth))
    ctx.globalAlpha = 1
  }

  // Trazos diagonales de velocidad abajo a la izquierda.
  ctx.save()
  ctx.translate(0, height)
  ctx.rotate(-Math.PI / 5)
  ctx.fillStyle = withAlpha(colors.accent, 0.14)
  for (let i = 0; i < 3; i++) ctx.fillRect(-width * 0.2, 60 + i * 46, width * (0.55 - i * 0.12), 16)
  ctx.restore()
}

function drawBorder({ ctx, width, height, colors }: Frame) {
  const inset = 34
  ctx.strokeStyle = colors.line
  ctx.lineWidth = 3
  roundRect(ctx, inset, inset, width - inset * 2, height - inset * 2, 30)
  ctx.stroke()
}

/** "#rrggbb" o "rgba(...)" con otra opacidad. */
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const n = Number.parseInt(color.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
  }
  return color.replace(/rgba?\(([^,]+),([^,]+),([^,)]+)(?:,[^)]+)?\)/, `rgba($1,$2,$3, ${alpha})`)
}

// ─── Plantillas ──────────────────────────────────────────────────────────────

type Zones = { top: (Block | null)[]; middle: (Block | null)[]; bottom: (Block | null)[] }

function info(flyer: FlyerContent): InfoItem[] {
  return [
    { label: 'Fecha', value: flyer.date },
    { label: 'Hora', value: flyer.time },
    { label: 'Lugar', value: flyer.location },
  ]
}

function partido(frame: Frame, flyer: FlyerContent, s: number, tall: boolean): Zones {
  const { colors } = frame
  const rival = imageFor(frame, flyer.opponentLogo)
  const logos = logoRowBlock(frame, flyer.logos, 130 * s, 'center')
  const bottom = [
    infoPanel(frame, info(flyer), s),
    logos ? gap(20 * s) : null,
    logos,
    flyer.cta ? gap(logos ? 20 * s : 36 * s) : null,
    pillBlock(frame, flyer.cta, { align: 'center', size: 40 * s, fill: colors.accent, color: colors.onAccent }),
  ]
  // Con logo del rival, el escudo baja del encabezado a la fila del "VS".
  if (rival) {
    return {
      top: [pillBlock(frame, flyer.eyebrow, { align: 'center', size: 30 * s, fill: colors.accent, color: colors.onAccent })],
      middle: [
        textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 210 * s, minSize: 110 * s, maxLines: 2, color: colors.title, align: 'center', uppercase: true }),
        gap(12 * s),
        matchupBlock(frame, { left: flyer.showLogo ? frame.assets.logo : null, right: rival, center: flyer.highlight, logoSize: (tall ? 300 : 250) * s, textSize: 150 * s, minTextSize: 80 * s, color: colors.accent }),
        gap(12 * s),
        textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 100 * s, minSize: 64 * s, maxLines: 2, color: colors.text, align: 'center', uppercase: true }),
      ],
      bottom,
    }
  }
  return {
    top: [
      flyer.showLogo ? logoBlock(frame, (tall ? 300 : 220) * s, 'center') : null,
      flyer.eyebrow ? gap(28 * s) : null,
      pillBlock(frame, flyer.eyebrow, { align: 'center', size: 30 * s, fill: colors.accent, color: colors.onAccent }),
    ],
    middle: [
      textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 230 * s, minSize: 120 * s, maxLines: 2, color: colors.title, align: 'center', uppercase: true }),
      textBlock(frame, { text: flyer.highlight, family: 'display', weight: 700, size: 150 * s, minSize: 90 * s, maxLines: 1, color: colors.accent, align: 'center', uppercase: true }),
      textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 110 * s, minSize: 70 * s, maxLines: 2, color: colors.text, align: 'center', uppercase: true }),
    ],
    bottom,
  }
}

function entrenamiento(frame: Frame, flyer: FlyerContent, s: number): Zones {
  const { colors } = frame
  const logos = logoRowBlock(frame, flyer.logos, 130 * s, 'left')
  return {
    top: [headerRow(frame, flyer.eyebrow, 190 * s, flyer.showLogo)],
    middle: [
      textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 250 * s, minSize: 120 * s, maxLines: 3, color: colors.title, align: 'left', uppercase: true }),
      textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 100 * s, minSize: 64 * s, maxLines: 2, color: colors.text, align: 'left', uppercase: true }),
      gap(24 * s),
      barBlock(frame, 'left', s),
      flyer.details ? gap(36 * s) : null,
      textBlock(frame, { text: flyer.details, family: 'sans', weight: 400, size: 42 * s, minSize: 32 * s, maxLines: 5, color: colors.muted, align: 'left' }),
    ],
    bottom: [
      infoPanel(frame, info(flyer), s),
      logos ? gap(20 * s) : null,
      logos,
      flyer.cta ? gap(logos ? 20 * s : 36 * s) : null,
      pillBlock(frame, flyer.cta, { align: 'left', size: 40 * s, fill: colors.accent, color: colors.onAccent }),
    ],
  }
}

function resultado(frame: Frame, flyer: FlyerContent, s: number, tall: boolean): Zones {
  const { colors } = frame
  const rival = imageFor(frame, flyer.opponentLogo)
  const logos = logoRowBlock(frame, flyer.logos, 130 * s, 'center')
  const bottom = [
    logos,
    logos && flyer.cta ? gap(20 * s) : null,
    pillBlock(frame, flyer.cta, { align: 'center', size: 40 * s, fill: colors.accent, color: colors.onAccent }),
  ]
  const details = [
    flyer.details ? gap(20 * s) : null,
    textBlock(frame, { text: flyer.details, family: 'sans', weight: 600, size: 40 * s, minSize: 30 * s, maxLines: 3, color: colors.muted, align: 'center' }),
  ]
  // Con logo del rival, el marcador queda entre los dos escudos.
  if (rival) {
    return {
      top: [pillBlock(frame, flyer.eyebrow, { align: 'center', size: 30 * s, fill: colors.accent, color: colors.onAccent })],
      middle: [
        textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 190 * s, minSize: 110 * s, maxLines: 2, color: colors.title, align: 'center', uppercase: true }),
        gap(16 * s),
        matchupBlock(frame, { left: flyer.showLogo ? frame.assets.logo : null, right: rival, center: flyer.highlight, logoSize: (tall ? 280 : 230) * s, textSize: 280 * s, minTextSize: 120 * s, color: colors.text, shadow: withAlpha(colors.glow, 0.6) }),
        gap(8 * s),
        textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 100 * s, minSize: 64 * s, maxLines: 2, color: colors.accent, align: 'center', uppercase: true }),
        ...details,
      ],
      bottom,
    }
  }
  return {
    top: [
      flyer.showLogo ? logoBlock(frame, (tall ? 260 : 200) * s, 'center') : null,
      flyer.eyebrow ? gap(28 * s) : null,
      pillBlock(frame, flyer.eyebrow, { align: 'center', size: 30 * s, fill: colors.accent, color: colors.onAccent }),
    ],
    middle: [
      textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 200 * s, minSize: 110 * s, maxLines: 2, color: colors.title, align: 'center', uppercase: true }),
      textBlock(frame, { text: flyer.highlight, family: 'display', weight: 700, size: 400 * s, minSize: 180 * s, maxLines: 1, color: colors.text, align: 'center', shadow: withAlpha(colors.glow, 0.6) }),
      textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 100 * s, minSize: 64 * s, maxLines: 2, color: colors.accent, align: 'center', uppercase: true }),
      ...details,
    ],
    bottom,
  }
}

function anuncio(frame: Frame, flyer: FlyerContent, s: number, tall: boolean): Zones {
  const { colors } = frame
  const when = [flyer.date, flyer.time, flyer.location].map((part) => part.trim()).filter(Boolean).join('  ·  ')
  const logos = logoRowBlock(frame, flyer.logos, 130 * s, 'center')
  return {
    top: [pillBlock(frame, flyer.eyebrow, { align: 'center', size: 30 * s, fill: colors.accent, color: colors.onAccent })],
    middle: [
      flyer.showLogo ? logoBlock(frame, (tall ? 460 : 340) * s, 'center') : null,
      flyer.showLogo ? gap(30 * s) : null,
      textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 220 * s, minSize: 110 * s, maxLines: 3, color: colors.title, align: 'center', uppercase: true }),
      textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 96 * s, minSize: 60 * s, maxLines: 2, color: colors.text, align: 'center', uppercase: true }),
      flyer.details ? gap(28 * s) : null,
      textBlock(frame, { text: flyer.details, family: 'sans', weight: 400, size: 42 * s, minSize: 32 * s, maxLines: 5, color: colors.muted, align: 'center' }),
    ],
    bottom: [
      textBlock(frame, { text: when, family: 'display', weight: 600, size: 64 * s, minSize: 44 * s, maxLines: 2, color: colors.text, align: 'center', uppercase: true }),
      when && logos ? gap(24 * s) : null,
      logos,
      (when || logos) && flyer.cta ? gap(logos ? 20 * s : 30 * s) : null,
      pillBlock(frame, flyer.cta, { align: 'center', size: 40 * s, fill: colors.accent, color: colors.onAccent }),
    ],
  }
}

/** Varias actividades en una sola imagen: la semana o el mes de la manada. */
function agenda(frame: Frame, flyer: FlyerContent, s: number): Zones {
  const { colors } = frame
  const logos = logoRowBlock(frame, flyer.logos, 110 * s, 'left')
  // Las filas sin "qué" no se dibujan: sin panel tampoco va el hueco que lo separa del título.
  const list = agendaListBlock(frame, flyer.agenda, s)
  return {
    top: [headerRow(frame, flyer.eyebrow, 150 * s, flyer.showLogo)],
    middle: [
      textBlock(frame, { text: flyer.title, family: 'display', weight: 700, size: 190 * s, minSize: 100 * s, maxLines: 2, color: colors.title, align: 'left', uppercase: true }),
      textBlock(frame, { text: flyer.subtitle, family: 'display', weight: 600, size: 80 * s, minSize: 50 * s, maxLines: 1, color: colors.accent, align: 'left', uppercase: true }),
      list ? gap(20 * s) : null,
      list,
    ],
    bottom: [
      logos,
      logos && flyer.cta ? gap(20 * s) : null,
      pillBlock(frame, flyer.cta, { align: 'left', size: 38 * s, fill: colors.accent, color: colors.onAccent }),
    ],
  }
}

const TEMPLATES = { partido, entrenamiento, resultado, anuncio, agenda }

// ─── Composición ─────────────────────────────────────────────────────────────

const heightOf = (blocks: Block[], spacing: number) =>
  blocks.reduce((total, block) => total + block.height, 0) + spacing * Math.max(0, blocks.length - 1)

/**
 * Dibuja el flyer en el canvas. `pixelRatio` escala el lienzo (p.ej. miniaturas a 0,25) sin cambiar
 * el diseño: siempre se compone en el tamaño final del formato.
 */
export function renderFlyer(canvas: HTMLCanvasElement, flyer: FlyerContent, assets: FlyerAssets, pixelRatio = 1) {
  const { width, height } = FLYER_FORMAT_SIZES[flyer.format]
  canvas.width = Math.round(width * pixelRatio)
  canvas.height = Math.round(height * pixelRatio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  const frame: Frame = { ctx, width, height, pad: 96, colors: PALETTE_COLORS[flyer.palette], assets }
  drawBackground(frame, flyer.showLogo)
  drawBorder(frame)

  const tall = height / width > 1.5
  const spacing = 18
  const available = height - frame.pad * 2

  // Se compone a escala 1 y, si no entra, se reduce todo poco a poco.
  let zones: { top: Block[]; middle: Block[]; bottom: Block[] } = { top: [], middle: [], bottom: [] }
  for (let scale = height < width * 1.1 ? 0.86 : 1; scale >= 0.5; scale -= 0.05) {
    const raw = TEMPLATES[flyer.template](frame, flyer, scale, tall)
    zones = {
      top: raw.top.filter((b): b is Block => b !== null),
      middle: raw.middle.filter((b): b is Block => b !== null),
      bottom: raw.bottom.filter((b): b is Block => b !== null),
    }
    const used = heightOf(zones.top, spacing) + heightOf(zones.middle, spacing) + heightOf(zones.bottom, spacing)
    if (used + 80 * scale <= available) break
  }

  const topHeight = heightOf(zones.top, spacing)
  const bottomHeight = heightOf(zones.bottom, spacing)
  const middleHeight = heightOf(zones.middle, spacing)
  const freeTop = frame.pad + topHeight
  const freeBottom = height - frame.pad - bottomHeight
  // El bloque central queda un poco por encima del centro óptico del hueco libre.
  let y = freeTop + Math.max(0, (freeBottom - freeTop - middleHeight) * 0.45)

  let cursor = frame.pad
  for (const block of zones.top) {
    block.draw(cursor)
    cursor += block.height + spacing
  }
  for (const block of zones.middle) {
    block.draw(y)
    y += block.height + spacing
  }
  cursor = freeBottom
  for (const block of zones.bottom) {
    block.draw(cursor)
    cursor += block.height + spacing
  }
}

/** PNG del flyer en tamaño real, sin pasar por la vista previa (p.ej. para guardar el resultado de la IA). */
export function renderFlyerBlob(flyer: FlyerContent, assets: FlyerAssets): Promise<Blob> {
  const canvas = document.createElement('canvas')
  renderFlyer(canvas, flyer, assets)
  return canvasToBlob(canvas)
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))), 'image/png'),
  )
}
