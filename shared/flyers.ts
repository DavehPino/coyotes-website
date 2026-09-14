// Generador de flyers: contenido de un flyer y contrato del asistente de IA (POST /api/admin/flyer-suggest).
// El flyer es solo datos; el dibujo vive en el frontend (src/dashboard/flyers/render.ts).
import { z } from 'zod'

export const FLYER_TEMPLATES = ['partido', 'entrenamiento', 'resultado', 'anuncio'] as const
export type FlyerTemplate = (typeof FLYER_TEMPLATES)[number]

export const FLYER_TEMPLATE_LABELS: Record<FlyerTemplate, string> = {
  partido: 'Día de partido',
  entrenamiento: 'Entrenamiento',
  resultado: 'Resultado',
  anuncio: 'Anuncio',
}

/** Paletas de marca: el asistente elige entre ellas en vez de inventar colores. */
export const FLYER_PALETTES = ['brasa', 'dorado', 'atardecer', 'podio'] as const
export type FlyerPalette = (typeof FLYER_PALETTES)[number]

export const FLYER_PALETTE_LABELS: Record<FlyerPalette, string> = {
  brasa: 'Brasa',
  dorado: 'Dorado',
  atardecer: 'Atardecer',
  podio: 'Liga Podio',
}

/** Formatos de Instagram: publicación vertical, cuadrada e historia. */
export const FLYER_FORMATS = ['post', 'square', 'story'] as const
export type FlyerFormat = (typeof FLYER_FORMATS)[number]

export const FLYER_FORMAT_SIZES: Record<FlyerFormat, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1350, label: 'Post 4:5' },
  square: { width: 1080, height: 1080, label: 'Cuadrado' },
  story: { width: 1080, height: 1920, label: 'Historia' },
}

/** Campos de texto del flyer. Cada plantilla usa un subconjunto (ver templates.ts). */
export const FLYER_TEXT_FIELDS = [
  'eyebrow',
  'title',
  'subtitle',
  'highlight',
  'date',
  'time',
  'location',
  'details',
  'cta',
] as const
export type FlyerTextField = (typeof FLYER_TEXT_FIELDS)[number]

export const FLYER_TEXT_LIMITS: Record<FlyerTextField, number> = {
  eyebrow: 40,
  title: 40,
  subtitle: 60,
  highlight: 24,
  date: 40,
  time: 30,
  location: 60,
  details: 220,
  cta: 50,
}

const text = (field: FlyerTextField) => z.string().max(FLYER_TEXT_LIMITS[field])

/**
 * Imágenes propias (logos de rivales, auspiciantes...). Viven solo en el navegador; el flyer guarda su id y a la IA
 * se le envía el id con el nombre que puso el usuario, nunca la imagen.
 */
export const FLYER_ASSET_ID = /^asset_[a-z0-9]{6,32}$/
export const FLYER_MAX_LOGOS = 4
export const FLYER_MAX_ASSETS = 20
export const FLYER_ASSET_NAME_MAX = 60
const assetId = z.string().regex(FLYER_ASSET_ID)

export const flyerContentSchema = z.object({
  template: z.enum(FLYER_TEMPLATES),
  palette: z.enum(FLYER_PALETTES),
  format: z.enum(FLYER_FORMATS),
  showLogo: z.boolean(),
  eyebrow: text('eyebrow'),
  title: text('title'),
  subtitle: text('subtitle'),
  highlight: text('highlight'),
  date: text('date'),
  time: text('time'),
  location: text('location'),
  details: text('details'),
  cta: text('cta'),
  // Con valor por defecto: los borradores y guardados de antes de existir estos campos siguen siendo válidos.
  /** Logo del rival junto al escudo propio (plantillas partido y resultado). */
  opponentLogo: z.union([assetId, z.literal('')]).default(''),
  /** Fila de logos extra (auspiciantes, liga, organizadores). */
  logos: z.array(assetId).max(FLYER_MAX_LOGOS).default([]),
})
export type FlyerContent = z.infer<typeof flyerContentSchema>

export const flyerAssetRef = z.object({
  id: assetId,
  name: z.string().trim().min(1).max(FLYER_ASSET_NAME_MAX),
})
export type FlyerAssetRef = z.infer<typeof flyerAssetRef>

export const FLYER_PROMPT_MAX = 600

export const flyerSuggestInput = z.object({
  prompt: z.string().trim().min(1, 'Escribe qué quieres cambiar').max(FLYER_PROMPT_MAX),
  flyer: flyerContentSchema,
  /** Hoy según quien pide ("YYYY-MM-DD"): para entender "el sábado" o "la semana que viene". */
  today: z.iso.date(),
  /** Imágenes disponibles para que la IA las coloque en el flyer. */
  assets: z.array(flyerAssetRef).max(FLYER_MAX_ASSETS).default([]),
})
export type FlyerSuggestInput = z.infer<typeof flyerSuggestInput>

export type FlyerSuggestion = {
  flyer: FlyerContent
  /** Explicación breve de lo que cambió el asistente. */
  message: string
  model: string
}
