// Flyers guardados en el bucket (assets/flyers/): el PNG exportado y su contenido editable. Los de la IA se
// guardan solos al generarse; el resto con el botón Guardar. Son copias: editar uno abierto no cambia el guardado.
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { SAVED_FLYER_LABEL_MAX, type FlyerContent, type FlyerLibrary, type SavedFlyer } from '@shared/flyers'
import { errorMessage } from '../admin/adminApi'
import { flyerLibraryKey, flyersPost, uploadToBucket, useFlyerLibrary } from './api'
import type { RunProtected } from './assetLibrary'
import { renderFlyerBlob, type FlyerAssets } from './render'

export type { SavedFlyer }

/**
 * Copia con las claves ordenadas en todos los niveles. No sirve `JSON.stringify(flyer, claves)`: ese segundo
 * argumento filtra propiedades de forma recursiva, así que los objetos anidados saldrían vacíos.
 */
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(source).sort().map((key) => [key, stable(source[key])]))
  }
  return value
}

/** Igualdad por contenido, sin depender del orden de las claves. */
const fingerprint = (flyer: FlyerContent) => JSON.stringify(stable(flyer))
export const sameFlyer = (a: FlyerContent, b: FlyerContent) => fingerprint(a) === fingerprint(b)

export function useSavedFlyers(run: RunProtected) {
  const queryClient = useQueryClient()
  const query = useFlyerLibrary()
  const items = query.data?.flyers ?? []
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (update: (flyers: SavedFlyer[]) => SavedFlyer[]) =>
    queryClient.setQueryData<FlyerLibrary>(flyerLibraryKey, (prev) => prev && { ...prev, flyers: update(prev.flyers) })

  const isSaved = (flyer: FlyerContent) => items.some((item) => sameFlyer(item.flyer, flyer))

  return {
    items,
    loading: query.isPending,
    loadError: query.error ? errorMessage(query.error) : null,
    saving,
    error,
    isSaved,
    /**
     * Sube el PNG (dibujado con `assets`) y registra el flyer. Si ya hay uno idéntico no hace nada.
     * Devuelve false si falló o se canceló la palabra clave.
     */
    async save(flyer: FlyerContent, source: SavedFlyer['source'], label: string, assets: FlyerAssets): Promise<boolean> {
      if (isSaved(flyer)) return true
      setSaving(true)
      setError(null)
      try {
        const saved = await run(async (safeword) => {
          const png = await renderFlyerBlob(flyer, assets)
          const id = await uploadToBucket({ kind: 'flyer', contentType: 'image/png' }, png, safeword)
          const body = { id, source, label: label.trim().slice(0, SAVED_FLYER_LABEL_MAX), flyer }
          return flyersPost<SavedFlyer>('flyer-save', body, safeword)
        })
        if (saved) patch((prev) => [saved, ...prev])
        return saved !== undefined
      } catch (err) {
        setError(`No se pudo guardar el flyer: ${errorMessage(err)}`)
        return false
      } finally {
        setSaving(false)
      }
    },
    async remove(id: string) {
      setError(null)
      try {
        const done = await run((safeword) => flyersPost('flyer-delete', { id }, safeword))
        if (done) patch((prev) => prev.filter((item) => item.id !== id))
      } catch (err) {
        setError(`No se pudo borrar el flyer: ${errorMessage(err)}`)
      }
    },
  }
}

export type SavedFlyers = ReturnType<typeof useSavedFlyers>
