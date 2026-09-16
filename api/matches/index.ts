// GET /api/matches?until=YYYY-MM-DD&limit=50&competition_id= → MatchSummary[] (partidos jugados, del más reciente al más antiguo)
import { todayIsoDate } from '../../shared/dates.js'
import { matchListQuery } from '../../shared/schemas.js'
import { cached, handle, parseQuery } from '../_lib/http.js'
import { listMatchesUntil } from '../_lib/matches.js'

export const GET = handle(async (request) => {
  const { until, limit, competition_id } = parseQuery(request, matchListQuery)
  return cached(await listMatchesUntil(until ?? todayIsoDate(), limit, competition_id))
})
