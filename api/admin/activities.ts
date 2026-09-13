// POST /api/admin/activities → 201 Activity. Crea la actividad y, si se pide, el rival.
import { activityCreateInput } from '../../shared/schemas.js'
import { createActivity } from '../_lib/activities.js'
import { requireAdmin } from '../_lib/admin.js'
import { handle, noStore, parseBody } from '../_lib/http.js'

export const POST = handle(async (request) => {
  await requireAdmin(request)
  return noStore(await createActivity(await parseBody(request, activityCreateInput)), 201)
})
