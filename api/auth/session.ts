import { getSession } from '../_lib/auth.js'
import { handle, json } from '../_lib/http.js'

export const GET = handle(async (request) => {
  const session = await getSession(request)
  return json(session ? { authenticated: true, expiresAt: session.expiresAt } : { authenticated: false })
})
