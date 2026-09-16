import { createBrowserRouter } from 'react-router'
import { DashboardLayout } from './DashboardLayout'
import { NotFoundPage } from './NotFoundPage'

// El dashboard vive en la raíz de su subdominio (dashboard.<dominio>).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      // La Home resume lo importante y enlaza al resto de secciones.
      {
        index: true,
        lazy: async () => ({ Component: (await import('./home/HomePage')).HomePage }),
      },
      {
        path: 'activities',
        lazy: async () => ({ Component: (await import('./activities/ActivitiesPage')).ActivitiesPage }),
      },
      {
        path: 'matches',
        lazy: async () => ({ Component: (await import('./matches/MatchesPage')).MatchesPage }),
      },
      {
        path: 'matches/:slug',
        lazy: async () => ({ Component: (await import('./matches/MatchDetailPage')).MatchDetailPage }),
      },
      {
        path: 'flyers',
        lazy: async () => ({ Component: (await import('./flyers/FlyersPage')).FlyersPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
