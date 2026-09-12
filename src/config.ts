export const LOGO_SRC = '/brand/logo-coyotes.jpeg'
export const TEAM_NAME = 'Coyotes'

/** Subdominio del dashboard interno: dashboard.<dominio> (y dashboard.localhost en desarrollo). */
export const DASHBOARD_SUBDOMAIN = 'dashboard'

export type AppTarget = 'public' | 'dashboard'

/**
 * Un único deploy sirve las dos apps y elige cuál montar según el host.
 * `VITE_APP_TARGET` fuerza una de ellas, útil en las URLs de preview de Vercel,
 * que no tienen subdominio.
 */
export function resolveAppTarget(hostname = window.location.hostname): AppTarget {
  const forced = import.meta.env.VITE_APP_TARGET
  if (forced === 'public' || forced === 'dashboard') return forced
  return hostname.split('.')[0] === DASHBOARD_SUBDOMAIN ? 'dashboard' : 'public'
}
