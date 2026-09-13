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

/** Ruta base del dashboard interno: <dominio>/dashboard. */
export const DASHBOARD_PATH = '/dashboard'

export type AppTarget = 'public' | 'dashboard'

/**
 * Un único deploy sirve las dos apps y elige cuál montar según la ruta:
 * todo lo que cuelga de /dashboard es el dashboard; el resto, la web pública.
 */
export function resolveAppTarget(pathname = window.location.pathname): AppTarget {
  return pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`) ? 'dashboard' : 'public'
}
