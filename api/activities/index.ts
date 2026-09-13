// GET /api/activities?week=YYYY-MM-DD → WeekActivities (semana del lunes indicado; por defecto la actual)
import { todayIsoDate } from '../../shared/dates.js'
import { activityListQuery } from '../../shared/schemas.js'
import { getWeekActivities } from '../_lib/activities.js'
import { cached, handle, parseQuery } from '../_lib/http.js'

export const GET = handle(async (request) => {
  const { week } = parseQuery(request, activityListQuery)
  return cached(await getWeekActivities(week ?? todayIsoDate()))
})
