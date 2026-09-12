// Sesión del staff: código de acceso compartido → cookie httpOnly con JWT firmado.
import { createHash, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { env } from './env.js'
import { unauthorized } from './http.js'

const COOKIE_NAME = 'coyotes_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 días

export type Session = { role: 'staff'; expiresAt: string }

const secretKey = () => new TextEncoder().encode(env.sessionSecret)

export function isValidAccessCode(code: string): boolean {
  // Comparar hashes de igual longitud evita filtrar información por tiempo.
  const a = createHash('sha256').update(code).digest()
  const b = createHash('sha256').update(env.internalAccessCode).digest()
  return timingSafeEqual(a, b)
}

export async function createSessionCookie(): Promise<string> {
  const token = await new SignJWT({ role: 'staff' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
  return serializeCookie(token, SESSION_TTL_SECONDS)
}

export function clearSessionCookie(): string {
  return serializeCookie('', 0)
}

export async function getSession(request: Request): Promise<Session | null> {
  const token = readCookie(request, COOKIE_NAME)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    if (payload.role !== 'staff' || !payload.exp) return null
    return { role: 'staff', expiresAt: new Date(payload.exp * 1000).toISOString() }
  } catch {
    return null
  }
}

/** Lanza 401 si no hay sesión válida. Usar al inicio de todo endpoint interno. */
export async function requireSession(request: Request): Promise<Session> {
  const session = await getSession(request)
  if (!session) throw unauthorized()
  return session
}

function serializeCookie(value: string, maxAge: number): string {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (!env.isLocal) parts.push('Secure')
  return parts.join('; ')
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie')
  if (!header) return undefined
  for (const pair of header.split(';')) {
    const [key, ...rest] = pair.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return undefined
}
