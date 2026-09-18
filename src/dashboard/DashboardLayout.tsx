import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { LOGO_SRC, TEAM_NAME } from '@/config'
import { BallIcon, CalendarIcon, CourtIcon, HomeIcon, ImageIcon, type IconProps } from './ui/icons'

type Section = {
  to: string
  label: string
  icon: (props: IconProps) => React.JSX.Element
  end?: boolean
  /** Color de la regla de la sección: marca de navegación y línea bajo la banda de cabecera. */
  line: string
  /** Color bajo la banda cuando la marca del nav no sirve ahí (una línea blanca bajo una banda blanca no se ve). */
  band?: string
}

/** Cada sección tiene su color de línea; sobre el menú lateral (color del club) todas tienen que verse. */
const SECTIONS: Section[] = [
  { to: '/', label: 'Inicio', icon: HomeIcon, end: true, line: 'var(--color-on-rail)', band: 'var(--color-paper-seam)' },
  { to: '/activities', label: 'Actividades', icon: CalendarIcon, line: '#4fb87a', band: 'var(--color-section-green)' },
  { to: '/matches', label: 'Partidos', icon: BallIcon, line: 'var(--color-accent)' },
  { to: '/lineup', label: 'Alineación', icon: CourtIcon, line: '#9a86ff', band: 'var(--color-section-violet)' },
  { to: '/flyers', label: 'Flyers', icon: ImageIcon, line: 'var(--color-club)' },
]

function sectionFor(pathname: string): Section {
  return SECTIONS.find((section) => (section.end ? pathname === section.to : pathname.startsWith(section.to))) ?? SECTIONS[0]!
}

function useDashboardMeta() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    document.title = `${TEAM_NAME} · Dashboard`
    // Activa el mundo visual del dashboard (hoja clara, tinta) sin tocar la web pública.
    document.documentElement.dataset.app = 'dashboard'
    return () => {
      meta.remove()
      delete document.documentElement.dataset.app
    }
  }, [])
}

type LineBox = { top: number; left: number; width: number; height: number }

/**
 * La regla de la sección activa se desliza hasta el enlace activo al navegar (el único movimiento
 * orquestado del dashboard). Se mide contra el `<nav>`; en móvil es una línea horizontal en el borde superior
 * de la barra y en escritorio una línea vertical pegada al borde izquierdo del menú lateral.
 */
function useActiveLine(pathname: string) {
  const navRef = useRef<HTMLElement>(null)
  const [box, setBox] = useState<LineBox | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active) return setBox(null)
      const navRect = nav.getBoundingClientRect()
      const rect = active.getBoundingClientRect()
      setBox({ top: rect.top - navRect.top, left: rect.left - navRect.left, width: rect.width, height: rect.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pathname])

  return { navRef, box }
}

export function DashboardLayout() {
  useDashboardMeta()
  const { pathname } = useLocation()
  const section = sectionFor(pathname)
  const { navRef, box } = useActiveLine(pathname)
  const lineStyle: CSSProperties | undefined = box
    ? { '--line-top': `${box.top}px`, '--line-left': `${box.left}px`, '--line-width': `${box.width}px`, '--line-height': `${box.height}px` } as CSSProperties
    : undefined

  return (
    <div
      className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]"
      style={{ '--section-line': section.band ?? section.line, '--nav-line': section.line } as CSSProperties}
    >
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-key focus:px-4 focus:py-2 focus:font-bold focus:text-on-key focus:uppercase"
      >
        Saltar al contenido
      </a>

      {/* Menú de navegación en el color del club: lateral en escritorio · barra inferior en móvil */}
      <aside className="fixed inset-x-0 bottom-0 z-20 bg-rail pb-[env(safe-area-inset-bottom)] text-on-rail md:sticky md:top-0 md:h-dvh md:pb-0">
        <div className="hidden items-center gap-3 px-5 pt-6 pb-5 md:flex">
          <img src={LOGO_SRC} alt="" width={44} height={44} className="size-11 rounded-full" />
          <span className="min-w-0 truncate text-2xl leading-none font-extrabold tracking-[0.06em] text-on-rail uppercase">{TEAM_NAME}</span>
        </div>
        <nav ref={navRef} aria-label="Secciones" className="relative flex md:flex-col md:gap-0.5 md:py-1" style={lineStyle}>
          {box && (
            <span
              aria-hidden
              className={[
                'pointer-events-none absolute bg-[color:var(--nav-line)]',
                'transition-[left,top,width,height,background-color] duration-200 ease-[var(--ease-soft)] motion-reduce:transition-none',
                // Móvil: línea horizontal sobre el enlace activo · escritorio: línea vertical al borde del menú lateral
                'top-0 left-[var(--line-left)] h-1.5 w-[var(--line-width)] rounded-b-[2px]',
                'md:top-[var(--line-top)] md:left-0 md:h-[var(--line-height)] md:w-1.5 md:rounded-none',
              ].join(' ')}
            />
          )}
          {SECTIONS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-bold tracking-wide uppercase',
                  'transition-[color,background-color] duration-150 ease-out',
                  // El foco general es de tinta y sobre el menú negro no se vería: aquí va en claro y hacia dentro.
                  'focus-visible:-outline-offset-4 focus-visible:outline-on-rail',
                  'md:min-h-11 md:flex-none md:flex-row md:justify-start md:gap-3 md:px-5 md:text-base',
                  isActive ? 'text-on-rail' : 'text-on-rail/65 hover:text-on-rail md:hover:bg-on-rail/8',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon strokeWidth={2} filled={isActive} className="size-6 md:size-5" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main id="contenido" className="min-w-0 px-4 pb-28 md:px-8 md:pb-10">
        <Outlet />
      </main>
    </div>
  )
}
