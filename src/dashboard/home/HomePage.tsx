import { lazy, Suspense, useState } from 'react'
import { todayIsoDate } from '@shared/dates'
import type { Activity } from '@shared/schemas'
import { formatDateFull } from '@/lib/dates'
import { ActivityDetailModal } from '../activities/ActivityDetailModal'
import { useUpcomingActivities } from '../activities/api'
import { filterUpcoming } from '../activities/upcoming'
import { useMatches } from '../matches/api'
import { PageHeader } from '../ui'
import { LastMatchPanel } from './LastMatchPanel'
import { NextUpPanel } from './NextUpPanel'
import { QuickActions } from './QuickActions'
import { SummaryTiles, SummaryTilesSkeleton } from './SummaryTiles'
import { useDialogSession } from '../admin/useDialogSession'

// Los formularios de alta solo se descargan la primera vez que se abren.
const NewActivityDialog = lazy(() => import('../activities/new/NewActivityDialog'))
const NewMatchDialog = lazy(() => import('../matches/new/NewMatchDialog'))

function greeting(now = new Date()): string {
  const hour = now.getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Cada bloque entra 80 ms después del anterior: se lee la jerarquía sin que la espera se note. */
const rise = (delayMs: number) => ({ className: 'animate-rise', style: { animationDelay: `${delayMs}ms` } })

/** Resumen del equipo: lo que viene, el último partido y las acciones de siempre. */
export function HomePage() {
  const today = todayIsoDate()
  const [selected, setSelected] = useState<Activity | null>(null)

  const activitiesQuery = useUpcomingActivities(today)
  const matchesQuery = useMatches()
  const upcoming = activitiesQuery.data ? filterUpcoming(activitiesQuery.data) : []

  const activityDialog = useDialogSession()
  const matchDialog = useDialogSession()

  return (
    <section>
      {/* El margen inferior del encabezado es el mismo que en el resto de secciones. */}
      <div {...rise(0)}>
        <PageHeader title={greeting()} description={formatDateFull(today)} />
      </div>

      <div className="flex flex-col gap-8">
        <div {...rise(80)}>
          {activitiesQuery.isPending || matchesQuery.isPending ? (
            <SummaryTilesSkeleton />
          ) : (
            <SummaryTiles activities={upcoming} matches={matchesQuery.data ?? []} today={today} />
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-2 xl:gap-6">
          <div {...rise(160)}>
            <NextUpPanel
              query={activitiesQuery}
              items={upcoming}
              today={today}
              onOpen={setSelected}
              onAdd={activityDialog.openDialog}
            />
          </div>
          <div {...rise(240)}>
            <LastMatchPanel query={matchesQuery} onAdd={matchDialog.openDialog} />
          </div>
        </div>

        <div {...rise(320)}>
          <h2 className="mb-3 text-3xl leading-none text-coyote-silver">Accesos rápidos</h2>
          <QuickActions onNewActivity={activityDialog.openDialog} />
        </div>
      </div>

      <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />

      {activityDialog.mounted && (
        <Suspense fallback={null}>
          <NewActivityDialog
            key={activityDialog.session}
            open={activityDialog.open}
            onClose={activityDialog.close}
            onRestart={activityDialog.restart}
          />
        </Suspense>
      )}
      {matchDialog.mounted && (
        <Suspense fallback={null}>
          <NewMatchDialog
            key={matchDialog.session}
            open={matchDialog.open}
            onClose={matchDialog.close}
            onRestart={matchDialog.restart}
          />
        </Suspense>
      )}
    </section>
  )
}
