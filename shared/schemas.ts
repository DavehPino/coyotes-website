// Contratos de la API (validados en backend, tipos compartidos con el frontend).
// Por ahora el dashboard es de solo lectura: los datos se cargan desde el Table Editor
// de Supabase. Los esquemas de escritura llegarán con usuarios y roles de administrador.
import { z } from 'zod'
import type {
  ActivityType,
  MatchOutcome,
  VideoCategory,
  VideoSource,
  VideoStatus,
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

// ─── Weekly activities ───────────────────────────────────────────────────────
export type Activity = {
  id: string
  title: string
  activity_type: ActivityType
  activity_date: string // YYYY-MM-DD
  week_start: string // lunes, YYYY-MM-DD
  start_time: string | null // HH:MM:SS
  end_time: string | null
  location: string | null
  description: string | null
  is_cancelled: boolean
  opponent: TeamSummary | null
}

export const activityListQuery = z.object({
  // Lunes de la semana a consultar (YYYY-MM-DD). Por defecto, la semana actual.
  week: isoDate.optional(),
})

export type WeekActivities = {
  week_start: string
  week_end: string
  items: Activity[]
}

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
  us: z.number().int().min(0),
  them: z.number().int().min(0),
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

// ─── Errores ─────────────────────────────────────────────────────────────────
export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown }
}
