import { LOGO_SRC, TEAM_NAME } from '@/config'
import { publicContent, publicNav } from '@/content/public'

// Home pública. IMPORTANTE: no debe contener enlaces ni menciones a la app interna.
export function HomePage() {
  const { hero, about, trainings, contact, footer } = publicContent

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-coyote-gold focus:px-4 focus:py-2 focus:text-coyote-black"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-coyote-rust/50 bg-coyote-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
          <a href="#inicio" className="flex min-h-11 items-center gap-2.5 rounded-lg">
            <img src={LOGO_SRC} alt={`Inicio · ${TEAM_NAME}`} className="size-9 rounded-full" />
            <span className="hidden font-display text-2xl leading-none text-coyote-gold uppercase sm:inline">{TEAM_NAME}</span>
          </a>
          <nav aria-label="Secciones">
            <ul className="flex items-center gap-1">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm font-medium text-coyote-ash transition-colors duration-150 hover:bg-coyote-ember/60 hover:text-coyote-silver sm:px-3"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        {/* Hero */}
        <section id="inicio" className="bg-ember-fade">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center md:flex-row md:gap-12 md:px-6 md:py-24 md:text-left">
            <img
              src={LOGO_SRC}
              alt={`Escudo de ${TEAM_NAME}`}
              width={288}
              height={288}
              loading="eager"
              className="w-56 max-w-full rounded-full shadow-gold sm:w-72"
            />
            <div className="flex flex-col items-center gap-4 md:items-start">
              <h1 className="text-7xl leading-none text-coyote-gold md:text-8xl">{hero.title}</h1>
              <p className="font-display text-3xl leading-none text-coyote-silver uppercase">{hero.tagline}</p>
              <p className="max-w-md text-coyote-ash">{hero.intro}</p>
              <a
                href={hero.cta.href}
                className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-lg bg-coyote-gold pr-4 pl-5 font-semibold text-coyote-black transition-[background-color,scale] duration-150 ease-out hover:bg-coyote-yellow active:scale-[0.96]"
              >
                {hero.cta.label}
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Sobre el equipo */}
        <section id="equipo" className="scroll-mt-16">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1fr_16rem] md:px-6 md:py-20">
            <div>
              <h2 className="text-5xl leading-none text-coyote-gold">{about.title}</h2>
              <div className="mt-4 flex flex-col gap-3 text-coyote-silver/90">
                {about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-2 self-start md:grid-cols-1">
              {about.facts.map((fact) => (
                <div key={fact.label} className="rounded-2xl bg-coyote-night p-4 shadow-border">
                  <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">{fact.label}</dt>
                  <dd className="mt-1 font-display text-2xl leading-none text-coyote-silver">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Entrenamientos */}
        <section id="entrenamientos" className="scroll-mt-16 border-y border-coyote-rust/40 bg-coyote-night/60">
          <div className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
            <h2 className="text-5xl leading-none text-coyote-gold">{trainings.title}</h2>
            <p className="mt-3 max-w-2xl text-coyote-ash">{trainings.intro}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {trainings.sessions.map((session) => (
                <li key={session.days} className="flex flex-col gap-1 rounded-2xl bg-coyote-night p-5 shadow-border">
                  <span className="font-display text-3xl leading-none text-coyote-silver uppercase">{session.days}</span>
                  <span className="text-lg font-semibold text-coyote-gold tabular-nums">{session.time}</span>
                  <span className="text-sm text-coyote-silver">{session.place}</span>
                  <span className="text-sm text-coyote-ash">{session.focus}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contacto y redes */}
        <section id="contacto" className="scroll-mt-16">
          <div className="mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
            <h2 className="text-5xl leading-none text-coyote-gold">{contact.title}</h2>
            <p className="mt-3 max-w-2xl text-coyote-ash">{contact.intro}</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-12 items-center rounded-lg bg-coyote-gold px-5 font-semibold text-coyote-black transition-[background-color,scale] duration-150 ease-out hover:bg-coyote-yellow active:scale-[0.96]"
                >
                  {contact.email}
                </a>
              </li>
              {contact.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-coyote-ember px-5 font-medium text-coyote-silver shadow-border transition-[background-color,box-shadow,scale] duration-150 ease-out hover:bg-coyote-rust/50 hover:shadow-border-hover active:scale-[0.96]"
                  >
                    {link.label}
                    {link.handle && <span className="text-sm text-coyote-ash">{link.handle}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-coyote-rust/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6 text-sm text-coyote-ash md:px-6">
          <span>{footer.text}</span>
          <span className="font-display text-xl leading-none text-coyote-orange uppercase">{hero.tagline}</span>
        </div>
      </footer>
    </div>
  )
}
