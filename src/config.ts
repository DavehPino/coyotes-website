import logoUrl from '@assets/coyotes-logo.png'

/** Escudo (assets/coyotes-logo.png). Vite lo sirve con hash; en index.html se referencia por ruta. */
export const LOGO_SRC = logoUrl
export const TEAM_NAME = 'Coyotes'

/**
 * Home de la web pública, fijada en build con VITE_HOME_VARIANT:
 * - "landing" (por defecto): solo escudo, nombre y eslogan.
 * - "full": página completa con Sobre el equipo, Entrenamientos y Contacto.
 */
export type HomeVariant = 'landing' | 'full'
export const HOME_VARIANT: HomeVariant = import.meta.env.VITE_HOME_VARIANT === 'full' ? 'full' : 'landing'

/** Subdominio del dashboard interno: dashboard.<dominio> (y dashboard.localhost en desarrollo). */
export const DASHBOARD_SUBDOMAIN = 'dashboard'

export type AppTarget = 'public' | 'dashboard'

/**
 * Un único deploy sirve las dos apps y elige cuál montar según el host: si el primer label es
 * `dashboard`, el dashboard; si no, la web pública. `VITE_APP_TARGET` fuerza una de ellas, útil en
 * las URLs de preview de Vercel (*.vercel.app), que no admiten subdominios.
 */
export function resolveAppTarget(hostname = window.location.hostname): AppTarget {
  const forced = import.meta.env.VITE_APP_TARGET
  if (forced === 'public' || forced === 'dashboard') return forced
  return hostname.split('.')[0] === DASHBOARD_SUBDOMAIN ? 'dashboard' : 'public'
}
