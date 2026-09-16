// Precarga del flyer desde datos ya cargados: /flyers?from=match:<slug> o ?from=activity:<id>.
// El parámetro se resuelve una sola vez y se borra de la URL, para que editar o recargar no lo reaplique.
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { errorMessage } from '../admin/adminApi'
import { todayIsoDate } from '@shared/dates'
import type { FlyerContent, FlyerImage } from '@shared/flyers'
import { upcomingActivitiesOptions } from '../activities/api'
import { matchDetailOptions } from '../matches/api'
import { PREFILL_PARAM } from './flyerLinks'
import { flyerFromActivity, flyerFromMatch, type FlyerBase } from './presets'

type Composed = { flyer: FlyerContent; notice: string }

async function compose(
  from: string,
  queryClient: QueryClient,
  base: FlyerBase,
  images: FlyerImage[],
): Promise<Composed> {
  const separator = from.indexOf(':')
  const kind = separator === -1 ? from : from.slice(0, separator)
  const value = separator === -1 ? '' : from.slice(separator + 1)
  if (!value) throw new Error('El enlace no indica de dónde cargar el flyer.')

  if (kind === 'match') {
    // Normalmente ya está en caché porque se llega desde el detalle del partido: se resuelve al instante.
    const match = await queryClient.fetchQuery(matchDetailOptions(value))
    return { flyer: flyerFromMatch(match, base, images), notice: 'Cargado desde el partido' }
  }
  if (kind === 'activity') {
    const activities = await queryClient.fetchQuery(upcomingActivitiesOptions(todayIsoDate()))
    const activity = activities.find((item) => item.id === value)
    if (!activity) throw new Error('Esa actividad ya no está entre las próximas.')
    return { flyer: flyerFromActivity(activity, base, images), notice: 'Cargado desde la actividad' }
  }
  throw new Error('El enlace no es válido.')
}

type PrefillOptions = {
  base: FlyerBase
  images: FlyerImage[]
  /** La biblioteca ya respondió (bien o mal): sin ella no se puede resolver el logo del rival. */
  libraryReady: boolean
  apply: (flyer: FlyerContent, notice: string) => void
}

/**
 * Aplica la precarga una única vez. Si el partido o la actividad no existen, devuelve el error para mostrarlo
 * y limpia igualmente la URL: la sección nunca queda bloqueada.
 */
export function usePrefill(options: PrefillOptions): { error: string | null; dismiss: () => void } {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const from = searchParams.get(PREFILL_PARAM)
  const done = useRef(false)
  // El formato y las imágenes cambian mientras se edita; la precarga usa los del momento en que se resuelve.
  const latest = useRef(options)
  latest.current = options

  useEffect(() => {
    if (!from || done.current || !latest.current.libraryReady) return
    done.current = true
    void (async () => {
      try {
        const { flyer, notice } = await compose(from, queryClient, latest.current.base, latest.current.images)
        latest.current.apply(flyer, notice)
      } catch (err) {
        setError(`No se pudo cargar el flyer. ${errorMessage(err)}`)
      } finally {
        setSearchParams({}, { replace: true })
      }
    })()
  }, [from, options.libraryReady, queryClient, setSearchParams])

  return { error, dismiss: () => setError(null) }
}
