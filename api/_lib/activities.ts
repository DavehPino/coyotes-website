// Acceso a datos de actividades. Único punto de entrada: cuando llegue la autenticación,
// las reglas de acceso se aplican aquí sin tocar las rutas.
import { addDays, mondayOf } from '../../shared/dates.js'
import type { Activity, WeekActivities } from '../../shared/schemas.js'
import { TEAM_SUMMARY_SELECT, toActivity } from './mappers.js'
import { db } from './supabase.js'

/** Actividades de la semana (lunes a domingo) que contiene `date`. */
export async function getWeekActivities(date: string): Promise<WeekActivities> {
  const weekStart = mondayOf(date)
  const weekEnd = addDays(weekStart, 6)

  const { data, error } = await db()
    .from('weekly_activities')
    .select(`*, opponent:teams!weekly_activities_opponent_team_id_fkey(${TEAM_SUMMARY_SELECT})`)
    .eq('week_start', weekStart)
    .order('activity_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: true })
    .order('title', { ascending: true })
  if (error) throw error

  const items: Activity[] = data.map(({ opponent, ...row }) => toActivity(row, opponent))
  return { week_start: weekStart, week_end: weekEnd, items }
}
