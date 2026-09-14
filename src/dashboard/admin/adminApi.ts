// Llamadas de escritura del dashboard (partidos y actividades). Todas llevan la palabra clave en una cabecera.
import { ApiError, apiRequest } from '@/lib/api'
import { ADMIN_SAFEWORD_HEADER } from '@shared/domain'

/**
 * Palabra clave recordada en este navegador (localStorage). Si el servidor la rechaza se borra y se vuelve a pedir.
 * Hay una por sección protegida: la de carga (actividades y partidos) y la de flyers.
 */
export function createSafewordStore(storageKey: string) {
  return {
    get(): string | null {
      try {
        return localStorage.getItem(storageKey)
      } catch {
        return null
      }
    },
    set(value: string) {
      try {
        localStorage.setItem(storageKey, value)
      } catch {
        // Navegación privada o almacenamiento bloqueado: se pedirá de nuevo al reabrir.
      }
    },
    clear() {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        // Ídem.
      }
    },
  }
}

export type SafewordStore = ReturnType<typeof createSafewordStore>

/** Palabra clave de carga (ADMIN_SAFEWORD), la misma para actividades y partidos. */
export const safewordStore = createSafewordStore('coyotes:admin-safeword')

/** POST con una palabra clave en su cabecera, codificada para admitir tildes y ñ. */
export function safewordPost<T>(
  path: string,
  body: unknown,
  header: string,
  safeword: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body, signal, headers: { [header]: encodeURIComponent(safeword) } })
}

export function adminPost<T>(path: string, body: unknown, safeword: string, signal?: AbortSignal): Promise<T> {
  return safewordPost<T>(`/admin${path}`, body, ADMIN_SAFEWORD_HEADER, safeword, signal)
}

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

export const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Algo salió mal. Inténtalo de nuevo.'
}
