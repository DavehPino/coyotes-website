// POST /api/admin/:action: escrituras del dashboard en una sola función (Hobby admite 12 por deploy).
// Todas exigen la cabecera x-admin-safeword.
import { activityCreateInput, matchCreateInput } from '../../shared/schemas.js'
import { createActivity } from '../_lib/activities.js'
import { requireAdmin } from '../_lib/admin.js'
import { handle, noStore, parseBody, pathParam, routeFor, type Handler } from '../_lib/http.js'
import { createMatch } from '../_lib/matches.js'

const actions: Record<string, Handler> = {
  // POST /api/admin/verify → { ok: true } si la palabra clave es correcta; 401 si no.
  verify: async () => noStore({ ok: true }),

  // POST /api/admin/activities → 201 Activity. Crea la actividad y, si se pide, el rival.
  activities: async (request) =>
    noStore(await createActivity(await parseBody(request, activityCreateInput)), 201),

  // POST /api/admin/matches → 201 MatchCreated. Crea el partido y, si se pide, el rival.
  matches: async (request) => noStore(await createMatch(await parseBody(request, matchCreateInput)), 201),
}

export const POST = handle(async (request) => {
  const action = routeFor(actions, pathParam(request))
  await requireAdmin(request)
  return action(request)
})
