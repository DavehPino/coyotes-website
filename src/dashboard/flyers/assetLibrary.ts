// Imágenes del generador (logos de rivales, auspiciantes...) guardadas en el bucket, en assets/images/. Se reducen
// en el navegador antes de subirlas; a la IA solo le llega su id y el nombre, nunca la imagen.
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  FLYER_ASSET_NAME_MAX,
  FLYER_IMAGE_TYPES,
  FLYER_MAX_ASSETS,
  type FlyerAssetRef,
  type FlyerImage,
  type FlyerImageType,
  type FlyerLibrary,
} from '@shared/flyers'
import { errorMessage } from '../admin/adminApi'
import { flyerLibraryKey, flyersPost, uploadToBucket, useFlyerLibrary } from './api'

export type { FlyerImage }

/** Ejecuta una acción protegida (ver access.tsx). */
export type RunProtected = <T>(action: (safeword: string) => Promise<T>) => Promise<T | undefined>

/** Lado mayor tras reducir: sobra para un logo en un flyer de 1080 px. */
const MAX_SIDE = 512

/** "logo-onas_voley.png" → "Logo onas voley" */
function nameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  const name = base.charAt(0).toUpperCase() + base.slice(1)
  return (name || 'Imagen').slice(0, FLYER_ASSET_NAME_MAX)
}

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9))

/** Reduce la imagen a MAX_SIDE conservando la transparencia (WebP; PNG donde el navegador no codifica WebP). */
async function shrink(file: File): Promise<{ blob: Blob; type: FlyerImageType }> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const width = image.naturalWidth || MAX_SIDE
    const height = image.naturalHeight || MAX_SIDE
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const type of FLYER_IMAGE_TYPES) {
      const blob = await toBlob(canvas, type)
      if (blob?.type === type) return { blob, type }
    }
  } catch {
    // Formato que el navegador no decodifica: mensaje abajo.
  } finally {
    URL.revokeObjectURL(url)
  }
  throw new Error(`No se pudo leer "${file.name}". Prueba con un PNG, JPG o WebP.`)
}

export function useImageLibrary(run: RunProtected) {
  const queryClient = useQueryClient()
  const query = useFlyerLibrary()
  const images = query.data?.images ?? []
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (update: (images: FlyerImage[]) => FlyerImage[]) =>
    queryClient.setQueryData<FlyerLibrary>(flyerLibraryKey, (prev) => prev && { ...prev, images: update(prev.images) })

  async function guarded(action: (safeword: string) => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await run(action)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return {
    images,
    loading: query.isPending,
    loadError: query.error ? errorMessage(query.error) : null,
    busy,
    error,
    add(files: FileList | File[]) {
      const list = Array.from(files).filter((file) => file.type.startsWith('image/'))
      const room = FLYER_MAX_ASSETS - images.length
      if (list.length === 0) return
      if (room <= 0) {
        setError(`Máximo ${FLYER_MAX_ASSETS} imágenes. Borra alguna para subir otra.`)
        return
      }
      return guarded(async (safeword) => {
        for (const file of list.slice(0, room)) {
          const { blob, type } = await shrink(file)
          const id = await uploadToBucket({ kind: 'image', contentType: type }, blob, safeword)
          const image = await flyersPost<FlyerImage>(
            'image-save',
            { id, contentType: type, name: nameFromFile(file.name) },
            safeword,
          )
          patch((prev) => [...prev, image])
        }
        if (list.length > room) setError(`Solo se agregaron ${room}: el máximo es ${FLYER_MAX_ASSETS} imágenes.`)
      })
    },
    rename(id: string, name: string) {
      const clean = name.trim().slice(0, FLYER_ASSET_NAME_MAX)
      if (!clean || images.find((image) => image.id === id)?.name === clean) return
      return guarded(async (safeword) => {
        const image = await flyersPost<FlyerImage>('image-rename', { id, name: clean }, safeword)
        patch((prev) => prev.map((item) => (item.id === id ? image : item)))
      })
    },
    remove(id: string) {
      return guarded(async (safeword) => {
        await flyersPost('image-delete', { id }, safeword)
        patch((prev) => prev.filter((item) => item.id !== id))
      })
    },
  }
}

export type ImageLibrary = ReturnType<typeof useImageLibrary>

/** Lo que viaja a la IA: id y nombre. */
export function toAssetRefs(images: FlyerImage[]): FlyerAssetRef[] {
  return images.map((image) => ({ id: image.id, name: image.name }))
}
