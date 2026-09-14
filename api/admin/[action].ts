// POST /api/admin/:action: escrituras del dashboard en una sola función (Hobby admite 12 por deploy).
// Todas exigen la cabecera x-admin-safeword.
import {
  activityCreateInput,
  activityDeleteInput,
  activityUpdateInput,
  matchCreateInput,
  matchDeleteInput,
  matchUpdateInput,
  videoDeleteInput,
  videoUpdateInput,
} from '../../shared/schemas.js'
import { flyerSuggestInput } from '../../shared/flyers.js'
import { createActivity, deleteActivity, updateActivity } from '../_lib/activities.js'
import { requireAdmin } from '../_lib/admin.js'
import { suggestFlyer } from '../_lib/flyers.js'
import { handle, noStore, parseBody, pathParam, routeFor, type Handler } from '../_lib/http.js'
import { createMatch, deleteMatch, updateMatch } from '../_lib/matches.js'
import { deleteVideo, updateVideo } from '../_lib/videos.js'

const actions: Record<string, Handler> = {
  // POST /api/admin/verify → { ok: true } si la palabra clave es correcta; 401 si no.
  verify: async () => noStore({ ok: true }),

  // POST /api/admin/activities → 201 Activity. Crea la actividad y, si se pide, el rival.
  activities: async (request) =>
    noStore(await createActivity(await parseBody(request, activityCreateInput)), 201),

  // POST /api/admin/activity-update → Activity. Edita la actividad y, si se pide, crea el rival.
  'activity-update': async (request) =>
    noStore(await updateActivity(await parseBody(request, activityUpdateInput))),

  // POST /api/admin/activity-delete → { ok: true }. Borra la actividad.
  'activity-delete': async (request) => {
    await deleteActivity(await parseBody(request, activityDeleteInput))
    return noStore({ ok: true })
  },

  // POST /api/admin/matches → 201 MatchCreated. Crea el partido y, si se pide, el rival.
  matches: async (request) => noStore(await createMatch(await parseBody(request, matchCreateInput)), 201),

  // POST /api/admin/match-update → MatchCreated. Edita el partido (el slug no cambia) y, si se pide, crea el rival.
  'match-update': async (request) => noStore(await updateMatch(await parseBody(request, matchUpdateInput))),

  // POST /api/admin/match-delete → { ok: true }. Borra el partido, sus videos y sus archivos del bucket.
  'match-delete': async (request) => {
    await deleteMatch(await parseBody(request, matchDeleteInput))
    return noStore({ ok: true })
  },

  // POST /api/admin/video-update → Video. Cambia el título y el set de un video.
  'video-update': async (request) => noStore(await updateVideo(await parseBody(request, videoUpdateInput))),

  // POST /api/admin/video-delete → { ok: true }. Borra el archivo del bucket y la fila del video.
  'video-delete': async (request) => {
    await deleteVideo(await parseBody(request, videoDeleteInput))
    return noStore({ ok: true })
  },

  // POST /api/admin/flyer-suggest → FlyerSuggestion. El asistente de IA reescribe el flyer según el pedido.
  'flyer-suggest': async (request) => noStore(await suggestFlyer(await parseBody(request, flyerSuggestInput))),
}

export const POST = handle(async (request) => {
  const action = routeFor(actions, pathParam(request))
  await requireAdmin(request)
  return action(request)
})
