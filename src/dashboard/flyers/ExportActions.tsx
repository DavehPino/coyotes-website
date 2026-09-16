import { useEffect, useRef, useState, type RefObject } from 'react'
import type { FlyerContent } from '@shared/flyers'
import { errorMessage } from '../admin/adminApi'
import { Button } from '../ui'
import { DownloadIcon, ShareIcon } from '../ui/icons'
import { canvasToBlob } from './render'

type ExportActionsProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  flyer: FlyerContent
  /** Pie de foto del posteo: se copia al portapapeles al compartir. */
  caption?: string
  disabled: boolean
}

function fileName(flyer: FlyerContent): string {
  const slug = (flyer.title || flyer.template)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `coyotes-${slug || 'flyer'}.png`
}

/** Descarga el PNG y, en móviles que lo admiten, lo comparte directo (p.ej. a Instagram). */
export function ExportActions({ canvasRef, flyer, caption = '', disabled }: ExportActionsProps) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([''], 'flyer.png', { type: 'image/png' })] })

  async function toFile(): Promise<File | null> {
    const canvas = canvasRef.current
    if (!canvas) return null
    const blob = await canvasToBlob(canvas)
    return new File([blob], fileName(flyer), { type: 'image/png' })
  }

  async function download() {
    setBusy(true)
    try {
      const file = await toFile()
      if (!file) return
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      window.alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function share() {
    setBusy(true)
    try {
      // Lo primero, antes de dibujar el PNG: Safari solo deja escribir en el portapapeles mientras
      // el gesto del usuario sigue vigente, y cualquier espera lo invalida. Instagram descarta el
      // texto al recibir una imagen, así que el pie de foto viaja por el portapapeles y se pega a mano.
      if (caption) {
        const ok = await navigator.clipboard?.writeText(caption).then(() => true, () => false)
        if (ok) {
          setCopied(true)
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(() => setCopied(false), 3000)
        }
      }
      const file = await toFile()
      if (!file) return
      const data = caption && navigator.canShare?.({ files: [file], text: caption })
        ? { files: [file], text: caption }
        : { files: [file] }
      await navigator.share(data)
    } catch (err) {
      // Cerrar la hoja de compartir no es un error.
      if (!(err instanceof DOMException && err.name === 'AbortError')) window.alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {canShareFiles && (
        <Button onClick={share} disabled={disabled || busy} className="pr-4 pl-3.5">
          <ShareIcon className="size-4" strokeWidth={2} />
          {copied ? 'Pie copiado' : 'Compartir'}
        </Button>
      )}
      <Button variant="primary" onClick={download} disabled={disabled || busy} className="pr-4 pl-3.5">
        <DownloadIcon className="size-4" strokeWidth={2} />
        Descargar
      </Button>
    </>
  )
}
