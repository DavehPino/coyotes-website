/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL absoluta del sitio para Open Graph (opcional). */
  readonly VITE_SITE_URL?: string
  /** Home pública: "landing" (por defecto) o "full". */
  readonly VITE_HOME_VARIANT?: 'landing' | 'full'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
