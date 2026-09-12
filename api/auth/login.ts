import { loginInput } from '../../shared/schemas.js'
import { createSessionCookie, isValidAccessCode } from '../_lib/auth.js'
import { handle, json, parseBody, unauthorized } from '../_lib/http.js'

export const POST = handle(async (request) => {
  const { code } = await parseBody(request, loginInput)

  if (!isValidAccessCode(code)) {
    // Pequeño retardo para frenar intentos por fuerza bruta.
    await new Promise((resolve) => setTimeout(resolve, 800))
    throw unauthorized('Código incorrecto')
  }

  return json({ authenticated: true }, { headers: { 'Set-Cookie': await createSessionCookie() } })
})
