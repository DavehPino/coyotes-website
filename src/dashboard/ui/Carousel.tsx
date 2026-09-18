import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from './Button'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

type CarouselProps<T> = {
  items: T[]
  label: string
  getKey: (item: T) => string
  renderSlide: (item: T, index: number) => ReactNode
  /** Ancho de cada diapositiva (clases `basis-*`). */
  slideClassName?: string
  /** Nombre de cada elemento para los botones: "Partido anterior" / "Partido siguiente". */
  prevLabel: string
  nextLabel: string
}

export const CAROUSEL_TRACK_CLASSES = '-ml-4 flex'
const SLIDE_BASE_CLASSES = 'min-w-0 shrink-0 grow-0 pl-4'

export function carouselSlideClasses(slideClassName: string) {
  return `${SLIDE_BASE_CLASSES} ${slideClassName}`
}

/** Carrusel sin autoplay: flechas, indicadores, swipe y teclado (← →). */
export function Carousel<T>({ items, label, getKey, renderSlide, slideClassName = 'basis-full', prevLabel, nextLabel }: CarouselProps<T>) {
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
  const onSlideFocus = (index: number) => (event: FocusEvent<HTMLDivElement>) => {
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
      className="rounded-md outline-offset-4"
    >
      <div ref={viewportRef} className="-my-1 overflow-hidden py-1">
        <div className={`${CAROUSEL_TRACK_CLASSES} touch-pan-y`}>
          {items.map((item, index) => (
            <div
              key={getKey(item)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${items.length}`}
              onFocus={onSlideFocus(index)}
              className={carouselSlideClasses(slideClassName)}
            >
              {renderSlide(item, index)}
            </div>
          ))}
        </div>
      </div>

      {snaps.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="icon" static onClick={() => embla?.scrollPrev()} disabled={!canPrev} aria-label={prevLabel}>
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
                      active ? 'w-5 bg-ink' : 'w-1.5 bg-ink/20 group-hover:bg-ink-soft',
                    ].join(' ')}
                  />
                </button>
              )
            })}
          </div>
          <Button variant="ghost" size="icon" static onClick={() => embla?.scrollNext()} disabled={!canNext} aria-label={nextLabel}>
            <ChevronRightIcon strokeWidth={2} />
          </Button>
        </div>
      )}
    </section>
  )
}
