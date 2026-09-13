import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router'
import { LOGO_SRC, TEAM_NAME } from '@/config'
import { BallIcon, CalendarIcon, type IconProps } from './ui/icons'

const SECTIONS: { to: string; label: string; icon: (props: IconProps) => React.JSX.Element }[] = [
  { to: '/activities', label: 'Actividades', icon: CalendarIcon },
  { to: '/matches', label: 'Partidos', icon: BallIcon },
]

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
      {/* Cabecera compacta en móvil (la navegación va en la barra inferior) */}
      <header className="flex items-center gap-2.5 px-4 pt-4 md:hidden">
        <img src={LOGO_SRC} alt="" className="size-8 rounded-full" />
        <span className="font-display text-2xl leading-none text-coyote-gold uppercase">{TEAM_NAME}</span>
      </header>

      {/* Menú lateral en escritorio · barra inferior en móvil */}
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-coyote-rust/60 bg-coyote-night pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:h-dvh md:border-t-0 md:border-r md:pb-0">
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
                  'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-4 py-2 text-xs font-medium',
                  'transition-[color,background-color] duration-150 ease-out',
                  'md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-lg md:px-3 md:text-base',
                  isActive
                    ? 'text-coyote-gold md:bg-coyote-ember'
                    : 'text-coyote-ash hover:text-coyote-silver md:hover:bg-coyote-ember/50',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* Indicador estático del estado activo en móvil (además del color) */}
                  <span
                    aria-hidden
                    className={[
                      'absolute inset-x-6 top-0 h-0.5 rounded-b bg-coyote-gold transition-opacity duration-150 md:hidden',
                      isActive ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                  />
                  <Icon strokeWidth={2} filled={isActive} className="size-6 md:size-5" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-10">
        <Outlet />
      </main>
    </div>
  )
}
