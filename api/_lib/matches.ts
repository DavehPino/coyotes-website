// Acceso a datos de partidos. Solo lectura por ahora.
import type { MatchDetail, MatchSummary, TeamSummary, Video } from '../../shared/schemas.js'
import { compareVideos, outcomeOf, TEAM_SUMMARY_SELECT, toSetScores, toVideo } from './mappers.js'
import { db, type Tables } from './supabase.js'

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
