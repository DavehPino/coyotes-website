// POST /api/admin/uploads/abort → { ok: true }: descarta los trozos de una subida cancelada.
import { uploadAbortInput } from '../../../shared/schemas.js'
import { requireAdmin } from '../../_lib/admin.js'
import { handle, noStore, parseBody } from '../../_lib/http.js'
import { abortVideoUpload } from '../../_lib/uploads.js'

export const POST = handle(async (request) => {
  await requireAdmin(request)
  await abortVideoUpload(await parseBody(request, uploadAbortInput))
  return noStore({ ok: true })
})
