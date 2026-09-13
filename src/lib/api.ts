// Cliente HTTP del frontend. Todo acceso a datos pasa por /api (nunca directo a Supabase/S3).
import type { ApiErrorBody } from '@shared/schemas'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`/api${path}`, { signal, credentials: 'same-origin', headers: { Accept: 'application/json' } })
  const isJson = res.headers.get('content-type')?.includes('application/json') ?? false
  const body: unknown = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error
    throw new ApiError(res.status, err?.code ?? 'unknown', err?.message ?? res.statusText, err?.details)
  }
  // Un 200 sin JSON (p.ej. `npm run dev` sin servidor de API) no puede tratarse como datos válidos.
  if (body === null || body === undefined) {
    throw new ApiError(res.status, 'invalid_response', 'El servidor no devolvió datos válidos. ¿Está en marcha la API?')
  }
  return body as T
}
