import { useState, type RefObject } from 'react'
import type { FlyerContent } from '@shared/flyers'
import { canShareFiles, downloadFile, fileSlug, shareFile } from '@/lib/shareImage'
import { errorMessage } from '../admin/adminApi'
import { Button, FormError } from '../ui'
import { DownloadIcon, ShareIcon } from '../ui/icons'
import { canvasToBlob } from './render'

type ExportActionsProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  flyer: FlyerContent
  disabled: boolean
}

function fileName(flyer: FlyerContent): string {
  return `coyotes-${fileSlug(flyer.title || flyer.template) || 'flyer'}.png`
}

/** Descarga el PNG y, en móviles que lo admiten, lo comparte directo (p.ej. a Instagram). */
export function ExportActions({ canvasRef, flyer, disabled }: ExportActionsProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canShare = canShareFiles()

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
      if (file) downloadFile(file)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function share() {
    setBusy(true)
    try {
      const file = await toFile()
      // Cerrar la hoja de compartir no es un error (shareFile devuelve false).
      if (file) await shareFile(file)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {canShare && (
        <Button onClick={share} disabled={disabled || busy} className="pr-4 pl-3.5">
          <ShareIcon className="size-4" strokeWidth={2} />
          Compartir
        </Button>
      )}
      <Button variant="primary" onClick={download} disabled={disabled || busy} className="pr-4 pl-3.5">
        <DownloadIcon className="size-4" strokeWidth={2} />
        Descargar
      </Button>
      {error && <FormError className="w-full">{error}</FormError>}
    </>
  )
}
