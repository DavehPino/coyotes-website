import { useEffect, useRef } from 'react'
import type { Activity } from '@shared/schemas'
import { formatDayLong, formatDayShort } from '@/lib/dates'
import { Chip, Skeleton } from '../ui'
import { ActivityCard } from './ActivityCard'
import { weekDays } from './week'

type WeekBoardProps = {
  weekStart: string
  items: Activity[]
  today: string
  onOpen: (activity: Activity) => void
}

// Tablero: en móvil una columna por pantalla con scroll-snap; en escritorio 7 columnas con scroll horizontal.
const BOARD_CLASSES =
  '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-3 md:mx-0 md:snap-none md:scroll-px-0 md:px-0'
const COLUMN_CLASSES = 'flex w-full shrink-0 snap-start flex-col rounded-2xl p-2 md:w-64 md:snap-align-none'

export function WeekBoard({ weekStart, items, today, onOpen }: WeekBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLElement>(null)
  const days = weekDays(weekStart)

  // Al abrir la semana actual, mostrar la columna de hoy: en móvil al inicio de la pantalla,
  // en escritorio solo lo justo para que quede visible. Otras semanas empiezan por el lunes.
  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const column = todayRef.current
    if (!column) {
      board.scrollTo({ left: 0, behavior: 'instant' })
      return
    }
    const desktop = window.matchMedia('(min-width: 48rem)').matches
    const start = column.offsetLeft - board.offsetLeft
    const end = start + column.offsetWidth - board.clientWidth
    const left = desktop ? Math.min(Math.max(board.scrollLeft, end), start) : start
    board.scrollTo({ left, behavior: 'instant' })
  }, [weekStart])

  return (
    <div ref={boardRef} className={BOARD_CLASSES} aria-label="Tablero semanal">
      {days.map((day) => {
        const isToday = day === today
        const dayItems = items.filter((item) => item.activity_date === day)
        return (
          <section
            key={day}
            ref={isToday ? todayRef : undefined}
            aria-labelledby={`day-${day}`}
            className={[
              COLUMN_CLASSES,
              'min-h-[55dvh] bg-coyote-night md:min-h-[60dvh]',
              isToday ? 'shadow-[0_0_0_2px_var(--color-coyote-yellow)]' : 'shadow-border',
            ].join(' ')}
          >
            <header className="flex items-center justify-between gap-2 px-2 py-1.5">
              <h2 id={`day-${day}`} className="text-2xl leading-none text-coyote-silver">
                <span className="sr-only">{formatDayLong(day)}</span>
                <span aria-hidden>{formatDayShort(day)}</span>
              </h2>
              {isToday && <Chip tone="yellow">Hoy</Chip>}
            </header>

            {dayItems.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-coyote-ash/80">Sin actividades</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayItems.map((activity) => (
                  <li key={activity.id}>
                    <ActivityCard activity={activity} onOpen={onOpen} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

export function WeekBoardSkeleton() {
  return (
    <div className={BOARD_CLASSES} aria-busy aria-label="Cargando tablero">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className={`${COLUMN_CLASSES} min-h-[55dvh] bg-coyote-night shadow-border md:min-h-[60dvh]`}>
          <div className="px-2 py-1.5">
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex flex-col gap-2">
            {i % 3 !== 2 && <Skeleton className="h-28 rounded-lg" />}
            {i % 2 === 0 && <Skeleton className="h-20 rounded-lg" />}
          </div>
        </div>
      ))}
    </div>
  )
}
