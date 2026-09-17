import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Open Graph necesita URLs absolutas: sustituye %SITE_URL% en index.html y antepone el sitio a
 * og:image (que Vite ya ha convertido en la ruta con hash del escudo). Se ejecuta después de Vite.
 * Orden: VITE_SITE_URL → dominio de producción que expone Vercel → vacío (rutas relativas).
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'coyotes-site-url',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html
          .replaceAll('%SITE_URL%', siteUrl)
          // En build Vite deja aquí un marcador __VITE_ASSET__ que luego resuelve a /assets/<hash>.png
          .replace(/(property="og:image" content=")(?=\/|__VITE_ASSET__)/, `$1${siteUrl}`),
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const siteUrl =
    env.VITE_SITE_URL?.replace(/\/+$/, '') ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '')

  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(siteUrl)],
    resolve: {
      alias: {
        '@': '/src',
        '@shared': '/shared',
        '@assets': '/assets',
      },
    },
    server: {
      // `API_PROXY` (p.ej. http://localhost:3200, teamhub-api en local) reenvía /api a ese servidor.
      proxy: env.API_PROXY ? { '/api': { target: env.API_PROXY, changeOrigin: false } } : undefined,
    },
  }
})
