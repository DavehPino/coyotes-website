import { FLYER_TEMPLATE_LABELS, type FlyerContent } from '@shared/flyers'
import { Button, Chip, EmptyState, FormError } from '../ui'
import { BookmarkIcon, TrashIcon } from '../ui/icons'
import type { FlyerAssets } from './render'
import { FlyerCanvas } from './FlyerCanvas'
import { SAVED_LIMIT, sameFlyer, type SavedFlyers } from './savedFlyers'

type SavedPanelProps = {
  saved: SavedFlyers
  current: FlyerContent
  assets: FlyerAssets
  ready: boolean
  onOpen: (flyer: FlyerContent) => void
}

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Flyers guardados en este navegador: los de la IA se guardan solos; los demás, con Guardar. */
export function SavedPanel({ saved, current, assets, ready, onOpen }: SavedPanelProps) {
  if (saved.items.length === 0) {
    return (
      <EmptyState
        icon={<BookmarkIcon className="size-8" />}
        title="Todavía no hay flyers guardados"
        description="Los que genere la IA se guardan solos. Para guardar uno propio, usa Guardar arriba."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-coyote-ash">
        Se guardan en este navegador (hasta {SAVED_LIMIT}). Abrir uno no lo modifica: los cambios quedan en el borrador.
      </p>
      {saved.error && <FormError>{saved.error}</FormError>}
      <ul className="grid grid-cols-2 gap-3">
        {saved.items.map((item) => {
          const isCurrent = sameFlyer(item.flyer, current)
          const title = item.flyer.title || FLYER_TEMPLATE_LABELS[item.flyer.template]
          return (
            <li
              key={item.id}
              className={[
                'flex flex-col gap-2 rounded-xl bg-coyote-night p-2',
                isCurrent ? 'shadow-gold-strong' : 'shadow-border',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onOpen(item.flyer)}
                aria-label={`Abrir ${title}`}
                className="rounded-lg transition-[scale] duration-150 ease-out active:scale-[0.98]"
              >
                <FlyerCanvas
                  flyer={item.flyer}
                  assets={assets}
                  ready={ready}
                  pixelRatio={0.2}
                  label={title}
                  className="mx-auto block h-auto max-h-56 w-auto max-w-full rounded-lg"
                />
              </button>
              <div className="flex items-start gap-1 px-1 pb-1">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <Chip tone={item.source === 'ia' ? 'gold' : 'ash'}>{item.source === 'ia' ? 'IA' : 'Manual'}</Chip>
                    <span className="truncate text-xs text-coyote-ash tabular-nums">{dateFormat.format(item.savedAt)}</span>
                  </span>
                  <span className="line-clamp-2 text-sm text-coyote-silver" title={item.label || title}>
                    {item.label || title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Borrar ${title}`}
                  onClick={() => saved.remove(item.id)}
                  className="-mt-1 -mr-1"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
