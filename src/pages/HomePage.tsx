import { LOGO_SRC, TEAM_NAME } from '@/config'

// Home pública. IMPORTANTE: no debe contener enlaces a la ruta interna.
export function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <img src={LOGO_SRC} alt={`Escudo de ${TEAM_NAME}`} className="w-56 max-w-full rounded-full sm:w-72" />
      <h1 className="text-6xl text-coyote-gold sm:text-7xl">{TEAM_NAME} Volley</h1>
      <p className="max-w-md text-coyote-ash">Garra, equipo y vóley.</p>
    </main>
  )
}
