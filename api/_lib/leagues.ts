// Ligas de CourtTrack que sigue la organización (tabla courtrack_leagues). El microservicio solo las lee.
import type { CourtrackLeague, LeagueCreateInput, LeagueUpdateInput } from '../../shared/schemas.js'
import { ensureCompetition, requireCompetition } from './competitions.js'
import { getCourtrackEquipos, getCourtrackLigas } from './courtrackSync.js'
import { env } from './env.js'
import { badRequest, conflict, notFound } from './http.js'
import { toCompetition } from './mappers.js'
import { db } from './supabase.js'

const UNIQUE_VIOLATION = '23505'

// Un único literal: el cliente de Supabase infiere el tipo del select solo desde literales.
const LEAGUE_SELECT =
  'id,id_cliente,cliente_name,liga_id,liga_name,team_name,team_logo_url,is_active,last_synced_at,competition:competitions!courtrack_leagues_competition_id_fkey(id,name,kind)'

type LeagueRow = {
  id: string
  id_cliente: number
  cliente_name: string | null
  liga_id: number
  liga_name: string
  team_name: string
  team_logo_url: string | null
  is_active: boolean
  last_synced_at: string | null
  competition: { id: string; name: string; kind: string } | null
}

function toLeague(row: LeagueRow): CourtrackLeague {
  if (!row.competition) throw new Error(`La liga ${row.id} no tiene competición`)
  const { competition, ...rest } = row
  return { ...rest, competition: toCompetition(competition) }
}

export async function listLeagues(): Promise<CourtrackLeague[]> {
  const { data, error } = await db()
    .from('courtrack_leagues')
    .select(LEAGUE_SELECT)
    .eq('org_id', env.orgId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toLeague)
}

async function getLeagueRow(id: string): Promise<LeagueRow> {
  const { data, error } = await db()
    .from('courtrack_leagues')
    .select(LEAGUE_SELECT)
    .eq('id', id)
    .eq('org_id', env.orgId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw notFound('La liga no existe')
  return data
}

/**
 * Da de alta una liga: comprueba en CourtTrack (vía el microservicio) que la liga y el equipo existen, copia sus
 * nombres y logo, y la cuelga de una competición existente o nueva.
 */
export async function createLeague(input: LeagueCreateInput): Promise<CourtrackLeague> {
  const ligas = await getCourtrackLigas(input.id_cliente)
  const liga = ligas.find((item) => item.id === input.liga_id)
  if (!liga) throw badRequest('Esa liga no existe en CourtTrack para la asociación elegida')

  const equipos = await getCourtrackEquipos(input.id_cliente, input.liga_id)
  const team = equipos.find((item) => item.name === input.team_name)
  if (!team) throw badRequest('Ese equipo no juega en la liga elegida')

  const competition =
    input.competition.kind === 'existing'
      ? await requireCompetition(input.competition.id)
      : await ensureCompetition(input.competition.name, input.competition.competition_kind)

  const { data, error } = await db()
    .from('courtrack_leagues')
    .insert({
      org_id: env.orgId,
      competition_id: competition.id,
      id_cliente: input.id_cliente,
      cliente_name: input.cliente_name,
      liga_id: liga.id,
      liga_name: liga.nombre,
      team_name: team.name,
      team_logo_url: team.logo,
    })
    .select(LEAGUE_SELECT)
    .single()
  if (error?.code === UNIQUE_VIOLATION) throw conflict('Esa liga ya está configurada')
  if (error) throw error
  return toLeague(data)
}

export async function updateLeague(input: LeagueUpdateInput): Promise<CourtrackLeague> {
  const current = await getLeagueRow(input.id)
  const changes: { is_active?: boolean; team_name?: string } = {}
  if (input.is_active !== undefined) changes.is_active = input.is_active
  if (input.team_name !== undefined && input.team_name !== current.team_name) {
    const equipos = await getCourtrackEquipos(current.id_cliente, current.liga_id)
    if (!equipos.some((item) => item.name === input.team_name)) throw badRequest('Ese equipo no juega en la liga')
    changes.team_name = input.team_name
  }
  if (Object.keys(changes).length === 0) return toLeague(current)

  const { data, error } = await db()
    .from('courtrack_leagues')
    .update(changes)
    .eq('id', input.id)
    .eq('org_id', env.orgId)
    .select(LEAGUE_SELECT)
    .single()
  if (error) throw error
  return toLeague(data)
}

/**
 * Quita la liga. Los partidos importados se conservan (con su courtrack_id, así que volver a añadir la liga los
 * vuelve a reconocer); solo pierden el vínculo con la liga (on delete set null). La competición se conserva.
 */
export async function deleteLeague(id: string): Promise<void> {
  await getLeagueRow(id)
  const { error } = await db().from('courtrack_leagues').delete().eq('id', id).eq('org_id', env.orgId)
  if (error) throw error
}
