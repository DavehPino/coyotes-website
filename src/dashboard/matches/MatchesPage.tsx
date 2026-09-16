import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useDialogSession } from '../admin/useDialogSession'
import { Button, EmptyState, ErrorState, Field, PageHeader, Select } from '../ui'
import { BallIcon, PlusIcon, RefreshIcon, TrophyIcon } from '../ui/icons'
import { useMatches } from './api'
import { CompetitionFilter } from './CompetitionFilter'
import { useCompetitions } from './competitions'
import { MatchCarousel, MatchCarouselSkeleton } from './MatchCarousel'
import { MatchList, MatchListSkeleton } from './MatchList'

// Los diálogos solo se descargan la primera vez que se abren.
const NewMatchDialog = lazy(() => import('./new/NewMatchDialog'))
const SyncCourtrackDialog = lazy(() => import('./sync/SyncCourtrackDialog'))
const ManageLeaguesDialog = lazy(() => import('./leagues/ManageLeaguesDialog'))

const CAROUSEL_SIZE = 10
/** Parámetros de la URL con la competición y la temporada elegidas: el filtro sobrevive a recargar y se puede compartir. */
const FILTER_PARAM = 'liga'
const SEASON_PARAM = 'temporada'

/** Partidos pasados: filtro por liga, carrusel con los últimos y listado completo por mes. */
export function MatchesPage() {
  const [params, setParams] = useSearchParams()
  // `?liga=a,b`: varias competiciones a la vez. La temporada solo aplica con una única competición elegida.
  const competitionIds = (params.get(FILTER_PARAM) ?? '').split(',').filter(Boolean)
  const soleCompetitionId = competitionIds.length === 1 ? competitionIds[0]! : null
  const seasonId = soleCompetitionId ? params.get(SEASON_PARAM) : null
  const competitions = useCompetitions()
  const query = useMatches(competitionIds, seasonId)
  const dialog = useDialogSession()
  const syncDialog = useDialogSession()
  const leaguesDialog = useDialogSession()
  const [syncLeagueId, setSyncLeagueId] = useState<string | null>(null)

  const filterOptions = (competitions.data ?? []).filter((item) => item.match_count > 0)
  const selectedList = (competitions.data ?? []).filter((item) => competitionIds.includes(item.id))
  const selected = selectedList.length === 1 ? selectedList[0]! : null
  // Temporadas de CourtTrack de la competición elegida (solo si hay más de una con partidos, o alguna archivada).
  const seasons = (selected?.seasons ?? []).filter((season) => season.match_count > 0)
  const showSeasons = seasons.length > 1 || seasons.some((season) => season.archived)
  const selectedSeason = seasons.find((season) => season.id === seasonId) ?? null
  const filterLabel = selectedSeason?.label ?? (selectedList.length > 0 ? selectedList.map((item) => item.name).join(' · ') : null)

  function setFilter(ids: string[]) {
    setParams(ids.length > 0 ? { [FILTER_PARAM]: ids.join(',') } : {}, { replace: true })
  }

  function setSeason(id: string | null) {
    if (!soleCompetitionId) return
    setParams(
      id ? { [FILTER_PARAM]: soleCompetitionId, [SEASON_PARAM]: id } : { [FILTER_PARAM]: soleCompetitionId },
      { replace: true },
    )
  }

  /** Desde el gestor de ligas: cierra ese diálogo y abre el de sync ya con la liga elegida. */
  function syncLeague(leagueId: string) {
    leaguesDialog.close(false)
    setSyncLeagueId(leagueId)
    syncDialog.restart()
    syncDialog.openDialog()
  }

  function openSync() {
    setSyncLeagueId(null)
    syncDialog.openDialog()
  }

  function manageLeagues() {
    syncDialog.close(false)
    leaguesDialog.openDialog()
  }

  const actions = (
    <>
      <Button onClick={leaguesDialog.openDialog} className="pr-4 pl-3.5">
        <TrophyIcon className="size-4" strokeWidth={2} />
        Ligas
      </Button>
      <Button onClick={openSync} className="pr-4 pl-3.5">
        <RefreshIcon className="size-4" strokeWidth={2} />
        Sincronizar
      </Button>
      <Button variant="primary" onClick={dialog.openDialog} className="pr-4 pl-3.5">
        <PlusIcon className="size-4" strokeWidth={2} />
        Cargar partido
      </Button>
    </>
  )

  return (
    <section>
      <PageHeader title="Partidos" description="Resultados y videos de los partidos jugados." actions={actions} />

      {(filterOptions.length > 1 || showSeasons) && (
        <div className="mb-5 flex flex-col gap-3">
          {filterOptions.length > 1 && (
            <CompetitionFilter competitions={filterOptions} value={competitionIds} onChange={setFilter} />
          )}
          {showSeasons && (
            <Field label="Temporada" className="max-w-xs">
              <Select value={seasonId ?? ''} onChange={(event) => setSeason(event.target.value || null)}>
                <option value="">Todas las temporadas</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.label}
                    {season.archived ? ' · finalizada' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}

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
        competitionIds.length > 0 ? (
          <EmptyState
            icon={<BallIcon className="size-8" />}
            title={filterLabel ? `Todavía no hay partidos de ${filterLabel}` : 'No hay partidos en estas ligas'}
            description="Cuando se registre o sincronice un partido de estas competiciones aparecerá aquí."
            action={
              <Button onClick={() => setFilter([])} className="mt-1">
                Ver todos los partidos
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<BallIcon className="size-8" />}
            title="Todavía no hay partidos cargados"
            description="Cuando se registre un partido jugado aparecerá aquí con su marcador y sus videos."
          />
        )
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 text-3xl leading-none text-balance text-coyote-silver">
              Últimos partidos{filterLabel ? ` · ${filterLabel}` : ''}
            </h2>
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
      {syncDialog.mounted && (
        <Suspense fallback={null}>
          <SyncCourtrackDialog
            key={syncDialog.session}
            open={syncDialog.open}
            initialLeagueId={syncLeagueId}
            onClose={syncDialog.close}
            onManageLeagues={manageLeagues}
          />
        </Suspense>
      )}
      {leaguesDialog.mounted && (
        <Suspense fallback={null}>
          <ManageLeaguesDialog
            key={leaguesDialog.session}
            open={leaguesDialog.open}
            onClose={leaguesDialog.close}
            onSyncLeague={syncLeague}
          />
        </Suspense>
      )}
    </section>
  )
}
