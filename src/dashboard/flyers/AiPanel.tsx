import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { todayIsoDate } from '@shared/dates'
import { FLYER_PROMPT_MAX, type FlyerContent, type FlyerSuggestion } from '@shared/flyers'
import { adminPost, errorMessage, isAbort, isUnauthorized, safewordStore } from '../admin/adminApi'
import { SafewordStep } from '../admin/SafewordStep'
import { Button, Card, Field, FormError, Textarea } from '../ui'
import { SparklesIcon, UndoIcon } from '../ui/icons'
import { toAssetRefs, type ImageLibrary } from './assetLibrary'
import { ImageLibraryManager } from './ImageLibrary'

const EXAMPLE_PROMPTS = [
  'Armá el flyer del próximo partido de Liga Podio con fecha, hora y lugar',
  'Ganamos 3 a 1 contra Onas (25-20, 22-25, 25-18, 25-21): flyer del resultado',
  'Convocatoria para sumar jugadoras y jugadores nuevos, tono amigable',
  'Recordatorio del entrenamiento del jueves a las 20 hs, que motive',
  'Hacelo más corto y con más garra',
  'Pasalo a formato historia con los colores de Liga Podio',
  'Poné el logo del rival al lado del nuestro',
]

type AiPanelProps = {
  flyer: FlyerContent
  onApply: (flyer: FlyerContent) => void
  canUndo: boolean
  onUndo: () => void
  library: ImageLibrary
  onRemoveImage: (id: string) => void
  /** Guarda el resultado en Guardados para poder volver a él. */
  onSave: (flyer: FlyerContent, prompt: string) => void
}

type Reply = { message: string; model: string }

/** Asistente de IA: reescribe el flyer actual según un pedido en lenguaje natural. */
export function AiPanel({ flyer, onApply, canUndo, onUndo, library, onRemoveImage, onSave }: AiPanelProps) {
  const formId = useId()
  const safewordFormId = useId()
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState<Reply | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    const text = prompt.trim()
    if (!text || loading || !safeword) return

    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const suggestion = await adminPost<FlyerSuggestion>(
        '/flyer-suggest',
        { prompt: text, flyer, today: todayIsoDate(), assets: toAssetRefs(library.images) },
        safeword,
        controller.signal,
      )
      onApply(suggestion.flyer)
      onSave(suggestion.flyer, text)
      setReply({ message: suggestion.message, model: suggestion.model })
      setPrompt('')
    } catch (err) {
      if (isAbort(err)) return
      if (isUnauthorized(err)) {
        safewordStore.clear()
        setSafeword(null)
        setNotice('La palabra clave ya no es válida. Escríbela de nuevo para usar el asistente.')
      } else {
        setError(errorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!safeword) {
    return (
      <Card className="flex flex-col gap-4 p-4">
        <SafewordStep
          formId={safewordFormId}
          notice={notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            safewordStore.set(value)
            setSafeword(value)
            setNotice(null)
          }}
        />
        <Button type="submit" form={safewordFormId} variant="primary" disabled={verifying} className="self-end">
          {verifying ? 'Comprobando…' : 'Continuar'}
        </Button>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <Field
          label="¿Qué flyer necesitas?"
          hint="La IA conoce las próximas actividades del equipo y parte del flyer que ves en pantalla."
        >
          <Textarea
            ref={promptRef}
            rows={4}
            value={prompt}
            maxLength={FLYER_PROMPT_MAX}
            disabled={loading}
            placeholder="Ej.: flyer para el partido del sábado contra Onas, que se note que es una final"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void handleSubmit()
            }}
          />
        </Field>
        <Button type="submit" variant="primary" disabled={loading || !prompt.trim()} className="self-end pr-4 pl-3.5">
          <SparklesIcon className="size-4" strokeWidth={2} />
          {loading ? 'Generando…' : 'Generar con IA'}
        </Button>
      </form>

      {error && <FormError>{error}</FormError>}

      {reply && !loading && (
        <Card className="flex items-start gap-3 p-3" aria-live="polite">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-coyote-ember text-coyote-gold">
            <SparklesIcon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm text-coyote-silver">{reply.message}</p>
            <p className="truncate text-xs text-coyote-ash">Guardado en Guardados · {reply.model}</p>
          </div>
          {canUndo && (
            <Button variant="ghost" size="sm" onClick={onUndo}>
              <UndoIcon className="size-4" />
              Deshacer
            </Button>
          )}
        </Card>
      )}

      <details className="group rounded-xl bg-coyote-night p-3 shadow-border" open={library.images.length > 0}>
        <summary className="flex min-h-8 cursor-pointer items-center justify-between gap-2 text-sm font-medium text-coyote-silver select-none">
          Imágenes para la IA
          <span className="text-xs font-normal text-coyote-ash tabular-nums">
            {library.images.length > 0 ? `${library.images.length} disponibles` : 'Logos de rivales, auspiciantes…'}
          </span>
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-coyote-ash">
            La IA no ve las imágenes: recibe su nombre y decide dónde van (junto a nuestro escudo si es el rival, o en la
            fila de logos). Nómbralas como el equipo, p.ej. «Onas Vóley».
          </p>
          <ImageLibraryManager library={library} onRemove={onRemoveImage} />
        </div>
      </details>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-coyote-ash uppercase">Ideas para pedir</p>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <li key={example}>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setPrompt(example)
                  promptRef.current?.focus()
                }}
                className="min-h-11 rounded-lg bg-coyote-black px-3 py-2 text-left text-sm text-coyote-ash shadow-border transition-[color,box-shadow] duration-150 ease-out select-none hover:text-coyote-silver hover:shadow-border-hover disabled:opacity-50 md:min-h-10"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
