import { lazy, Suspense, useState } from 'react'
import { todayIsoDate } from '@shared/dates'
import type { Activity } from '@shared/schemas'
import { endOfWeek, format, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDayMonth, formatWeekdayShort } from '@/lib/dates'
import { ActivityDetailModal } from '../activities/ActivityDetailModal'
import { useUpcomingActivities } from '../activities/api'
import { filterUpcoming } from '../activities/upcoming'
import { useMatches } from '../matches/api'
import { PageHeader } from '../ui'
import { ActionStrip } from './ActionStrip'
import { LastResultZone } from './LastResultZone'
import { NextMatchZone } from './NextMatchZone'
import { SeasonLine } from './SeasonLine'
import { useDialogSession } from '../admin/useDialogSession'

// Los formularios de alta solo se descargan la primera vez que se abren.
const NewActivityDialog = lazy(() => import('../activities/new/NewActivityDialog'))
const NewMatchDialog = lazy(() => import('../matches/new/NewMatchDialog'))

/** "VIE 18 SEP": el día de hoy como número de cancha. */
function todayLabel(today: string): string {
  return `${formatWeekdayShort(today)} ${formatDayMonth(today)}`.replace(/\./g, '')
}

/** "Semana del 14 al 20 de septiembre" (de lunes a domingo). */
function weekLabel(today: string): string {
  const date = parseISO(today)
  const from = startOfWeek(date, { weekStartsOn: 1 })
  const to = endOfWeek(date, { weekStartsOn: 1 })
  const sameMonth = from.getMonth() === to.getMonth()
  const fromLabel = format(from, sameMonth ? 'd' : "d 'de' MMMM", { locale: es })
  return `Semana del ${fromLabel} al ${format(to, "d 'de' MMMM", { locale: es })}`
}

/**
 * Inicio: la pista vista desde el banquillo. Zona de ataque con lo próximo, línea de ataque y el último
 * resultado; en escritorio la línea central parte la página en agenda y resultados. Las acciones van en una
 * tira de rótulos y los números de temporada, en la línea de fondo.
 */
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
      <PageHeader title={todayLabel(today)} description={weekLabel(today)} />

      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1fr)_6px_minmax(0,1fr)] md:gap-x-8 md:gap-y-10">
        <NextMatchZone
          query={activitiesQuery}
          items={upcoming}
          today={today}
          onOpen={setSelected}
          onAdd={activityDialog.openDialog}
        />
        {/* Línea central: en escritorio separa las dos mitades de la pista. */}
        <div aria-hidden className="hidden bg-line md:block" />
        <LastResultZone query={matchesQuery} onAdd={matchDialog.openDialog} />

        <div className="flex flex-col gap-8 md:col-span-3">
          <ActionStrip onNewActivity={activityDialog.openDialog} onNewMatch={matchDialog.openDialog} />
          <SeasonLine matches={matchesQuery.data ?? []} pending={matchesQuery.isPending} />
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
