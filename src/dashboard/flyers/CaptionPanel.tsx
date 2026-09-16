// Pie de foto del posteo, junto a la vista previa: acompaña siempre al flyer que se ve.
// El texto base se arma sin IA; el asistente solo lo reescribe cuando se lo pide el usuario.
import { useEffect, useRef, useState } from 'react'
import {
  FLYER_CAPTION_MAX,
  FLYER_CAPTION_TONE_LABELS,
  FLYER_CAPTION_TONES,
  type FlyerCaptionTone,
} from '@shared/flyers'
import { errorMessage } from '../admin/adminApi'
import { Button, FormError, Select, Textarea } from '../ui'
import { CopyIcon, SparklesIcon } from '../ui/icons'

type CaptionPanelProps = {
  value: string
  onChange: (value: string) => void
  /** El flyer cambió desde que se armó este texto. */
  stale: boolean
  onRegenerate: () => void
  /** Pide al asistente que lo reescriba. Devuelve sin cambios si se cancela la palabra clave. */
  onImprove: (tone: FlyerCaptionTone) => Promise<void>
}

export function CaptionPanel({ value, onChange, stale, onRegenerate, onImprove }: CaptionPanelProps) {
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState<FlyerCaptionTone>('festejo')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): el texto se puede seleccionar a mano.
      setCopied(false)
    }
  }

  async function improve() {
    setBusy(true)
    setError(null)
    try {
      await onImprove(tone)
    } catch (err) {
      // El texto local se conserva: el asistente es un extra, no el que lo escribe.
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="group rounded-xl bg-coyote-night p-3 shadow-border">
      <summary className="flex min-h-8 cursor-pointer items-center justify-between gap-2 text-sm font-medium text-coyote-silver select-none">
        Pie de foto para Instagram
        <span className="text-xs font-normal text-coyote-ash tabular-nums">
          {stale ? 'El flyer cambió' : value ? `${value.length}/${FLYER_CAPTION_MAX}` : 'Texto del posteo'}
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <Textarea
          rows={6}
          maxLength={FLYER_CAPTION_MAX}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Pie de foto para Instagram"
          placeholder="El texto del posteo. Compartir lo copia solo."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void copy()} disabled={!value || busy} className="pr-4 pl-3.5">
            <CopyIcon className="size-4" strokeWidth={2} />
            {copied ? '¡Copiado!' : 'Copiar'}
          </Button>
          {(stale || !value) && (
            <Button variant="ghost" onClick={onRegenerate} disabled={busy}>
              {value ? 'Regenerar' : 'Escribir uno'}
            </Button>
          )}
          <Select
            value={tone}
            onChange={(event) => setTone(event.target.value as FlyerCaptionTone)}
            aria-label="Tono del pie de foto"
            className="ml-auto w-auto"
            disabled={busy}
          >
            {FLYER_CAPTION_TONES.map((option) => (
              <option key={option} value={option}>
                {FLYER_CAPTION_TONE_LABELS[option]}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={() => void improve()} disabled={busy} className="pr-4 pl-3.5">
            <SparklesIcon className="size-4" strokeWidth={2} />
            {busy ? 'Escribiendo…' : 'Mejorar con IA'}
          </Button>
        </div>
        {error && <FormError>{error}</FormError>}
      </div>
    </details>
  )
}
