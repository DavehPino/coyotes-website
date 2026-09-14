// Flyers guardados en localStorage de este navegador. Los de la IA se guardan solos al generarse; el resto con
// el botón Guardar. Son copias: editar un flyer abierto desde aquí no cambia el guardado.
import { useState } from 'react'
import { flyerContentSchema, type FlyerContent } from '@shared/flyers'
import { newId } from './assetLibrary'

export type SavedFlyer = {
  id: string
  savedAt: number
  source: 'ia' | 'manual'
  /** Pedido a la IA o título del flyer. */
  label: string
  flyer: FlyerContent
}

const STORAGE_KEY = 'coyotes:flyers-saved'
export const SAVED_LIMIT = 50

function read(): SavedFlyer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      const flyer = flyerContentSchema.safeParse(item?.flyer)
      if (!flyer.success || typeof item.id !== 'string') return []
      return [
        {
          id: item.id,
          savedAt: Number(item.savedAt) || 0,
          source: item.source === 'ia' ? 'ia' : 'manual',
          label: typeof item.label === 'string' ? item.label : '',
          flyer: flyer.data,
        } satisfies SavedFlyer,
      ]
    })
  } catch {
    return []
  }
}

function write(items: SavedFlyer[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

/** Igualdad por contenido, sin depender del orden de las claves (cambia al leer de localStorage). */
const fingerprint = (flyer: FlyerContent) => JSON.stringify(flyer, Object.keys(flyer).sort())
export const sameFlyer = (a: FlyerContent, b: FlyerContent) => fingerprint(a) === fingerprint(b)

export function useSavedFlyers() {
  const [items, setItems] = useState<SavedFlyer[]>(read)
  const [error, setError] = useState<string | null>(null)

  return {
    items,
    error,
    /** Guarda al principio de la lista. Un flyer idéntico ya guardado no se duplica: sube arriba. */
    save(flyer: FlyerContent, source: SavedFlyer['source'], label: string) {
      const existing = items.find((item) => sameFlyer(item.flyer, flyer))
      const entry: SavedFlyer = existing
        ? { ...existing, savedAt: Date.now(), source: existing.source === 'ia' ? 'ia' : source }
        : { id: newId('flyer'), savedAt: Date.now(), source, label: label.trim().slice(0, 160), flyer }
      const next = [entry, ...items.filter((item) => item.id !== entry.id)].slice(0, SAVED_LIMIT)
      if (write(next)) {
        setItems(next)
        setError(null)
      } else {
        setError('No se pudo guardar: no queda espacio en este navegador. Borra flyers o imágenes que no uses.')
      }
    },
    remove(id: string) {
      const next = items.filter((item) => item.id !== id)
      write(next)
      setItems(next)
    },
    isSaved: (flyer: FlyerContent) => items.some((item) => sameFlyer(item.flyer, flyer)),
  }
}

export type SavedFlyers = ReturnType<typeof useSavedFlyers>
