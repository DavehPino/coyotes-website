// POST /api/admin/uploads/start → UploadStart: crea la subida multiparte y firma una URL por trozo.
import { uploadStartInput } from '../../../shared/schemas.js'
import { requireAdmin } from '../../_lib/admin.js'
import { handle, noStore, parseBody } from '../../_lib/http.js'
import { startVideoUpload } from '../../_lib/uploads.js'

export const POST = handle(async (request) => {
  await requireAdmin(request)
  return noStore(await startVideoUpload(await parseBody(request, uploadStartInput)))
})
