import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import type { MatchSummary } from '@shared/schemas'
import { Button, Skeleton } from '../ui'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons'
import { MatchCoverCard } from './MatchCoverCard'

type MatchCarouselProps = {
  matches: MatchSummary[]
  label: string
}

const SLIDE_CLASSES = 'min-w-0 shrink-0 grow-0 basis-full pl-4 md:basis-[68%] xl:basis-[52%] 2xl:basis-[42%]'

/** Carrusel sin autoplay: flechas, indicadores, swipe y teclado (← →). */
export function MatchCarousel({ matches, label }: MatchCarouselProps) {
  const [viewportRef, embla] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', skipSnaps: false })
  const [selected, setSelected] = useState(0)
  const [snaps, setSnaps] = useState<number[]>([])
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    if (!embla) return
    const sync = () => {
      setSelected(embla.selectedScrollSnap())
      setSnaps(embla.scrollSnapList())
      setCanPrev(embla.canScrollPrev())
      setCanNext(embla.canScrollNext())
    }
    sync()
    embla.on('select', sync).on('reInit', sync)
    return () => {
      embla.off('select', sync).off('reInit', sync)
    }
  }, [embla])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!embla) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        embla.scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        embla.scrollNext()
      }
    },
    [embla],
  )

  // Al enfocar con Tab una tarjeta oculta, el navegador desplaza el viewport por su cuenta:
  // se deshace ese scroll y se pide a Embla que lleve la diapositiva a la vista.
  const onSlideFocus = (index: number) => (event: React.FocusEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget.parentElement?.parentElement
    if (viewport) viewport.scrollLeft = 0
    embla?.scrollTo(index)
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="rounded-2xl outline-offset-4"
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div className="-ml-4 flex touch-pan-y">
          {matches.map((match, index) => (
            <div
              key={match.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${matches.length}`}
              onFocus={onSlideFocus(index)}
              className={SLIDE_CLASSES}
            >
              <MatchCoverCard match={match} eager={index === 0} />
            </div>
          ))}
        </div>
      </div>

      {snaps.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="icon" static onClick={() => embla?.scrollPrev()} disabled={!canPrev} aria-label="Partido anterior">
            <ChevronLeftIcon strokeWidth={2} />
          </Button>
          <div role="tablist" aria-label="Posición del carrusel" className="flex items-center gap-1">
            {snaps.map((_, index) => {
              const active = index === selected
              return (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Ir a la posición ${index + 1}`}
                  onClick={() => embla?.scrollTo(index)}
                  className="group flex size-6 items-center justify-center rounded-full md:size-5"
                >
                  <span
                    className={[
                      'block h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out',
                      active ? 'w-5 bg-coyote-gold' : 'w-1.5 bg-coyote-steel group-hover:bg-coyote-ash',
                    ].join(' ')}
                  />
                </button>
              )
            })}
          </div>
          <Button variant="ghost" size="icon" static onClick={() => embla?.scrollNext()} disabled={!canNext} aria-label="Partido siguiente">
            <ChevronRightIcon strokeWidth={2} />
          </Button>
        </div>
      )}
    </section>
  )
}

export function MatchCarouselSkeleton() {
  return (
    <div className="overflow-hidden" aria-busy aria-label="Cargando partidos">
      <div className="-ml-4 flex">
        {[0, 1, 2].map((i) => (
          <div key={i} className={SLIDE_CLASSES}>
            <Skeleton className="aspect-[4/3] rounded-2xl sm:aspect-[16/10]" />
          </div>
        ))}
      </div>
    </div>
  )
}
