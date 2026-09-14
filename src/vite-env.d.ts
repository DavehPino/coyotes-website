/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL absoluta del sitio para Open Graph (opcional). */
  readonly VITE_SITE_URL?: string
  /** Home pública: "landing" (por defecto) o "full". */
  readonly VITE_HOME_VARIANT?: 'landing' | 'full'
  /** Fuerza la app a montar sin mirar el host (p.ej. "dashboard" en las previews de Vercel). */
  readonly VITE_APP_TARGET?: 'public' | 'dashboard'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
