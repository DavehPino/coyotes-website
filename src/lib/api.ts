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

export type ApiRequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** `reload` salta la caché HTTP del navegador (p.ej. justo después de guardar datos). */
  cache?: RequestCache
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, signal, cache } = options
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      signal,
      cache,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, 'network_error', 'No hay conexión con el servidor. Comprueba la red e inténtalo de nuevo.')
  }

  const isJson = res.headers.get('content-type')?.includes('application/json') ?? false
  const data: unknown = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error
    throw new ApiError(res.status, err?.code ?? 'unknown', err?.message ?? res.statusText, err?.details)
  }
  // Un 200 sin JSON (p.ej. `npm run dev` sin servidor de API) no puede tratarse como datos válidos.
  if (data === null || data === undefined) {
    throw new ApiError(res.status, 'invalid_response', 'El servidor no devolvió datos válidos. ¿Está en marcha la API?')
  }
  return data as T
}

export function apiGet<T>(path: string, signal?: AbortSignal, cache?: RequestCache): Promise<T> {
  return apiRequest<T>(path, { signal, cache })
}
