// Filas de la plantilla Agenda. "Traer las próximas" las rellena con las actividades ya cargadas,
// que es lo que convierte la plantilla en la historia de la semana en un toque.
import { todayIsoDate } from '@shared/dates'
import {
  FLYER_AGENDA_LIMITS,
  FLYER_MAX_AGENDA_ITEMS,
  type FlyerAgendaItem,
  type FlyerContent,
} from '@shared/flyers'
import { useUpcomingActivities } from '../activities/api'
import { Button, Input } from '../ui'
import { CheckIcon, ChevronRightIcon, TrashIcon } from '../ui/icons'
import { Group, OptionButton } from './editorControls'
import { flyerFromAgenda } from './presets'

type AgendaFieldsProps = {
  flyer: FlyerContent
  onChange: (changes: Partial<FlyerContent>) => void
  /** Cambios grandes (traer la agenda entera) pasan por el historial para poder deshacerlos. */
  onReplace: (flyer: FlyerContent) => void
}

const EMPTY_ROW: FlyerAgendaItem = { when: '', what: '', where: '', highlight: false }

export function AgendaFields({ flyer, onChange, onReplace }: AgendaFieldsProps) {
  const activities = useUpcomingActivities(todayIsoDate())
  const items = flyer.agenda

  const setItems = (next: FlyerAgendaItem[]) => onChange({ agenda: next })

  const edit = (index: number, changes: Partial<FlyerAgendaItem>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...changes } : item)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [row] = next.splice(index, 1)
    next.splice(target, 0, row!)
    setItems(next)
  }

  function fill(range: 'week' | 'month') {
    const upcoming = activities.data ?? []
    onReplace(flyerFromAgenda(upcoming, { format: flyer.format, showLogo: flyer.showLogo }, range))
  }

  const empty = !activities.isPending && (activities.data?.length ?? 0) === 0

  return (
    <Group label="Actividades">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => fill('week')} disabled={activities.isPending || empty}>
          Traer la semana
        </Button>
        <Button onClick={() => fill('month')} disabled={activities.isPending || empty}>
          Traer el mes
        </Button>
      </div>
      {empty && <p className="text-xs text-coyote-ash">No hay actividades cargadas para traer.</p>}
      {activities.isError && <p className="text-xs text-coyote-ash">No se pudieron cargar las actividades.</p>}

      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-xl bg-coyote-black p-2.5 shadow-border">
            <Input
              value={item.when}
              maxLength={FLYER_AGENDA_LIMITS.when}
              onChange={(event) => edit(index, { when: event.target.value })}
              aria-label={`Cuándo, actividad ${index + 1}`}
              placeholder="Sáb 20/09 · 18:00"
            />
            <Input
              value={item.what}
              maxLength={FLYER_AGENDA_LIMITS.what}
              onChange={(event) => edit(index, { what: event.target.value })}
              aria-label={`Qué, actividad ${index + 1}`}
              placeholder="vs Onas Vóley"
            />
            <Input
              value={item.where}
              maxLength={FLYER_AGENDA_LIMITS.where}
              onChange={(event) => edit(index, { where: event.target.value })}
              aria-label={`Dónde, actividad ${index + 1}`}
              placeholder="Club Ciudad"
            />
            <div className="flex items-center gap-2">
              <OptionButton selected={item.highlight} onClick={() => edit(index, { highlight: !item.highlight })}>
                <CheckIcon className="size-4" strokeWidth={2} />
                Destacar
              </OptionButton>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Subir la actividad ${index + 1}`}
                className="ml-auto"
              >
                <ChevronRightIcon className="size-4 -rotate-90" strokeWidth={2} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Bajar la actividad ${index + 1}`}
              >
                <ChevronRightIcon className="size-4 rotate-90" strokeWidth={2} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
                aria-label={`Quitar la actividad ${index + 1}`}
              >
                <TrashIcon className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => setItems([...items, EMPTY_ROW])}
        disabled={items.length >= FLYER_MAX_AGENDA_ITEMS}
        className="pr-4 pl-3.5"
      >
        Agregar actividad
      </Button>
    </Group>
  )
}
