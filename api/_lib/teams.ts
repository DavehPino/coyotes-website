// Acceso a datos de equipos rivales.
import type { NewTeamInput, TeamSummary } from '../../shared/schemas.js'
import { conflict } from './http.js'
import { toTeamSummary } from './mappers.js'
import { db } from './supabase.js'

const UNIQUE_VIOLATION = '23505'

/** Rivales (todos los equipos salvo el propio), por nombre. */
export async function listRivalTeams(): Promise<TeamSummary[]> {
  const { data, error } = await db()
    .from('teams')
    .select('id,name,short_name,logo_url')
    .eq('is_own_team', false)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

/** Rival por id. Null si no existe o si es el equipo propio. */
export async function getRivalTeam(id: string): Promise<TeamSummary | null> {
  const { data, error } = await db()
    .from('teams')
    .select('id,name,short_name,logo_url,is_own_team')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data && !data.is_own_team ? toTeamSummary(data) : null
}

/** Crea un rival: nunca es el equipo propio y no lleva categoría ni ciudad. */
export async function createRivalTeam(input: NewTeamInput): Promise<TeamSummary> {
  const { data, error } = await db()
    .from('teams')
    .insert({
      name: input.name,
      short_name: input.short_name,
      logo_url: input.logo_url,
      is_own_team: false,
      category: null,
      city: null,
    })
    .select('id,name,short_name,logo_url')
    .single()
  if (error?.code === UNIQUE_VIOLATION) {
    throw conflict(`Ya existe un equipo llamado "${input.name}". Elígelo en la lista de equipos existentes.`)
  }
  if (error) throw error
  return data
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await db().from('teams').delete().eq('id', id)
  if (error) throw error
}
