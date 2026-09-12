import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router'
import { LOGO_SRC, TEAM_NAME } from '@/config'

const SECTIONS = [
  { to: '/actividades', label: 'Actividades', icon: CalendarIcon },
  { to: '/partidos', label: 'Partidos', icon: BallIcon },
] as const

function useDashboardMeta() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = `${TEAM_NAME} · Dashboard`
    return () => meta.remove()
  }, [])
}

export function DashboardLayout() {
  useDashboardMeta()

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      {/* Menú lateral en escritorio · barra inferior en móvil */}
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-coyote-rust/60 bg-coyote-night md:sticky md:top-0 md:h-dvh md:border-t-0 md:border-r">
        <div className="hidden items-center gap-3 px-5 py-6 md:flex">
          <img src={LOGO_SRC} alt="" className="size-11 rounded-full" />
          <span className="font-display text-3xl leading-none text-coyote-gold uppercase">{TEAM_NAME}</span>
        </div>
        <nav aria-label="Secciones" className="flex md:flex-col md:gap-1 md:px-3">
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-1 flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-colors md:flex-none md:flex-row md:gap-3 md:rounded-lg md:text-base',
                  isActive
                    ? 'text-coyote-gold md:bg-coyote-ember'
                    : 'text-coyote-ash hover:text-coyote-silver md:hover:bg-coyote-ember/50',
                ].join(' ')
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 px-4 pt-6 pb-24 md:px-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  )
}

function BallIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18M3.5 9.5c5 .5 10.5 3 14 9M20.5 9.5c-5-1-10 0-15 4" />
    </svg>
  )
}
