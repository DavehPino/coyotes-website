// Protección de las escrituras del dashboard con una palabra clave compartida (ADMIN_SAFEWORD).
// No es un sistema de usuarios: evita que cualquiera con la URL del dashboard cree datos.
import { createHash, timingSafeEqual } from 'node:crypto'
import { ADMIN_SAFEWORD_HEADER } from '../../shared/domain.js'
import { env } from './env.js'
import { HttpError, unauthorized } from './http.js'

/** Pausa ante un intento fallido: encarece probar palabras a ciegas. */
const FAILURE_DELAY_MS = 700

const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest()

function safewordFrom(request: Request): string {
  const raw = request.headers.get(ADMIN_SAFEWORD_HEADER) ?? ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return ''
  }
}

/** Lanza 401 si la cabecera no trae la palabra clave correcta (comparación en tiempo constante). */
export async function requireAdmin(request: Request): Promise<void> {
  const expected = env.adminSafeword
  if (!expected) {
    throw new HttpError(
      503,
      'admin_disabled',
      'La carga de datos no está configurada en el servidor (falta ADMIN_SAFEWORD).',
    )
  }
  const given = safewordFrom(request)
  if (given && timingSafeEqual(digest(given), digest(expected))) return

  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS))
  throw unauthorized('Palabra clave incorrecta')
}
