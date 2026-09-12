import { createBrowserRouter } from 'react-router'
import { INTERNAL_ROUTE } from './config'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    // Carga diferida: el código interno va en un chunk aparte, fuera del bundle público.
    path: INTERNAL_ROUTE,
    lazy: async () => ({ Component: (await import('./features/internal/InternalLayout')).InternalLayout }),
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./features/internal/InternalHome')).InternalHome }),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
