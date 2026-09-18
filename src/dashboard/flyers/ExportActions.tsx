import { useState, type RefObject } from 'react'
import type { FlyerContent } from '@shared/flyers'
import { canShareFiles, downloadFile, fileSlug, shareFile } from '@/lib/shareImage'
import { errorMessage } from '../admin/adminApi'
import { canvasToBlob } from './render'

function fileName(flyer: FlyerContent): string {
  return `coyotes-${fileSlug(flyer.title || flyer.template) || 'flyer'}.png`
}

/**
 * Exportar el flyer: descarga el PNG y, en móviles que lo admiten, lo comparte directo (p.ej. a Instagram).
 * Es un hook y no un componente porque las mismas acciones se pintan como botones en escritorio y como
 * opciones del menú en móvil.
 */
export function useExportActions(canvasRef: RefObject<HTMLCanvasElement | null>, flyer: FlyerContent) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toFile(): Promise<File | null> {
    const canvas = canvasRef.current
    if (!canvas) return null
    const blob = await canvasToBlob(canvas)
    return new File([blob], fileName(flyer), { type: 'image/png' })
  }

  async function run(action: (file: File) => Promise<unknown> | void) {
    setBusy(true)
    setError(null)
    try {
      const file = await toFile()
      // Cerrar la hoja de compartir no es un error (shareFile devuelve false).
      if (file) await action(file)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return {
    busy,
    error,
    canShare: canShareFiles(),
    download: () => void run(downloadFile),
    share: () => void run(shareFile),
  }
}
