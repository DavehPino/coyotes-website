import { lazy, Suspense } from 'react'
import { HOME_VARIANT } from '@/config'
import { NotFoundPage } from './NotFoundPage'

// La home se elige en build con VITE_HOME_VARIANT; el navegador solo descarga el chunk de la variante activa.
const Home = lazy(
  HOME_VARIANT === 'full'
    ? async () => ({ default: (await import('./HomePage')).HomePage })
    : async () => ({ default: (await import('./LandingPage')).LandingPage }),
)

/**
 * Web pública sin router ni caché de datos: solo tiene la home y un 404, y así la landing
 * no descarga el código de navegación del dashboard.
 */
export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path !== '/') return <NotFoundPage />
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}
