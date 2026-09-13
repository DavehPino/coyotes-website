import { LOGO_SRC, TEAM_NAME } from '@/config'
import { publicContent } from '@/content/public'

// Landing mínima (VITE_HOME_VARIANT=landing, la opción por defecto).
// IMPORTANTE: no debe contener enlaces ni menciones a la app interna.
export function LandingPage() {
  const { hero } = publicContent

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ember-fade px-6 text-center">
      <img
        src={LOGO_SRC}
        alt={`Escudo de ${TEAM_NAME}`}
        width={288}
        height={288}
        loading="eager"
        className="w-56 max-w-full rounded-full shadow-gold sm:w-72"
      />
      <h1 className="text-6xl leading-none text-coyote-gold sm:text-7xl">{hero.title}</h1>
      <p className="max-w-md text-coyote-ash">{hero.tagline}</p>
    </main>
  )
}
