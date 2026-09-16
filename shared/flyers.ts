// Generador de flyers: contenido de un flyer, contrato del asistente de IA (POST /api/flyers/suggest) y biblioteca.
// El flyer es solo datos; el dibujo vive en el frontend (src/dashboard/flyers/render.ts).
import { z } from 'zod'

export const FLYER_TEMPLATES = ['partido', 'entrenamiento', 'resultado', 'anuncio', 'agenda'] as const
export type FlyerTemplate = (typeof FLYER_TEMPLATES)[number]

export const FLYER_TEMPLATE_LABELS: Record<FlyerTemplate, string> = {
  partido: 'Día de partido',
  entrenamiento: 'Entrenamiento',
  resultado: 'Resultado',
  anuncio: 'Anuncio',
  agenda: 'Agenda',
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
export const SAVED_FLYER_ID = /^flyer_[a-z0-9]{6,32}$/
export const FLYER_MAX_LOGOS = 4
export const FLYER_MAX_ASSETS = 20
export const FLYER_ASSET_NAME_MAX = 60
const assetId = z.string().regex(FLYER_ASSET_ID)

/** Filas de la plantilla Agenda: varias actividades en una sola imagen. */
export const FLYER_MAX_AGENDA_ITEMS = 6
export const FLYER_AGENDA_LIMITS = { when: 20, what: 34, where: 28 } as const
export type FlyerAgendaField = keyof typeof FLYER_AGENDA_LIMITS

export const flyerAgendaItem = z.object({
  /** "Sáb 20/09 · 18:00" */
  when: z.string().max(FLYER_AGENDA_LIMITS.when),
  /** "vs Onas Vóley" o el título de la actividad. */
  what: z.string().max(FLYER_AGENDA_LIMITS.what),
  where: z.string().max(FLYER_AGENDA_LIMITS.where),
  /** Liga Podio u otro evento a destacar: barra de acento a la izquierda. */
  highlight: z.boolean().default(false),
})
export type FlyerAgendaItem = z.infer<typeof flyerAgendaItem>

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
  // REGLA: todo campo nuevo lleva `.default()`, y ninguno se renombra ni se elimina. Al leer la biblioteca,
  // `readJson` descarta en silencio los JSON que no validan, así que un campo obligatorio nuevo haría
  // desaparecer de golpe los flyers ya guardados (api/_lib/flyerLibrary.ts).
  /** Logo del rival junto al escudo propio (plantillas partido y resultado). */
  opponentLogo: z.union([assetId, z.literal('')]).default(''),
  /** Fila de logos extra (auspiciantes, liga, organizadores). */
  logos: z.array(assetId).max(FLYER_MAX_LOGOS).default([]),
  /** Actividades de la plantilla Agenda; el resto de plantillas la ignoran. */
  agenda: z.array(flyerAgendaItem).max(FLYER_MAX_AGENDA_ITEMS).default([]),
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

// ─── Pie de foto del posteo ───────────────────────────────────────────────────
// El texto se arma en el navegador con los datos del partido o la actividad; la IA solo lo reescribe.

/** Límite de caracteres de un pie de foto en Instagram. */
export const FLYER_CAPTION_MAX = 2200
export const FLYER_CAPTION_HASHTAGS_MAX = 12

export const FLYER_CAPTION_TONES = ['festejo', 'convocatoria', 'sobrio', 'divertido'] as const
export type FlyerCaptionTone = (typeof FLYER_CAPTION_TONES)[number]

export const FLYER_CAPTION_TONE_LABELS: Record<FlyerCaptionTone, string> = {
  festejo: 'Festejo',
  convocatoria: 'Convocatoria',
  sobrio: 'Sobrio',
  divertido: 'Divertido',
}

export const flyerCaptionInput = z.object({
  flyer: flyerContentSchema,
  /** Hoy según quien pide ("YYYY-MM-DD"). */
  today: z.iso.date(),
  /** Texto ya armado con datos reales: la IA reescribe sobre él en vez de inventar. */
  draft: z.string().trim().max(FLYER_CAPTION_MAX).default(''),
  tone: z.enum(FLYER_CAPTION_TONES).default('festejo'),
})
export type FlyerCaptionInput = z.infer<typeof flyerCaptionInput>

export type FlyerCaptionResult = {
  caption: string
  hashtags: string[]
  model: string
}

// ─── Biblioteca en el bucket (carpeta assets/) ───────────────────────────────
// Lectura libre (GET /api/flyers/library); subir, renombrar, borrar y usar la IA exigen FLYERS_SAFEWORD.

/** Flyers guardados como máximo: cada uno es un PNG de 1-3 MB más su JSON editable. */
export const SAVED_FLYERS_LIMIT = 50
/** Las imágenes llegan reducidas a 512 px desde el navegador: 2 MB sobra. */
export const FLYER_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const FLYER_PNG_MAX_BYTES = 10 * 1024 * 1024
export const SAVED_FLYER_LABEL_MAX = 160

export const FLYER_IMAGE_TYPES = ['image/webp', 'image/png'] as const
export type FlyerImageType = (typeof FLYER_IMAGE_TYPES)[number]

export type FlyerImage = FlyerAssetRef & {
  /** URL de lectura (pública o firmada). */
  url: string
  createdAt: string
}

export type SavedFlyer = {
  id: string
  savedAt: string
  source: 'ia' | 'manual'
  /** Pedido a la IA o título del flyer. */
  label: string
  flyer: FlyerContent
  /** PNG exportado. */
  imageUrl: string
}

export type FlyerLibrary = { images: FlyerImage[]; flyers: SavedFlyer[] }

export const flyerUploadUrlInput = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('image'), contentType: z.enum(FLYER_IMAGE_TYPES) }),
  z.object({ kind: z.literal('flyer'), contentType: z.literal('image/png') }),
])
export type FlyerUploadUrlInput = z.infer<typeof flyerUploadUrlInput>

/** URL firmada para subir un archivo directo al bucket con PUT (y las cabeceras que hay que enviar). */
export type FlyerUploadUrl = { id: string; url: string; headers: Record<string, string> }

export const flyerImageSaveInput = z.object({
  id: assetId,
  contentType: z.enum(FLYER_IMAGE_TYPES),
  name: z.string().trim().min(1, 'Ponle un nombre').max(FLYER_ASSET_NAME_MAX),
})
export type FlyerImageSaveInput = z.infer<typeof flyerImageSaveInput>

export const flyerImageRenameInput = z.object({
  id: assetId,
  name: z.string().trim().min(1, 'Ponle un nombre').max(FLYER_ASSET_NAME_MAX),
})
export type FlyerImageRenameInput = z.infer<typeof flyerImageRenameInput>

export const flyerImageDeleteInput = z.object({ id: assetId })
export type FlyerImageDeleteInput = z.infer<typeof flyerImageDeleteInput>

export const savedFlyerSaveInput = z.object({
  id: z.string().regex(SAVED_FLYER_ID),
  source: z.enum(['ia', 'manual']),
  label: z.string().trim().max(SAVED_FLYER_LABEL_MAX),
  flyer: flyerContentSchema,
})
export type SavedFlyerSaveInput = z.infer<typeof savedFlyerSaveInput>

export const savedFlyerDeleteInput = z.object({ id: z.string().regex(SAVED_FLYER_ID) })
export type SavedFlyerDeleteInput = z.infer<typeof savedFlyerDeleteInput>
