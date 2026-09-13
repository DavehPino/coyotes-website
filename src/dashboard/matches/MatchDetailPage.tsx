import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { TEAM_NAME } from '@/config'
import { NotFoundPage } from '../NotFoundPage'
import { Button, Card, ErrorState, PageHeader, Skeleton } from '../ui'
import { PencilIcon, TrashIcon } from '../ui/icons'
import { isNotFound, useMatch } from './api'
import type { EditTab } from './edit/EditMatchDialog'
import { MatchHeader } from './MatchHeader'
import { matchTitle } from './matchLabels'
import { SetScores } from './SetScores'
import { VideoSection } from './VideoSection'

// Los diálogos de edición y borrado solo se descargan la primera vez que se abren.
const EditMatchDialog = lazy(() => import('./edit/EditMatchDialog'))
const DeleteMatchDialog = lazy(() => import('./edit/DeleteMatchDialog'))

const BACK = { to: '/matches', label: 'Partidos' }

type AdminDialog = 'edit' | 'delete'

/** Cada apertura empieza con los datos actuales del partido (`session` es la key del diálogo). */
function useAdminDialog() {
  const [state, setState] = useState({
    kind: 'edit' as AdminDialog,
    mounted: false,
    open: false,
    tab: 'details' as EditTab,
    session: 0,
  })
  return {
    ...state,
    openEdit: (tab: EditTab) =>
      setState((prev) => ({ kind: 'edit', mounted: true, open: true, tab, session: prev.session + 1 })),
    openDelete: () =>
      setState((prev) => ({ ...prev, kind: 'delete', mounted: true, open: true, session: prev.session + 1 })),
    close: () => setState((prev) => ({ ...prev, open: false })),
  }
}

/** Detalle de un partido: cabecera, parciales, videos y resumen. */
export function MatchDetailPage() {
  const { slug = '' } = useParams()
  const query = useMatch(slug)
  const match = query.data
  const dialog = useAdminDialog()

  useEffect(() => {
    if (match) document.title = `${matchTitle(match)} · ${TEAM_NAME}`
    return () => {
      document.title = `${TEAM_NAME} · Dashboard`
    }
  }, [match])

  if (query.isError && isNotFound(query.error)) {
    return (
      <NotFoundPage
        title="404"
        message="Este partido no existe o ya no está disponible."
        backTo={BACK.to}
        backLabel="Volver a Partidos"
      />
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={BACK}
        title={match ? matchTitle(match) : 'Partido'}
        actions={
          match && (
            <>
              <Button onClick={() => dialog.openEdit('details')} className="pr-4 pl-3.5">
                <PencilIcon className="size-4" strokeWidth={2} />
                Editar partido
              </Button>
              <Button onClick={dialog.openDelete} className="pr-4 pl-3.5">
                <TrashIcon className="size-4" strokeWidth={2} />
                Eliminar
              </Button>
            </>
          )
        }
      />

      {query.isPending ? (
        <MatchDetailSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="No se pudo cargar el partido"
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <>
          <MatchHeader match={query.data} />
          <SetScores match={query.data} />
          <VideoSection videos={query.data.videos} onManage={() => dialog.openEdit('videos')} />
          {query.data.summary && (
            <section aria-labelledby="summary-title">
              <h2 id="summary-title" className="mb-2 text-3xl leading-none text-coyote-silver">
                Resumen
              </h2>
              <Card className="p-4 md:p-5">
                <p className="whitespace-pre-line text-coyote-silver">{query.data.summary}</p>
              </Card>
            </section>
          )}
        </>
      )}

      {dialog.mounted && match && (
        <Suspense fallback={null}>
          {dialog.kind === 'edit' ? (
            <EditMatchDialog
              key={dialog.session}
              open={dialog.open}
              match={match}
              initialTab={dialog.tab}
              onClose={dialog.close}
            />
          ) : (
            <DeleteMatchDialog key={dialog.session} open={dialog.open} match={match} onClose={dialog.close} />
          )}
        </Suspense>
      )}
    </section>
  )
}

function MatchDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Cargando partido">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-20 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="aspect-video rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  )
}
