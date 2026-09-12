import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router'
import { INTERNAL_ROUTE, LOGO_SRC, TEAM_NAME } from '@/config'
import { AccessGate } from './AccessGate'
import { useLogout, useSession } from './useSession'

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const previousTitle = document.title
    document.title = `${TEAM_NAME} · Staff`
    return () => {
      meta.remove()
      document.title = previousTitle
    }
  }, [])
}

export function InternalLayout() {
  useNoIndex()
  const session = useSession()
  const logout = useLogout()

  if (session.isPending) {
    return <p className="p-8 text-coyote-ash">Cargando…</p>
  }
  if (!session.data?.authenticated) {
    return <AccessGate />
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-coyote-rust/60 bg-coyote-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to={INTERNAL_ROUTE} end className="flex items-center gap-3">
            <img src={LOGO_SRC} alt="" className="size-10 rounded-full" />
            <span className="font-display text-2xl text-coyote-gold uppercase">{TEAM_NAME} staff</span>
          </NavLink>
          {/* Aquí irá la navegación: Actividades · Videos · Equipos */}
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="ml-auto text-sm text-coyote-ash hover:text-coyote-orange"
          >
            Salir
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
