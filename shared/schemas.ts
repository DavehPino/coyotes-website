// Contratos de entrada/salida de la API (validados en backend, reutilizables en formularios).
import { z } from 'zod'
import {
  ACTIVITY_TYPES,
  VIDEO_CATEGORIES,
  VIDEO_SOURCES,
  VIDEO_STATUSES,
  VIDEO_TEAM_ROLES,
} from './domain.js'

const isoDate = z.iso.date()
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Hora inválida (HH:MM)')
const optionalText = z.string().trim().max(2000).nullish()

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginInput = z.object({
  code: z.string().min(1, 'Introduce el código').max(200),
})
export type LoginInput = z.infer<typeof loginInput>

// ─── Teams ───────────────────────────────────────────────────────────────────
export const teamInput = z.object({
  name: z.string().trim().min(1).max(120),
  short_name: z.string().trim().max(10).nullish(),
  is_own_team: z.boolean().default(false),
  category: z.string().trim().max(80).nullish(),
  city: z.string().trim().max(80).nullish(),
  logo_url: z.url().nullish(),
})
export type TeamInput = z.infer<typeof teamInput>

export type Team = TeamInput & {
  id: string
  created_at: string
  updated_at: string
}

// ─── Weekly activities ───────────────────────────────────────────────────────
export const activityInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    activity_type: z.enum(ACTIVITY_TYPES),
    activity_date: isoDate,
    start_time: time.nullish(),
    end_time: time.nullish(),
    location: z.string().trim().max(160).nullish(),
    description: optionalText,
    opponent_team_id: z.uuid().nullish(),
    is_cancelled: z.boolean().default(false),
  })
  .refine((a) => !a.start_time || !a.end_time || a.end_time > a.start_time, {
    message: 'La hora de fin debe ser posterior a la de inicio',
    path: ['end_time'],
  })
export type ActivityInput = z.infer<typeof activityInput>

export type Activity = ActivityInput & {
  id: string
  week_start: string
  created_at: string
  updated_at: string
}

export const activityListQuery = z.object({
  // Lunes de la semana a consultar (YYYY-MM-DD). Por defecto, la semana actual.
  week: isoDate.optional(),
})

// ─── Videos ──────────────────────────────────────────────────────────────────
export const videoTeamInput = z.object({
  team_id: z.uuid(),
  role: z.enum(VIDEO_TEAM_ROLES).default('involved'),
})

export const videoInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: optionalText,
    source: z.enum(VIDEO_SOURCES).default('bucket'),
    storage_key: z.string().trim().min(1).max(1024).nullish(),
    url: z.url().nullish(),
    thumbnail_url: z.url().nullish(),
    category: z.enum(VIDEO_CATEGORIES).default('sin_clasificar'),
    recorded_on: isoDate.nullish(),
    competition: z.string().trim().max(120).nullish(),
    result: z.string().trim().max(120).nullish(),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    status: z.enum(VIDEO_STATUSES).default('ready'),
    activity_id: z.uuid().nullish(),
    teams: z.array(videoTeamInput).max(10).default([]),
  })
  .refine((v) => (v.source === 'bucket' ? !!v.storage_key : !!v.url), {
    message: 'Un video del bucket necesita storage_key; uno externo necesita url',
    path: ['source'],
  })
export type VideoInput = z.infer<typeof videoInput>

export type Video = Omit<VideoInput, 'teams'> & {
  id: string
  content_type: string | null
  size_bytes: number | null
  duration_seconds: number | null
  last_synced_at: string | null
  created_at: string
  updated_at: string
  teams: Array<{ role: (typeof VIDEO_TEAM_ROLES)[number]; team: Pick<Team, 'id' | 'name' | 'short_name' | 'is_own_team'> }>
}

export const videoListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(VIDEO_CATEGORIES).optional(),
  status: z.enum(VIDEO_STATUSES).optional(),
  team_id: z.uuid().optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(24),
})

export type SyncResult = {
  scanned: number
  created: number
  updated: number
  missing_in_bucket: number
}

// ─── Errores ─────────────────────────────────────────────────────────────────
export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown }
}
