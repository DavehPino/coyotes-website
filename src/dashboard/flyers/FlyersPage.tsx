import { useEffect, useRef, useState } from 'react'
import { FLYER_FORMAT_SIZES, FLYER_TEMPLATE_LABELS, type FlyerContent } from '@shared/flyers'
import { ActionMenu, Button, Card, FormError, PageHeader, TabList, TabPanel, Tabs, type TabItem } from '../ui'
import { BookmarkIcon, DownloadIcon, ShareIcon, UndoIcon } from '../ui/icons'
import { useFlyersAccess } from './access'
import { AiPanel } from './AiPanel'
import { useImageLibrary } from './assetLibrary'
import { EditorPanel } from './EditorPanel'
import { useExportActions } from './ExportActions'
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
  const access = useFlyersAccess()
  const library = useImageLibrary(access.run)
  const saved = useSavedFlyers(access.run)
  const { assets, ready, failedImages } = useFlyerAssets(photoUrl, library.images)
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
  const exporter = useExportActions(canvasRef, flyer)
  // Pestañas en las que se cambia el flyer: en móvil conviene tener la vista previa a la vista.
  const editing = tab === 'editor' || tab === 'ai'
  const exportDisabled = !ready || exporter.busy
  const saveDisabled = isSaved || saved.saving || saved.loading || !ready
  const saveLabel = saved.saving ? 'Guardando…' : isSaved ? 'Guardado' : 'Guardar'
  const save = () => void saved.save(flyer, 'manual', flyer.title, assets)

  return (
    <section>
      <PageHeader
        title="Flyers"
        description="Posteos para Instagram con los colores del club."
        actions={
          <>
            {/* Deshacer siempre a mano; el resto, botones en escritorio y un menú en móvil. */}
            <Button variant="ghost" onClick={undo} disabled={past.length === 0} className="pr-4 pl-3.5">
              <UndoIcon className="size-4" strokeWidth={2} />
              Deshacer
            </Button>
            <div className="hidden items-center gap-2 md:flex">
              <Button onClick={save} disabled={saveDisabled} className="pr-4 pl-3.5">
                <BookmarkIcon className="size-4" strokeWidth={2} filled={isSaved} />
                {saveLabel}
              </Button>
              {exporter.canShare && (
                <Button onClick={exporter.share} disabled={exportDisabled} className="pr-4 pl-3.5">
                  <ShareIcon className="size-4" strokeWidth={2} />
                  Compartir
                </Button>
              )}
              <Button variant="primary" onClick={exporter.download} disabled={exportDisabled} className="pr-4 pl-3.5">
                <DownloadIcon className="size-4" strokeWidth={2} />
                Descargar
              </Button>
            </div>
            <ActionMenu
              label="Acciones"
              className="md:hidden"
              items={[
                { label: 'Descargar', icon: <DownloadIcon className="size-5" strokeWidth={2} />, disabled: exportDisabled, onSelect: exporter.download },
                ...(exporter.canShare
                  ? [{ label: 'Compartir', icon: <ShareIcon className="size-5" strokeWidth={2} />, disabled: exportDisabled, onSelect: exporter.share }]
                  : []),
                { label: saveLabel, icon: <BookmarkIcon className="size-5" strokeWidth={2} filled={isSaved} />, disabled: saveDisabled, onSelect: save },
              ]}
            />
            {exporter.error && <FormError className="w-full">{exporter.error}</FormError>}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start lg:gap-8">
        {/* En móvil, al editar o pedir a la IA, la vista previa queda fija arriba en pequeño para ver el resultado. */}
        <Card
          className={[
            'flex flex-col items-center gap-3 p-3 md:p-5 lg:sticky lg:top-8',
            editing ? 'max-lg:sticky max-lg:top-0 max-lg:z-10 max-lg:-mx-4 max-lg:rounded-none max-lg:bg-paper max-lg:py-2' : '',
          ].join(' ')}
        >
          <FlyerCanvas
            ref={canvasRef}
            flyer={flyer}
            assets={assets}
            ready={ready}
            label={`Vista previa del flyer: ${flyer.title || FLYER_TEMPLATE_LABELS[flyer.template]}`}
            className={[
              'block h-auto w-auto max-w-full rounded-sm shadow-outline lg:max-h-[calc(100svh-14rem)]',
              editing ? 'max-h-[32svh]' : 'max-h-[55svh]',
            ].join(' ')}
          />
          <p className={`text-xs text-ink-soft tabular-nums ${editing ? 'max-lg:hidden' : ''}`}>
            {FLYER_TEMPLATE_LABELS[flyer.template]} · {size.label} · {size.width}×{size.height} px
          </p>
          {failedImages > 0 && (
            <FormError>
              No se pudieron dibujar {failedImages === 1 ? '1 imagen' : `${failedImages} imágenes`} del bucket. Revisa
              que el CORS del bucket permita GET desde este dominio (README → Bucket).
            </FormError>
          )}
        </Card>

        <Tabs value={tab} onChange={setTab}>
          <div className="flex min-w-0 flex-col gap-4">
            <TabSwitch savedCount={saved.items.length} />
            {saved.error && tab !== 'saved' && <FormError>{saved.error}</FormError>}
            {tab === 'templates' && (
              <TabPanel value="templates">
                <TemplatesPanel flyer={flyer} onApply={replace} />
              </TabPanel>
            )}
            {tab === 'saved' && (
              <TabPanel value="saved">
                <SavedPanel saved={saved} current={flyer} onOpen={replace} />
              </TabPanel>
            )}
            {tab === 'editor' && (
              <TabPanel value="editor">
                <EditorPanel
                  flyer={flyer}
                  onChange={edit}
                  photoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                  library={library}
                  onRemoveImage={removeImage}
                />
              </TabPanel>
            )}
            {/* Se mantiene montado para no perder el pedido ni la última respuesta al cambiar de pestaña. */}
            <TabPanel value="ai" hidden={tab !== 'ai'}>
              <AiPanel
                flyer={flyer}
                onApply={replace}
                canUndo={past.length > 0}
                onUndo={undo}
                library={library}
                onRemoveImage={removeImage}
                onSave={(result, prompt) => saved.save(result, 'ia', prompt, assets)}
                run={access.run}
              />
            </TabPanel>
          </div>
        </Tabs>
      </div>
      {access.dialog}
    </section>
  )
}

function TabSwitch({ savedCount }: { savedCount: number }) {
  const items: TabItem<Tab>[] = (Object.keys(TAB_LABELS) as Tab[]).map((tab) => ({
    value: tab,
    children: (
      <>
        {TAB_LABELS[tab]}
        {tab === 'saved' && savedCount > 0 && (
          <span className="hidden text-xs text-ink-soft tabular-nums sm:inline">{savedCount}</span>
        )}
      </>
    ),
  }))
  return (
    // Radio exterior 12 px = interior 8 px + 4 px de padding
    <TabList
      label="Herramientas"
      items={items}
      className="grid grid-cols-4 gap-1 rounded-md bg-surface/40 p-1 shadow-outline"
      tabClassName="gap-1.5 px-1 text-xs tracking-normal sm:text-sm sm:tracking-wide"
    />
  )
}
