import { createBrowserRouter, Navigate } from 'react-router'
import { DashboardLayout } from './DashboardLayout'
import { NotFoundPage } from './NotFoundPage'

// El dashboard vive en la raíz de su subdominio (dashboard.<dominio>).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      // Actividades es la sección por defecto
      { index: true, element: <Navigate to="/activities" replace /> },
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
