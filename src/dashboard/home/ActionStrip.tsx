import { Link } from 'react-router'
import { Button, buttonClasses } from '../ui'
import { BallIcon, CalendarIcon, ImageIcon } from '../ui/icons'

type ActionStripProps = {
  onNewActivity: () => void
  onNewMatch: () => void
}

/** Lo que se hace desde el dashboard, como rótulos de vinilo en el pasillo: cargar partido es el principal. */
export function ActionStrip({ onNewActivity, onNewMatch }: ActionStripProps) {
  return (
    <nav aria-label="Acciones" className="line-top flex flex-col gap-2 pt-4 sm:flex-row sm:flex-wrap">
      <Button variant="primary" onClick={onNewMatch} className="min-h-12 pr-5 pl-4 sm:min-h-11">
        <BallIcon className="size-5" strokeWidth={2} />
        Cargar partido
      </Button>
      <Button onClick={onNewActivity} className="min-h-12 pr-5 pl-4 sm:min-h-11">
        <CalendarIcon className="size-5" strokeWidth={2} />
        Cargar actividad
      </Button>
      <Link to="/flyers" className={buttonClasses({ className: 'min-h-12 pr-5 pl-4 sm:min-h-11' })}>
        <ImageIcon className="size-5" strokeWidth={2} />
        Diseñar flyer
      </Link>
    </nav>
  )
}
