// Biblioteca de imágenes del generador (logos de rivales, auspiciantes...). Se guarda en localStorage de este
// navegador, reducida para que quepan varias: nunca se sube al servidor ni se envía a la IA (solo su id y nombre).
import { useState } from 'react'
import { FLYER_ASSET_NAME_MAX, FLYER_MAX_ASSETS, type FlyerAssetRef } from '@shared/flyers'

export type FlyerImage = FlyerAssetRef & {
  /** data URL de la imagen ya reducida. */
  src: string
  createdAt: number
}

const STORAGE_KEY = 'coyotes:flyer-assets'
/** Lado mayor tras reducir: sobra para un logo en un flyer de 1080 px y ocupa poco en localStorage. */
const MAX_SIDE = 512

function read(): FlyerImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is FlyerImage =>
        typeof item?.id === 'string' && typeof item.name === 'string' && typeof item.src === 'string',
    )
  } catch {
    return []
  }
}

/** Devuelve false si el navegador no tiene espacio (o bloquea el almacenamiento). */
function write(images: FlyerImage[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
    return true
  } catch {
    return false
  }
}

/** "asset_k3f9x0q2ma": 10 caracteres [a-z0-9] aleatorios. */
export function newId(prefix: string): string {
  return `${prefix}_${Array.from(crypto.getRandomValues(new Uint8Array(10)), (n) => (n % 36).toString(36)).join('')}`
}

/** "logo-onas_voley.png" → "Logo onas voley" */
function nameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  const name = base.charAt(0).toUpperCase() + base.slice(1)
  return (name || 'Imagen').slice(0, FLYER_ASSET_NAME_MAX)
}

/** Reduce la imagen a MAX_SIDE conservando la transparencia (WebP; PNG donde el navegador no lo codifica). */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth || MAX_SIDE, image.naturalHeight || MAX_SIDE))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round((image.naturalWidth || MAX_SIDE) * scale))
    canvas.height = Math.max(1, Math.round((image.naturalHeight || MAX_SIDE) * scale))
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/webp', 0.9)
  } catch {
    throw new Error(`No se pudo leer "${file.name}". Prueba con un PNG, JPG o WebP.`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

const FULL_MESSAGE = 'No queda espacio en este navegador. Borra imágenes o flyers guardados que no uses.'

export function useImageLibrary() {
  const [images, setImages] = useState<FlyerImage[]>(read)
  const [error, setError] = useState<string | null>(null)

  function commit(next: FlyerImage[]): boolean {
    if (!write(next)) {
      setError(FULL_MESSAGE)
      return false
    }
    setImages(next)
    setError(null)
    return true
  }

  return {
    images,
    error,
    async add(files: FileList | File[]) {
      const list = Array.from(files).filter((file) => file.type.startsWith('image/'))
      const room = FLYER_MAX_ASSETS - images.length
      if (list.length === 0) return
      if (room <= 0) {
        setError(`Máximo ${FLYER_MAX_ASSETS} imágenes. Borra alguna para subir otra.`)
        return
      }
      const added: FlyerImage[] = []
      try {
        for (const file of list.slice(0, room)) {
          added.push({ id: newId('asset'), name: nameFromFile(file.name), src: await shrink(file), createdAt: Date.now() })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : FULL_MESSAGE)
        if (added.length === 0) return
      }
      if (commit([...images, ...added]) && list.length > room) {
        setError(`Solo se agregaron ${room}: el máximo es ${FLYER_MAX_ASSETS} imágenes.`)
      }
    },
    rename(id: string, name: string) {
      const clean = name.slice(0, FLYER_ASSET_NAME_MAX)
      commit(images.map((image) => (image.id === id ? { ...image, name: clean } : image)))
    },
    remove(id: string) {
      commit(images.filter((image) => image.id !== id))
    },
  }
}

export type ImageLibrary = ReturnType<typeof useImageLibrary>

/** Lo que viaja a la IA: id y nombre (los nombres vacíos no ayudan a elegir). */
export function toAssetRefs(images: FlyerImage[]): FlyerAssetRef[] {
  return images
    .map((image) => ({ id: image.id, name: image.name.trim() }))
    .filter((image) => image.name.length > 0)
}
