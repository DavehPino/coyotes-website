// Datos de la sección Flyers: la biblioteca vive en el bucket (assets/). Leer es libre; escribir y usar la IA
// llevan la palabra clave de flyers (FLYERS_SAFEWORD), distinta de la de actividades y partidos.
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { FLYERS_SAFEWORD_HEADER } from '@shared/domain'
import type { FlyerLibrary, FlyerUploadUrl, FlyerUploadUrlInput } from '@shared/flyers'
import { createSafewordStore, safewordPost } from '../admin/adminApi'

export const flyersSafewordStore = createSafewordStore('coyotes:flyers-safeword')

export function flyersPost<T>(action: string, body: unknown, safeword: string, signal?: AbortSignal): Promise<T> {
  return safewordPost<T>(`/flyers/${action}`, body, FLYERS_SAFEWORD_HEADER, safeword, signal)
}

export const flyerLibraryKey = ['flyers', 'library'] as const

export function useFlyerLibrary() {
  return useQuery({
    queryKey: flyerLibraryKey,
    queryFn: ({ signal }) => apiGet<FlyerLibrary>('/flyers/library', signal),
    staleTime: 60_000,
  })
}

/** Sube el archivo directo al bucket con la URL firmada que da la API. Devuelve el id asignado. */
export async function uploadToBucket(
  input: FlyerUploadUrlInput,
  body: Blob,
  safeword: string,
  signal?: AbortSignal,
): Promise<string> {
  const target = await flyersPost<FlyerUploadUrl>('upload-url', input, safeword, signal)
  let res: Response
  try {
    res = await fetch(target.url, { method: 'PUT', body, headers: target.headers, signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    // Un fallo de red en el PUT al bucket casi siempre es CORS: el navegador no deja ver la respuesta.
    throw new Error('No se pudo subir al bucket. Revisa la conexión y que el CORS del bucket permita PUT desde este dominio.')
  }
  if (!res.ok) throw new Error(`El bucket rechazó la subida (${res.status}).`)
  return target.id
}
