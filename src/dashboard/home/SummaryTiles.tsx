import { Link } from 'react-router'
import { Card, Skeleton } from '../ui'
import { BallIcon, CalendarIcon, FilmIcon, type IconProps } from '../ui/icons'
import { countToday, matchStats } from './stats'
import type { Activity, MatchSummary } from '@shared/schemas'

type TileProps = {
  to: string
  label: string
  value: number
  hint: string
  icon: (props: IconProps) => React.JSX.Element
  /** Destaca el número en dorado (solo el dato principal de la sección). */
  accent?: boolean
  /** Ocupa las dos columnas en móvil, para que la fila impar no deje un hueco. */
  wide?: boolean
}

function Tile({ to, label, value, hint, icon: Icon, accent, wide }: TileProps) {
  return (
    <Card
      as={Link}
      to={to}
      className={[
        'flex min-h-24 flex-col justify-between gap-3 p-4',
        wide ? 'max-md:col-span-2' : '',
        'transition-[box-shadow,scale] duration-150 ease-out hover:shadow-border-hover active:scale-[0.96]',
      ].join(' ')}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-coyote-ash uppercase">
        <Icon className="size-4 shrink-0" strokeWidth={2} />
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={`font-display text-4xl leading-none tabular-nums ${accent ? 'text-coyote-gold' : 'text-coyote-silver'}`}
        >
          {value}
        </span>
        <span className="text-xs text-coyote-ash">{hint}</span>
      </span>
    </Card>
  )
}

const GRID_CLASSES = 'grid grid-cols-2 gap-3 md:grid-cols-3'

type SummaryTilesProps = {
  activities: Activity[]
  matches: MatchSummary[]
  today: string
}

/** Tres números de cabecera; cada uno lleva a su sección. */
export function SummaryTiles({ activities, matches, today }: SummaryTilesProps) {
  const stats = matchStats(matches)
  const todayCount = countToday(activities, today)

  return (
    <div className={GRID_CLASSES}>
      <Tile
        to="/activities"
        label="Próximas"
        value={activities.length}
        hint={todayCount > 0 ? `${todayCount} hoy` : 'en agenda'}
        icon={CalendarIcon}
        accent
      />
      <Tile to="/matches" label="Partidos" value={stats.played} hint="registrados" icon={BallIcon} />
      <Tile to="/matches" label="Videos" value={stats.videos} hint="subidos" icon={FilmIcon} wide />
    </div>
  )
}

export function SummaryTilesSkeleton() {
  return (
    <div className={GRID_CLASSES} aria-busy aria-label="Cargando resumen">
      {[0, 1, 2].map((i) => (
        <Card key={i} className={`flex min-h-24 flex-col justify-between gap-3 p-4 ${i === 2 ? 'max-md:col-span-2' : ''}`}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-14" />
        </Card>
      ))}
    </div>
  )
}
