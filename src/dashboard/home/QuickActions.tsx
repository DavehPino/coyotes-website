import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card } from '../ui'
import { ArrowRightIcon, BallIcon, CalendarIcon, ImageIcon } from '../ui/icons'

type QuickActionsProps = {
  onNewActivity: () => void
}

const ACTION_CLASSES = [
  'flex min-h-16 w-full items-center gap-3 p-3 text-left',
  'transition-[box-shadow,scale] duration-150 ease-out hover:shadow-border-hover active:scale-[0.96]',
].join(' ')

type ActionBodyProps = { icon: ReactNode; title: string; description: string }

function ActionBody({ icon, title, description }: ActionBodyProps) {
  return (
    <>
      {/* Círculo: no compite con el radio de la tarjeta. */}
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-coyote-ember text-coyote-gold">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-coyote-silver">{title}</span>
        <span className="truncate text-xs text-coyote-ash">{description}</span>
      </span>
      <ArrowRightIcon
        className="ml-auto size-4 shrink-0 text-coyote-ash transition-transform duration-150 ease-out group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </>
  )
}

/** Lo que se hace desde el dashboard, a un toque desde la Home. Partidos solo lleva a la sección. */
export function QuickActions({ onNewActivity }: QuickActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card as="button" type="button" onClick={onNewActivity} className={`group ${ACTION_CLASSES}`}>
        <ActionBody
          icon={<CalendarIcon className="size-5" strokeWidth={2} />}
          title="Cargar actividad"
          description="Entrenamiento, partido o reunión"
        />
      </Card>
      <Card as={Link} to="/matches" className={`group ${ACTION_CLASSES}`}>
        <ActionBody
          icon={<BallIcon className="size-5" strokeWidth={2} />}
          title="Partidos"
          description="Resultados, sets y videos"
        />
      </Card>
      <Card as={Link} to="/flyers" className={`group ${ACTION_CLASSES}`}>
        <ActionBody
          icon={<ImageIcon className="size-5" strokeWidth={2} />}
          title="Diseñar flyer"
          description="Plantillas para Instagram"
        />
      </Card>
    </div>
  )
}
