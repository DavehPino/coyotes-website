import { createBrowserRouter, Navigate } from 'react-router'
import { NotFoundPage } from '@/public/NotFoundPage'
import { DashboardLayout } from './DashboardLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      // Actividades es la sección por defecto
      { index: true, element: <Navigate to="/actividades" replace /> },
      {
        path: 'actividades',
        lazy: async () => ({ Component: (await import('./activities/ActivitiesPage')).ActivitiesPage }),
      },
      {
        path: 'partidos',
        lazy: async () => ({ Component: (await import('./matches/MatchesPage')).MatchesPage }),
      },
      {
        path: 'partidos/:slug',
        lazy: async () => ({ Component: (await import('./matches/MatchDetailPage')).MatchDetailPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
