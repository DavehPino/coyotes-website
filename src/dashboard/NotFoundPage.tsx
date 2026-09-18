import { Link } from 'react-router'

type NotFoundPageProps = {
  title?: string
  message?: string
  backTo?: string
  backLabel?: string
}

/** 404 dentro del layout del dashboard (mantiene el menú). */
export function NotFoundPage({
  title = '404',
  message = 'Esta página no existe.',
  backTo = '/activities',
  backLabel = 'Ir a Actividades',
}: NotFoundPageProps) {
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-7xl leading-none text-ink">{title}</h1>
      <p className="text-ink-soft">{message}</p>
      <Link
        to={backTo}
        className="inline-flex min-h-11 items-center rounded-sm px-3 font-bold tracking-wide text-ink uppercase underline-offset-4 hover:underline"
      >
        {backLabel}
      </Link>
    </section>
  )
}
