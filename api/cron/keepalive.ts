// Vercel Cron diario: una consulta mínima evita que Supabase Free pause el
// proyecto tras 7 días sin actividad.
import { env } from '../_lib/env.js'
import { handle, json, unauthorized } from '../_lib/http.js'
import { db } from '../_lib/supabase.js'

export const GET = handle(async (request) => {
  const secret = env.cronSecret
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) throw unauthorized()

  const { count, error } = await db().from('teams').select('id', { count: 'exact', head: true })
  if (error) throw error

  return json({ ok: true, teams: count })
})
