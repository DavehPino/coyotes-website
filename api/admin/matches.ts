// POST /api/admin/matches → 201 MatchCreated. Crea el partido y, si se pide, el rival.
import { matchCreateInput } from '../../shared/schemas.js'
import { requireAdmin } from '../_lib/admin.js'
import { handle, noStore, parseBody } from '../_lib/http.js'
import { createMatch } from '../_lib/matches.js'

export const POST = handle(async (request) => {
  await requireAdmin(request)
  const input = await parseBody(request, matchCreateInput)
  return noStore(await createMatch(input), 201)
})
