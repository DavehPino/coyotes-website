import { Link } from 'react-router'
import { Button, buttonClasses } from '../ui'
import { BallIcon, CalendarIcon, ImageIcon } from '../ui/icons'

type ActionStripProps = {
  onNewActivity: () => void
}

const ACTION = 'min-h-12 pr-5 pl-4 sm:min-h-11'

/**
 * Lo que se hace desde Inicio, como teclas en fila. Partidos es la principal y solo navega: cargar un partido
 * se hace desde su sección, no desde aquí.
 */
export function ActionStrip({ onNewActivity }: ActionStripProps) {
  return (
    <nav aria-label="Acciones" className="line-top flex flex-col gap-2 pt-4 sm:flex-row sm:flex-wrap">
      <Link to="/matches" className={buttonClasses({ variant: 'primary', className: ACTION })}>
        <BallIcon className="size-5" strokeWidth={2} />
        Partidos
      </Link>
      <Button onClick={onNewActivity} className={ACTION}>
        <CalendarIcon className="size-5" strokeWidth={2} />
        Cargar actividad
      </Button>
      <Link to="/flyers" className={buttonClasses({ className: ACTION })}>
        <ImageIcon className="size-5" strokeWidth={2} />
        Diseñar flyer
      </Link>
    </nav>
  )
}
