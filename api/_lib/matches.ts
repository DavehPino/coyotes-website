// Acceso a datos de partidos: lecturas del dashboard y alta desde /api/admin/matches.
import { addDays, todayIsoDate } from '../../shared/dates.js'
import { matchSlugBase, tallySets } from '../../shared/matches.js'
import type {
  MatchCreated,
  MatchCreateInput,
  MatchDetail,
  MatchSummary,
  TeamSummary,
  Video,
} from '../../shared/schemas.js'
import { badRequest } from './http.js'
import { compareVideos, outcomeOf, TEAM_SUMMARY_SELECT, toSetScores, toVideo } from './mappers.js'
import { db, type Tables } from './supabase.js'
import { discardCreatedTeam, resolveOpponent } from './teams.js'

type MatchRow = Tables['matches']['Row']

const MATCH_SUMMARY_SELECT = `*, opponent:teams!matches_opponent_team_id_fkey(${TEAM_SUMMARY_SELECT}), videos(count)`

type CountEmbed = { count: number }[]

function toMatchSummary(row: MatchRow, opponent: TeamSummary, videos: CountEmbed): MatchSummary {
  return {
    id: row.id,
    slug: row.slug,
    played_on: row.played_on,
    start_time: row.start_time,
    is_home: row.is_home,
    location: row.location,
    competition: row.competition,
    phase: row.phase,
    sets_won: row.sets_won,
    sets_lost: row.sets_lost,
    outcome: outcomeOf(row.sets_won, row.sets_lost),
    cover_image_url: row.cover_image_url,
    opponent,
    video_count: videos[0]?.count ?? 0,
  }
}

/** Partidos jugados hasta `until` (incluido), del más reciente al más antiguo. */
export async function listMatchesUntil(until: string, limit: number): Promise<MatchSummary[]> {
  const { data, error } = await db()
    .from('matches')
    .select(MATCH_SUMMARY_SELECT)
    .lte('played_on', until)
    .order('played_on', { ascending: false })
    .order('start_time', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw error

  return data.map(({ opponent, videos, ...row }) => toMatchSummary(row, opponent, videos))
}

/** Detalle de un partido con parciales y videos ordenados. Null si el slug no existe. */
export async function getMatchBySlug(slug: string): Promise<MatchDetail | null> {
  const { data, error } = await db().from('matches').select(MATCH_SUMMARY_SELECT).eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!data) return null

  const { opponent, videos: videoCount, ...row } = data
  const { data: videoRows, error: videosError } = await db()
    .from('videos')
    .select('*')
    .eq('match_id', row.id)
    .neq('status', 'archived')
  if (videosError) throw videosError

  const videos: Video[] = videoRows.map(toVideo).sort(compareVideos)
  return {
    ...toMatchSummary(row, opponent, videoCount),
    set_scores: toSetScores(row.set_scores),
    summary: row.summary,
    videos,
  }
}

export type MatchRef = Pick<MatchRow, 'id' | 'slug' | 'played_on'>

export async function getMatchRef(id: string): Promise<MatchRef | null> {
  const { data, error } = await db().from('matches').select('id,slug,played_on').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

const UNIQUE_VIOLATION = '23505'
const SLUG_ATTEMPTS = 3

/** Primer slug libre: base, base-2, base-3... */
async function freeSlug(base: string): Promise<string> {
  const { data, error } = await db().from('matches').select('slug').like('slug', `${base}%`)
  if (error) throw error
  const taken = new Set(data.map((row) => row.slug))
  let slug = base
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`
  return slug
}

/**
 * Crea el partido y, si hace falta, el rival. Siempre como visitante (is_home = false).
 * Si el partido no se puede guardar, el rival recién creado se borra para no dejar restos.
 */
export async function createMatch(input: MatchCreateInput): Promise<MatchCreated> {
  // Tolerancia de un día: el reloj del servidor puede ir por detrás de la hora local del equipo.
  if (input.played_on > addDays(todayIsoDate(), 1)) {
    throw badRequest('La fecha del partido no puede estar en el futuro')
  }

  const resolved = await resolveOpponent(input.opponent)
  const opponent = resolved.team as TeamSummary // los partidos siempre tienen rival

  const { won, lost } = tallySets(input.set_scores)
  const base = matchSlugBase(input.played_on, opponent.name)

  try {
    for (let attempt = 1; ; attempt += 1) {
      const slug = await freeSlug(base)
      const { data, error } = await db()
        .from('matches')
        .insert({
          slug,
          played_on: input.played_on,
          start_time: input.start_time,
          opponent_team_id: opponent.id,
          is_home: false,
          location: input.location,
          competition: input.competition,
          phase: input.phase,
          sets_won: won,
          sets_lost: lost,
          set_scores: input.set_scores,
        })
        .select('id,slug')
        .single()
      // Un alta simultánea se quedó con el mismo slug: se recalcula.
      if (error?.code === UNIQUE_VIOLATION && attempt < SLUG_ATTEMPTS) continue
      if (error) throw error
      return { id: data.id, slug: data.slug, opponent }
    }
  } catch (err) {
    await discardCreatedTeam(resolved)
    throw err
  }
}
