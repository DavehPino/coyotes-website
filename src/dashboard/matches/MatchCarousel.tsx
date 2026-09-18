import type { MatchSummary } from '@shared/schemas'
import { Carousel, Skeleton } from '../ui'
import { CAROUSEL_TRACK_CLASSES, carouselSlideClasses } from '../ui/Carousel'
import { MatchCoverCard } from './MatchCoverCard'

type MatchCarouselProps = {
  matches: MatchSummary[]
  label: string
}

// Más estrechas que antes: en móvil asoma la siguiente tarjeta y en escritorio caben tres.
const SLIDE_WIDTH = 'basis-[82%] sm:basis-[58%] md:basis-[46%] xl:basis-[34%] 2xl:basis-[27%]'

export function MatchCarousel({ matches, label }: MatchCarouselProps) {
  return (
    <Carousel
      items={matches}
      label={label}
      getKey={(match) => match.id}
      renderSlide={(match, index) => <MatchCoverCard match={match} eager={index === 0} />}
      slideClassName={SLIDE_WIDTH}
      prevLabel="Partido anterior"
      nextLabel="Partido siguiente"
    />
  )
}

export function MatchCarouselSkeleton() {
  return (
    <div className="overflow-hidden" aria-busy aria-label="Cargando partidos">
      <div className={CAROUSEL_TRACK_CLASSES}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={carouselSlideClasses(SLIDE_WIDTH)}>
            <Skeleton className="aspect-[16/10] rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
