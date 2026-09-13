// Acceso a datos de actividades. Único punto de entrada: cuando llegue la autenticación,
// las reglas de acceso se aplican aquí sin tocar las rutas.
import type { Activity } from '../../shared/schemas.js'
import { TEAM_SUMMARY_SELECT, toActivity } from './mappers.js'
import { db } from './supabase.js'

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
