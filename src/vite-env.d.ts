/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: 'public' | 'dashboard'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
