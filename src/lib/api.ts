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
  const res = await fetch(`/api${path}`, { signal, credentials: 'same-origin' })
  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error
    throw new ApiError(res.status, err?.code ?? 'unknown', err?.message ?? res.statusText, err?.details)
  }
  return body as T
}
