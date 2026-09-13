import { createBrowserRouter } from 'react-router'
import { HOME_VARIANT } from '@/config'
import { NotFoundPage } from './NotFoundPage'

// La home se elige en build con VITE_HOME_VARIANT; el navegador solo descarga el chunk de la variante activa.
const home =
  HOME_VARIANT === 'full'
    ? async () => ({ Component: (await import('./HomePage')).HomePage })
    : async () => ({ Component: (await import('./LandingPage')).LandingPage })

export const router = createBrowserRouter([
  { path: '/', lazy: home },
  { path: '*', element: <NotFoundPage /> },
])
