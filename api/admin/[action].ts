// POST /api/admin/:action: escrituras del dashboard en una sola función (Hobby admite 12 por deploy).
// Todas exigen la cabecera x-admin-safeword.
import {
  activityCreateInput,
  activityDeleteInput,
  activityUpdateInput,
  courtrackCatalogInput,
  courtrackSyncInput,
  leagueCreateInput,
  leagueDeleteInput,
  leagueSnapshotInput,
  leagueUpdateInput,
  matchCreateInput,
  matchDeleteInput,
  matchUpdateInput,
  teamLinkCreateInput,
  videoDeleteInput,
  videoUpdateInput,
} from '../../shared/schemas.js'
import { createActivity, deleteActivity, updateActivity } from '../_lib/activities.js'
import { requireAdmin } from '../_lib/admin.js'
import { getCourtrackCatalog, getCourtrackSyncStatus, runCourtrackSync } from '../_lib/courtrackSync.js'
import { handle, noStore, parseBody, pathParam, routeFor, type Handler } from '../_lib/http.js'
import { createLeague, deleteLeague, getLeagueSnapshot, listLeagues, updateLeague } from '../_lib/leagues.js'
import { createMatch, deleteMatch, updateMatch } from '../_lib/matches.js'
import { createTeamLink } from '../_lib/teamLinks.js'
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

  // POST /api/admin/courtrack-status → CourtrackSyncStatus. Cupo, ligas configuradas y últimas sincronizaciones (vía courtrack-service).
  'courtrack-status': async () => noStore(await getCourtrackSyncStatus()),

  // POST /api/admin/courtrack-sync { league_id?, dry_run? } → con league_id, CourtrackSyncResult de esa temporada; sin él,
  // CourtrackSyncAllResult de todas las ligas activas (un solo cupo). 429 `quota_exceeded` si se agotó el cupo diario.
  'courtrack-sync': async (request) => {
    const input = await parseBody(request, courtrackSyncInput)
    return noStore(await runCourtrackSync(input.league_id ?? null, input.dry_run))
  },

  // POST /api/admin/league-snapshot { id } → CourtrackLeagueSnapshot. Clasificación y fixture guardados en el último sync.
  'league-snapshot': async (request) =>
    noStore(await getLeagueSnapshot((await parseBody(request, leagueSnapshotInput)).id)),

  // POST /api/admin/courtrack-catalog { resource, id_cliente?, liga_id? } → asociaciones, ligas o equipos de CourtTrack.
  'courtrack-catalog': async (request) =>
    noStore(await getCourtrackCatalog(await parseBody(request, courtrackCatalogInput))),

  // POST /api/admin/leagues → CourtrackLeague[]. Ligas de CourtTrack configuradas (sin pasar por el servicio).
  leagues: async () => noStore(await listLeagues()),

  // POST /api/admin/league-create → 201 CourtrackLeague. Da de alta una liga (409 si ya estaba).
  'league-create': async (request) => noStore(await createLeague(await parseBody(request, leagueCreateInput)), 201),

  // POST /api/admin/league-update → CourtrackLeague. Pausa/activa la liga, cambia el equipo propio o archiva la temporada.
  'league-update': async (request) => noStore(await updateLeague(await parseBody(request, leagueUpdateInput))),

  // POST /api/admin/league-delete → { ok: true }. Quita la liga; los partidos y la competición se conservan.
  'league-delete': async (request) => {
    await deleteLeague((await parseBody(request, leagueDeleteInput)).id)
    return noStore({ ok: true })
  },

  // POST /api/admin/team-link-create → { ok: true }. Vincula un nombre de CourtTrack a un rival existente.
  'team-link-create': async (request) => noStore(await createTeamLink(await parseBody(request, teamLinkCreateInput))),
}

export const POST = handle(async (request) => {
  const action = routeFor(actions, pathParam(request))
  await requireAdmin(request)
  return action(request)
})
