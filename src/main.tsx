import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { resolveAppTarget } from './config'
import './index.css'

// Cada app va en su propio chunk: la web pública no descarga el router ni TanStack Query del dashboard.
const { App } = resolveAppTarget() === 'dashboard' ? await import('./dashboard/App') : await import('./public/App')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
