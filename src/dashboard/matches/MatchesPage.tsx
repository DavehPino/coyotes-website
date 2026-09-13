import { lazy, Suspense, useState } from 'react'
import { Button, EmptyState, ErrorState, PageHeader } from '../ui'
import { BallIcon, PlusIcon } from '../ui/icons'
import { useMatches } from './api'
import { MatchCarousel, MatchCarouselSkeleton } from './MatchCarousel'
import { MatchList, MatchListSkeleton } from './MatchList'

// El formulario de alta solo se descarga la primera vez que se abre.
const NewMatchDialog = lazy(() => import('./new/NewMatchDialog'))

const CAROUSEL_SIZE = 10

/** Alta de partidos: el diálogo se monta al abrirlo por primera vez y conserva el borrador. */
function useNewMatchDialog() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  // Cambiar la key vuelve a montar el formulario vacío (tras guardar un partido).
  const [session, setSession] = useState(0)
  const [finished, setFinished] = useState(false)

  const openDialog = () => {
    if (finished) {
      setSession((n) => n + 1)
      setFinished(false)
    }
    setMounted(true)
    setOpen(true)
  }

  const dialog = mounted ? (
    <Suspense fallback={null}>
      <NewMatchDialog
        key={session}
        open={open}
        onClose={(done) => {
          setOpen(false)
          if (done) setFinished(true)
        }}
        onRestart={() => {
          setSession((n) => n + 1)
          setFinished(false)
        }}
      />
    </Suspense>
  ) : null

  return { openDialog, dialog }
}

/** Partidos pasados: carrusel con los últimos y listado completo por mes. */
export function MatchesPage() {
  const query = useMatches()
  const { openDialog, dialog } = useNewMatchDialog()

  const addButton = (
    <Button variant="primary" onClick={openDialog} className="pr-4 pl-3.5">
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

      {dialog}
    </section>
  )
}
