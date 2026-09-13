// GET /api/matches?until=YYYY-MM-DD&limit=50 → MatchSummary[] (partidos jugados, del más reciente al más antiguo)
import { todayIsoDate } from '../../shared/dates.js'
import { matchListQuery } from '../../shared/schemas.js'
import { cached, handle, parseQuery } from '../_lib/http.js'
import { listMatchesUntil } from '../_lib/matches.js'

export const GET = handle(async (request) => {
  const { until, limit } = parseQuery(request, matchListQuery)
  return cached(await listMatchesUntil(until ?? todayIsoDate(), limit))
})
