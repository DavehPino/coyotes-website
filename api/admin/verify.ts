// POST /api/admin/verify → { ok: true } si la cabecera x-admin-safeword es correcta; 401 si no.
import { requireAdmin } from '../_lib/admin.js'
import { handle, noStore } from '../_lib/http.js'

export const POST = handle(async (request) => {
  await requireAdmin(request)
  return noStore({ ok: true })
})
