// POST /api/admin/uploads/complete → 201 Video: cierra la subida y registra el video en el partido.
import { uploadCompleteInput } from '../../../shared/schemas.js'
import { requireAdmin } from '../../_lib/admin.js'
import { handle, noStore, parseBody } from '../../_lib/http.js'
import { completeVideoUpload } from '../../_lib/uploads.js'

export const POST = handle(async (request) => {
  await requireAdmin(request)
  return noStore(await completeVideoUpload(await parseBody(request, uploadCompleteInput)), 201)
})
