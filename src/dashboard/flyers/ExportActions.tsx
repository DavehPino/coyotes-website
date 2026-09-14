import { useState, type RefObject } from 'react'
import type { FlyerContent } from '@shared/flyers'
import { errorMessage } from '../admin/adminApi'
import { Button } from '../ui'
import { DownloadIcon, ShareIcon } from '../ui/icons'
import { canvasToBlob } from './render'

type ExportActionsProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  flyer: FlyerContent
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
export function ExportActions({ canvasRef, flyer, disabled }: ExportActionsProps) {
  const [busy, setBusy] = useState(false)
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
      const file = await toFile()
      if (file) await navigator.share({ files: [file] })
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
          Compartir
        </Button>
      )}
      <Button variant="primary" onClick={download} disabled={disabled || busy} className="pr-4 pl-3.5">
        <DownloadIcon className="size-4" strokeWidth={2} />
        Descargar
      </Button>
    </>
  )
}
