// Proxy al microservicio courtrack-service (repo aparte, mismo Supabase): el navegador solo habla con /api y el
// token del servicio nunca sale del servidor. Los errores del servicio se reenvían con su mismo código y mensaje.
import type { ApiErrorBody, CourtrackSyncResult, CourtrackSyncStatus } from '../../shared/schemas.js'
import { env } from './env.js'
import { HttpError } from './http.js'

/** Margen por debajo del maxDuration de api/admin/[action].ts (60 s). */
const TIMEOUT_MS = 55_000

async function callSyncService<T>(method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const { url, secret } = env.courtrackSync
  if (!url || !secret) {
    throw new HttpError(
      503,
      'sync_disabled',
      'La sincronización con CourtTrack no está configurada en el servidor (faltan COURTRACK_SYNC_URL y COURTRACK_SYNC_SECRET).',
    )
  }

  let res: Response
  try {
    res = await fetch(`${url}/api/sync`, {
      method,
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.error(err)
    throw new HttpError(502, 'sync_unavailable', 'No se pudo contactar con el servicio de sincronización.')
  }

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const error = (data as ApiErrorBody | null)?.error
    throw new HttpError(
      res.status,
      error?.code ?? 'sync_error',
      error?.message ?? `El servicio de sincronización respondió ${res.status}`,
      error?.details,
    )
  }
  if (data === null) throw new HttpError(502, 'sync_error', 'El servicio de sincronización no devolvió datos válidos.')
  return data as T
}

/** Cupo restante y últimas sincronizaciones. */
export const getCourtrackSyncStatus = () => callSyncService<CourtrackSyncStatus>('GET')

/** Ejecuta la sincronización (o la simula con `dry_run`). */
export const runCourtrackSync = (dryRun: boolean) => callSyncService<CourtrackSyncResult>('POST', { dry_run: dryRun })
