// Acceso a datos de actividades. Único punto de entrada: cuando llegue la autenticación,
// las reglas de acceso se aplican aquí sin tocar las rutas.
import { addDays, todayIsoDate } from '../../shared/dates.js'
import type { Activity, ActivityCreateInput } from '../../shared/schemas.js'
import { badRequest } from './http.js'
import { TEAM_SUMMARY_SELECT, toActivity } from './mappers.js'
import { db } from './supabase.js'
import { discardCreatedTeam, resolveOpponent } from './teams.js'

/** Actividades no canceladas desde `from` (incluido), de la más próxima a la más lejana. */
export async function listUpcomingActivities(from: string, limit: number): Promise<Activity[]> {
  const { data, error } = await db()
    .from('weekly_activities')
    .select(`*, opponent:teams!weekly_activities_opponent_team_id_fkey(${TEAM_SUMMARY_SELECT})`)
    .gte('activity_date', from)
    .eq('is_cancelled', false)
    .order('activity_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true })
    .limit(limit)
  if (error) throw error

  return data.map(({ opponent, ...row }) => toActivity(row, opponent))
}

/**
 * Crea una actividad futura y, si se pide, su rival. El formulario no tiene tipo ni hora de fin:
 * se guardan como 'otro' y null. Si la actividad no se guarda, el rival recién creado se borra.
 */
export async function createActivity(input: ActivityCreateInput): Promise<Activity> {
  // Tolerancia de un día: el reloj del servidor puede ir por delante de la hora local del equipo.
  if (input.activity_date < addDays(todayIsoDate(), -1)) {
    throw badRequest('La fecha de la actividad ya pasó')
  }

  const resolved = await resolveOpponent(input.opponent)
  const { data, error } = await db()
    .from('weekly_activities')
    .insert({
      title: input.title,
      description: input.description,
      activity_date: input.activity_date,
      start_time: input.start_time,
      end_time: null,
      location: input.location,
      category: input.category,
      opponent_team_id: resolved.team?.id ?? null,
      activity_type: 'otro',
      is_cancelled: false,
    })
    .select('*')
    .single()
  if (error) {
    await discardCreatedTeam(resolved)
    throw error
  }
  return toActivity(data, resolved.team)
}
