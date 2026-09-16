// Compartir o descargar una imagen generada en el navegador (Flyers y Alineación).

/** true si el navegador puede compartir archivos con la hoja nativa (sobre todo móviles). */
export function canShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([''], 'imagen.png', { type: 'image/png' })] })
  )
}

/**
 * Abre la hoja nativa de compartir con el archivo. Cerrarla sin elegir destino no es un error:
 * devuelve false en ese caso.
 */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file] })
    return true
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return false
    throw err
  }
}

/** Descarga el archivo con su nombre. */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** "vs Onas (2)" → "vs-onas-2": para nombres de archivo. */
export function fileSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
