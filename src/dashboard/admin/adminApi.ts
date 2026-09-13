// Llamadas de escritura del dashboard (partidos y actividades). Todas llevan la palabra clave en una cabecera.
import { ApiError, apiRequest } from '@/lib/api'
import { ADMIN_SAFEWORD_HEADER } from '@shared/domain'

const STORAGE_KEY = 'coyotes:admin-safeword'

/**
 * La palabra clave se recuerda en este navegador (localStorage), la misma para todas las vistas.
 * Si el servidor la rechaza se borra y se vuelve a pedir.
 */
export const safewordStore = {
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  },
  set(value: string) {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // Navegación privada o almacenamiento bloqueado: se pedirá de nuevo al reabrir.
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ídem.
    }
  },
}

export function adminPost<T>(path: string, body: unknown, safeword: string, signal?: AbortSignal): Promise<T> {
  return apiRequest<T>(`/admin${path}`, {
    method: 'POST',
    body,
    signal,
    headers: { [ADMIN_SAFEWORD_HEADER]: encodeURIComponent(safeword) },
  })
}

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

export const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Algo salió mal. Inténtalo de nuevo.'
}
