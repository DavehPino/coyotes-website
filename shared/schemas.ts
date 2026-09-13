// Contratos de la API (validados en backend, tipos compartidos con el frontend).
// Lecturas públicas para el dashboard; las escrituras (/api/admin/*) exigen la palabra clave.
import { z } from 'zod'
import {
  ACTIVITY_CATEGORIES,
  MATCH_COMPETITIONS,
  MAX_SETS,
  MAX_VIDEO_BYTES,
  type ActivityCategory,
  type ActivityType,
  type MatchOutcome,
  type VideoCategory,
  type VideoSource,
  type VideoStatus,
} from './domain.js'

const isoDate = z.iso.date()

// ─── Teams ───────────────────────────────────────────────────────────────────
export type Team = {
  id: string
  name: string
  short_name: string | null
  is_own_team: boolean
  category: string | null
  city: string | null
  logo_url: string | null
}

export type TeamSummary = Pick<Team, 'id' | 'name' | 'short_name' | 'logo_url'>

// ─── Activities ──────────────────────────────────────────────────────────────
export type Activity = {
  id: string
  title: string
  activity_type: ActivityType
  category: ActivityCategory
  activity_date: string // YYYY-MM-DD
  start_time: string | null // HH:MM:SS
  end_time: string | null
  location: string | null
  description: string | null
  is_cancelled: boolean
  opponent: TeamSummary | null
}

export const upcomingActivitiesQuery = z.object({
  // Primer día a incluir (YYYY-MM-DD): el "hoy" de quien consulta. Por defecto, hoy en el servidor.
  from: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

// ─── Videos ──────────────────────────────────────────────────────────────────
export type Video = {
  id: string
  title: string
  description: string | null
  source: VideoSource
  storage_key: string | null
  url: string | null
  thumbnail_url: string | null
  content_type: string | null
  size_bytes: number | null
  duration_seconds: number | null
  category: VideoCategory
  recorded_on: string | null
  tags: string[]
  status: VideoStatus
  match_id: string | null
  set_number: number | null
  sort_order: number
}

export type Playback = { url: string; expiresAt: string | null }

export type SyncResult = {
  scanned: number
  created: number
  updated: number
  linked_to_match: number
  missing_in_bucket: number
}

// ─── Matches ─────────────────────────────────────────────────────────────────
export const setScoreSchema = z.object({
  us: z.number().int().min(0).max(99),
  them: z.number().int().min(0).max(99),
})
export type SetScore = z.infer<typeof setScoreSchema>

export type MatchSummary = {
  id: string
  slug: string
  played_on: string
  start_time: string | null
  is_home: boolean
  location: string | null
  competition: string | null
  phase: string | null
  sets_won: number | null
  sets_lost: number | null
  outcome: MatchOutcome
  cover_image_url: string | null
  opponent: TeamSummary
  video_count: number
}

export type MatchDetail = MatchSummary & {
  set_scores: SetScore[]
  summary: string | null
  videos: Video[]
}

export const matchListQuery = z.object({
  // Solo partidos jugados antes de esta fecha (incluida). Por defecto, hoy.
  until: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// ─── Escritura desde el dashboard (/api/admin/*) ─────────────────────────────
// La palabra clave viaja en la cabecera ADMIN_SAFEWORD_HEADER (shared/domain.ts).

/** Texto opcional: recorta espacios y convierte la cadena vacía en null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null)

const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export const newTeamInput = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del equipo').max(80),
  short_name: optionalText(4).transform((value) => value?.toUpperCase() ?? null),
  logo_url: optionalText(2048).refine((value) => value === null || isHttpUrl(value), 'La URL del logo no es válida'),
})
export type NewTeamInput = z.infer<typeof newTeamInput>

const noOpponent = z.object({ kind: z.literal('none') })
const existingOpponent = z.object({ kind: z.literal('existing'), team_id: z.uuid() })
const newOpponent = z.object({ kind: z.literal('new'), team: newTeamInput })
/** Rival: ninguno (solo actividades), uno existente o uno nuevo que se crea al guardar. */
export type OpponentInput = z.infer<typeof noOpponent | typeof existingOpponent | typeof newOpponent>

/** "HH:MM" en 24 horas. */
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora no válida')

export const activityCreateInput = z.object({
  title: z.string().trim().min(1, 'Escribe un título').max(120),
  description: optionalText(2000),
  activity_date: isoDate,
  start_time: timeOfDay,
  category: z.enum(ACTIVITY_CATEGORIES),
  opponent: z.discriminatedUnion('kind', [noOpponent, existingOpponent, newOpponent]),
  location: optionalText(120),
})
export type ActivityCreateInput = z.infer<typeof activityCreateInput>

/** Edición de una actividad: los mismos campos que el alta. */
export const activityUpdateInput = activityCreateInput.extend({ id: z.uuid() })
export type ActivityUpdateInput = z.infer<typeof activityUpdateInput>

export const activityDeleteInput = z.object({ id: z.uuid() })
export type ActivityDeleteInput = z.infer<typeof activityDeleteInput>

export const matchCreateInput = z.object({
  opponent: z.discriminatedUnion('kind', [existingOpponent, newOpponent]),
  played_on: isoDate,
  start_time: timeOfDay.nullable(),
  location: optionalText(120),
  competition: z.enum(MATCH_COMPETITIONS),
  phase: optionalText(60),
  set_scores: z
    .array(setScoreSchema.refine((set) => set.us !== set.them, 'Un set no puede terminar empatado'))
    .min(1, 'Carga al menos un set')
    .max(MAX_SETS),
})
export type MatchCreateInput = z.infer<typeof matchCreateInput>

export type MatchCreated = { id: string; slug: string; opponent: TeamSummary }

/** Edición de un partido: los mismos campos que el alta. El slug (y la carpeta del bucket) no cambian. */
export const matchUpdateInput = matchCreateInput.extend({ id: z.uuid() })
export type MatchUpdateInput = z.infer<typeof matchUpdateInput>

export const matchDeleteInput = z.object({ id: z.uuid() })
export type MatchDeleteInput = z.infer<typeof matchDeleteInput>

export const videoUpdateInput = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, 'Ponle un título al video').max(120),
  set_number: z.number().int().min(1).max(MAX_SETS).nullable(),
})
export type VideoUpdateInput = z.infer<typeof videoUpdateInput>

export const videoDeleteInput = z.object({ id: z.uuid() })
export type VideoDeleteInput = z.infer<typeof videoDeleteInput>

const videoFileName = z.string().trim().min(1).max(200)

export const uploadStartInput = z.object({
  match_id: z.uuid(),
  file_name: videoFileName,
  content_type: z.string().max(100).nullable(),
  size_bytes: z.number().int().positive().max(MAX_VIDEO_BYTES),
})
export type UploadStartInput = z.infer<typeof uploadStartInput>

/** Subida multiparte: el navegador envía cada trozo directo al bucket con su URL firmada. */
export type UploadStart = {
  key: string
  upload_id: string
  part_size: number
  parts: { part_number: number; url: string }[]
  expires_at: string
}

const uploadRef = {
  match_id: z.uuid(),
  key: z.string().min(1).max(1024),
  upload_id: z.string().min(1).max(1024),
}

export const uploadCompleteInput = z.object({
  ...uploadRef,
  parts: z
    .array(z.object({ part_number: z.number().int().min(1).max(10_000), etag: z.string().min(1).max(200) }))
    .min(1)
    .max(10_000),
  title: z.string().trim().min(1).max(120),
  set_number: z.number().int().min(1).max(MAX_SETS).nullable(),
  sort_order: z.number().int().min(0).max(1000),
})
export type UploadCompleteInput = z.infer<typeof uploadCompleteInput>

export const uploadAbortInput = z.object(uploadRef)
export type UploadAbortInput = z.infer<typeof uploadAbortInput>

// ─── Errores ─────────────────────────────────────────────────────────────────
export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown }
}

// ─── Rutas ───────────────────────────────────────────────────────────────────
/** Mismo formato que el CHECK `matches_slug_format` de la migración. */
export const matchSlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
