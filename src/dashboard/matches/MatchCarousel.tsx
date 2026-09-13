import type { MatchSummary } from '@shared/schemas'
import { Carousel, Skeleton } from '../ui'
import { CAROUSEL_TRACK_CLASSES, carouselSlideClasses } from '../ui/Carousel'
import { MatchCoverCard } from './MatchCoverCard'

type MatchCarouselProps = {
  matches: MatchSummary[]
  label: string
}

const SLIDE_WIDTH = 'basis-full md:basis-[68%] xl:basis-[52%] 2xl:basis-[42%]'

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
            <Skeleton className="aspect-[4/3] rounded-2xl sm:aspect-[16/10]" />
          </div>
        ))}
      </div>
    </div>
  )
}
