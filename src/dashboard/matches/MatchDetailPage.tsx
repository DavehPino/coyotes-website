import { useEffect } from 'react'
import { useParams } from 'react-router'
import { TEAM_NAME } from '@/config'
import { NotFoundPage } from '../NotFoundPage'
import { Card, ErrorState, PageHeader, Skeleton } from '../ui'
import { isNotFound, useMatch } from './api'
import { MatchHeader } from './MatchHeader'
import { matchTitle } from './matchLabels'
import { SetScores } from './SetScores'
import { VideoSection } from './VideoSection'

const BACK = { to: '/matches', label: 'Partidos' }

/** Detalle de un partido: cabecera, parciales, videos y resumen. */
export function MatchDetailPage() {
  const { slug = '' } = useParams()
  const query = useMatch(slug)
  const match = query.data

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
      <PageHeader back={BACK} title={match ? matchTitle(match) : 'Partido'} />

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
          <VideoSection videos={query.data.videos} />
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
