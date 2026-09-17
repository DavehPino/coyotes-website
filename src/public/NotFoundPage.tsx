export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-7xl text-coyote-gold">404</h1>
      <p className="text-coyote-ash">Esta página no existe.</p>
      <a href="/" className="inline-flex min-h-11 items-center rounded-lg px-3 text-coyote-orange underline-offset-4 hover:underline">
        Volver al inicio
      </a>
    </main>
  )
}
