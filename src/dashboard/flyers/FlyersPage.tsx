import { useEffect, useRef, useState } from 'react'
import { FLYER_FORMAT_SIZES, FLYER_TEMPLATE_LABELS, type FlyerContent } from '@shared/flyers'
import { Button, Card, FormError, PageHeader } from '../ui'
import { BookmarkIcon, UndoIcon } from '../ui/icons'
import { AiPanel } from './AiPanel'
import { useImageLibrary } from './assetLibrary'
import { EditorPanel } from './EditorPanel'
import { ExportActions } from './ExportActions'
import { FlyerCanvas, useFlyerAssets } from './FlyerCanvas'
import { SavedPanel } from './SavedPanel'
import { useSavedFlyers } from './savedFlyers'
import { draftStore } from './templates'
import { TemplatesPanel } from './TemplatesPanel'

type Tab = 'templates' | 'saved' | 'editor' | 'ai'

const TAB_LABELS: Record<Tab, string> = {
  templates: 'Plantillas',
  saved: 'Guardados',
  editor: 'Editar',
  ai: 'IA',
}

/** Cambios que se pueden deshacer (plantillas y respuestas de la IA). */
const HISTORY_LIMIT = 20

/** Generador de flyers para Instagram: plantillas, editor manual y asistente de IA sobre el mismo borrador. */
export function FlyersPage() {
  const [flyer, setFlyer] = useState<FlyerContent>(draftStore.get)
  const [past, setPast] = useState<FlyerContent[]>([])
  const [tab, setTab] = useState<Tab>('templates')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const library = useImageLibrary()
  const saved = useSavedFlyers()
  const { assets, ready } = useFlyerAssets(photoUrl, library.images)
  // Las miniaturas de Guardados no llevan la foto de fondo (no se guarda).
  const { assets: savedAssets } = useFlyerAssets(null, library.images)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Último borrador confirmado: la respuesta de la IA puede llegar después de otras ediciones.
  const latest = useRef(flyer)
  useEffect(() => {
    latest.current = flyer
    draftStore.set(flyer)
  }, [flyer])

  // La URL local de la foto se libera al cambiarla o al salir de la sección.
  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl])

  const edit = (changes: Partial<FlyerContent>) => setFlyer((prev) => ({ ...prev, ...changes }))

  function replace(next: FlyerContent) {
    setPast((prev) => [...prev.slice(-(HISTORY_LIMIT - 1)), latest.current])
    setFlyer(next)
  }

  function undo() {
    const previous = past.at(-1)
    if (!previous) return
    setPast((prev) => prev.slice(0, -1))
    setFlyer(previous)
  }

  /** Al borrar una imagen de la biblioteca, el flyer abierto deja de usarla. */
  function removeImage(id: string) {
    setFlyer((prev) => ({
      ...prev,
      opponentLogo: prev.opponentLogo === id ? '' : prev.opponentLogo,
      logos: prev.logos.filter((logo) => logo !== id),
    }))
  }

  const size = FLYER_FORMAT_SIZES[flyer.format]
  const isSaved = saved.isSaved(flyer)

  return (
    <section>
      <PageHeader
        title="Flyers"
        description="Posteos para Instagram con los colores de la manada."
        actions={
          <>
            <Button
              variant="ghost"
              onClick={undo}
              disabled={past.length === 0}
              aria-label="Deshacer"
              className="px-3 sm:pr-4 sm:pl-3.5"
            >
              <UndoIcon className="size-4" strokeWidth={2} />
              <span className="hidden sm:inline">Deshacer</span>
            </Button>
            <Button
              onClick={() => saved.save(flyer, 'manual', flyer.title)}
              disabled={isSaved}
              aria-label={isSaved ? 'Guardado' : 'Guardar'}
              className="px-3 sm:pr-4 sm:pl-3.5"
            >
              <BookmarkIcon className="size-4" strokeWidth={2} filled={isSaved} />
              <span className="hidden sm:inline">{isSaved ? 'Guardado' : 'Guardar'}</span>
            </Button>
            <ExportActions canvasRef={canvasRef} flyer={flyer} disabled={!ready} />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start lg:gap-8">
        <Card className="flex flex-col items-center gap-3 p-3 md:p-5 lg:sticky lg:top-8">
          <FlyerCanvas
            ref={canvasRef}
            flyer={flyer}
            assets={assets}
            ready={ready}
            label={`Vista previa del flyer: ${flyer.title || FLYER_TEMPLATE_LABELS[flyer.template]}`}
            className="block h-auto max-h-[55dvh] w-auto max-w-full rounded-lg shadow-border lg:max-h-[calc(100dvh-14rem)]"
          />
          <p className="text-xs text-coyote-ash tabular-nums">
            {FLYER_TEMPLATE_LABELS[flyer.template]} · {size.label} · {size.width}×{size.height} px
          </p>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <TabSwitch value={tab} onChange={setTab} savedCount={saved.items.length} />
          {saved.error && tab !== 'saved' && <FormError>{saved.error}</FormError>}
          {tab === 'templates' && <TemplatesPanel flyer={flyer} onApply={replace} />}
          {tab === 'saved' && (
            <SavedPanel saved={saved} current={flyer} assets={savedAssets} ready={ready} onOpen={replace} />
          )}
          {tab === 'editor' && (
            <EditorPanel
              flyer={flyer}
              onChange={edit}
              photoUrl={photoUrl}
              onPhotoChange={setPhotoUrl}
              library={library}
              onRemoveImage={removeImage}
            />
          )}
          {/* Se mantiene montado para no perder el pedido ni la última respuesta al cambiar de pestaña. */}
          <div hidden={tab !== 'ai'}>
            <AiPanel
              flyer={flyer}
              onApply={replace}
              canUndo={past.length > 0}
              onUndo={undo}
              library={library}
              onRemoveImage={removeImage}
              onSave={(result, prompt) => saved.save(result, 'ia', prompt)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function TabSwitch({ value, onChange, savedCount }: { value: Tab; onChange: (tab: Tab) => void; savedCount: number }) {
  return (
    // Radio exterior 12 px = interior 8 px + 4 px de padding
    <div role="tablist" aria-label="Herramientas" className="grid grid-cols-4 gap-1 rounded-xl bg-coyote-black p-1 shadow-border">
      {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
        const selected = tab === value
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab)}
            className={[
              'flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-medium select-none md:min-h-10',
              'transition-[background-color,color] duration-150 ease-out',
              selected ? 'bg-coyote-ember text-coyote-gold' : 'text-coyote-ash hover:text-coyote-silver',
            ].join(' ')}
          >
            {TAB_LABELS[tab]}
            {tab === 'saved' && savedCount > 0 && (
              <span className="hidden text-xs text-coyote-ash tabular-nums sm:inline">{savedCount}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
