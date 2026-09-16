// Pie de foto del posteo, junto a la vista previa: acompaña siempre al flyer que se ve.
import { useEffect, useRef, useState } from 'react'
import { Button, Textarea } from '../ui'
import { CopyIcon } from '../ui/icons'
import { CAPTION_MAX } from './caption'

type CaptionPanelProps = {
  value: string
  onChange: (value: string) => void
  /** El flyer cambió desde que se armó este texto. */
  stale: boolean
  onRegenerate: () => void
}

export function CaptionPanel({ value, onChange, stale, onRegenerate }: CaptionPanelProps) {
  const [copied, setCopied] = useState(false)
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

  return (
    <details className="group rounded-xl bg-coyote-night p-3 shadow-border">
      <summary className="flex min-h-8 cursor-pointer items-center justify-between gap-2 text-sm font-medium text-coyote-silver select-none">
        Pie de foto para Instagram
        <span className="text-xs font-normal text-coyote-ash tabular-nums">
          {stale ? 'El flyer cambió' : value ? `${value.length}/${CAPTION_MAX}` : 'Texto del posteo'}
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <Textarea
          rows={6}
          maxLength={CAPTION_MAX}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Pie de foto para Instagram"
          placeholder="El texto del posteo. Compartir lo copia solo."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void copy()} disabled={!value} className="pr-4 pl-3.5">
            <CopyIcon className="size-4" strokeWidth={2} />
            {copied ? '¡Copiado!' : 'Copiar'}
          </Button>
          {(stale || !value) && (
            <Button variant="ghost" onClick={onRegenerate}>
              {value ? 'Regenerar' : 'Escribir uno'}
            </Button>
          )}
        </div>
      </div>
    </details>
  )
}
