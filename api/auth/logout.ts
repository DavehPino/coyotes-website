import { clearSessionCookie } from '../_lib/auth.js'
import { handle, json } from '../_lib/http.js'

export const POST = handle(async () =>
  json({ authenticated: false }, { headers: { 'Set-Cookie': clearSessionCookie() } }),
)
