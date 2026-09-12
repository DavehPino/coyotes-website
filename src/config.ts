/**
 * Ruta interna "oculta": no hay enlaces a ella desde la web pública.
 * Si la cambias, actualiza también el header `X-Robots-Tag` en vercel.json.
 * Ocultar la ruta NO es seguridad: la protección real es el código de acceso
 * validado en /api/auth/login y la cookie de sesión que exige cada endpoint interno.
 */
export const INTERNAL_ROUTE = '/vestuario'

export const LOGO_SRC = '/brand/logo-coyotes.jpeg'
export const TEAM_NAME = 'Coyotes'
