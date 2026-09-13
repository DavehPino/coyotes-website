import { lazy, Suspense } from 'react'
import { useDialogSession } from '../admin/useDialogSession'
import { Button, EmptyState, ErrorState, PageHeader } from '../ui'
import { BallIcon, PlusIcon } from '../ui/icons'
import { useMatches } from './api'
import { MatchCarousel, MatchCarouselSkeleton } from './MatchCarousel'
import { MatchList, MatchListSkeleton } from './MatchList'

// El formulario de alta solo se descarga la primera vez que se abre.
const NewMatchDialog = lazy(() => import('./new/NewMatchDialog'))

const CAROUSEL_SIZE = 10

/** Partidos pasados: carrusel con los últimos y listado completo por mes. */
export function MatchesPage() {
  const query = useMatches()
  const dialog = useDialogSession()

  const addButton = (
    <Button variant="primary" onClick={dialog.openDialog} className="pr-4 pl-3.5">
      <PlusIcon className="size-4" strokeWidth={2} />
      Cargar partido
    </Button>
  )

  return (
    <section>
      <PageHeader title="Partidos" description="Resultados y videos de los partidos jugados." actions={addButton} />

      {query.isPending ? (
        <div className="flex flex-col gap-8">
          <MatchCarouselSkeleton />
          <MatchListSkeleton />
        </div>
      ) : query.isError ? (
        <ErrorState
          title="No se pudieron cargar los partidos"
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={<BallIcon className="size-8" />}
          title="Todavía no hay partidos cargados"
          description="Cuando se registre un partido jugado aparecerá aquí con su marcador y sus videos."
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 text-3xl leading-none text-coyote-silver">Últimos partidos</h2>
            <MatchCarousel matches={query.data.slice(0, CAROUSEL_SIZE)} label="Últimos partidos" />
          </div>
          <div>
            <h2 className="mb-3 text-3xl leading-none text-coyote-silver">Todos los partidos</h2>
            <MatchList matches={query.data} />
          </div>
        </div>
      )}

      {dialog.mounted && (
        <Suspense fallback={null}>
          <NewMatchDialog key={dialog.session} open={dialog.open} onClose={dialog.close} onRestart={dialog.restart} />
        </Suspense>
      )}
    </section>
  )
}
