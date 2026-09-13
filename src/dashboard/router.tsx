import { createBrowserRouter, Navigate } from 'react-router'
import { DASHBOARD_PATH } from '@/config'
import { DashboardLayout } from './DashboardLayout'
import { NotFoundPage } from './NotFoundPage'

// Todas las rutas y enlaces del dashboard son relativos a /dashboard (basename).
export const router = createBrowserRouter(
  [
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
  ],
  { basename: DASHBOARD_PATH },
)
