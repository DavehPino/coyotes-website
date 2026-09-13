import { useState } from 'react'
import { todayIsoDate } from '@shared/dates'
import type { Activity } from '@shared/schemas'
import { Carousel, EmptyState, ErrorState, PageHeader } from '../ui'
import { CAROUSEL_TRACK_CLASSES, carouselSlideClasses } from '../ui/Carousel'
import { CalendarIcon } from '../ui/icons'
import { ActivityDetailModal } from './ActivityDetailModal'
import { useUpcomingActivities } from './api'
import { UpcomingActivityCard, UpcomingActivityCardSkeleton } from './UpcomingActivityCard'
import { orderUpcoming } from './upcoming'

// En móvil asoma la siguiente tarjeta para invitar a deslizar.
const SLIDE_WIDTH = 'basis-[88%] sm:basis-[62%] lg:basis-[44%] xl:basis-[34%]'

/** Carrusel informativo con las próximas actividades; la primera es la de Liga Podio más cercana. */
export function ActivitiesPage() {
  const today = todayIsoDate()
  const [selected, setSelected] = useState<Activity | null>(null)
  const query = useUpcomingActivities(today)
  const items = query.data ? orderUpcoming(query.data) : []

  return (
    <section>
      <PageHeader title="Actividades" description="Lo que viene para el equipo." />

      {query.isPending ? (
        <div className="overflow-hidden" aria-busy aria-label="Cargando actividades">
          <div className={CAROUSEL_TRACK_CLASSES}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={carouselSlideClasses(SLIDE_WIDTH)}>
                <UpcomingActivityCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ) : query.isError ? (
        <ErrorState
          title="No se pudieron cargar las actividades"
          message={query.error.message}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="size-8" />}
          title="No hay actividades próximas"
          description="Cuando se programe una actividad aparecerá aquí."
        />
      ) : (
        <Carousel
          items={items}
          label="Próximas actividades"
          getKey={(activity) => activity.id}
          renderSlide={(activity) => <UpcomingActivityCard activity={activity} today={today} onOpen={setSelected} />}
          slideClassName={SLIDE_WIDTH}
          prevLabel="Actividad anterior"
          nextLabel="Actividad siguiente"
        />
      )}

      <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
