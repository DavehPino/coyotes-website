import { useSafewordAccess } from '../admin/useSafewordAccess'
import { flyersPost, flyersSafewordStore } from './api'

/**
 * Acceso a las acciones protegidas de Flyers: subir imágenes, guardar flyers y usar la IA.
 * La mecánica (pedirla solo cuando hace falta, recordarla y reintentar) está en useSafewordAccess.
 */
export function useFlyersAccess() {
  return useSafewordAccess({
    store: flyersSafewordStore,
    verify: (safeword) => flyersPost('verify', {}, safeword),
    title: 'Flyers',
    description:
      'Subir imágenes, guardar flyers y usar la IA requiere la palabra clave de flyers (distinta de la de carga de datos).',
    staleNotice: 'La palabra clave de flyers ya no es válida. Escríbela de nuevo.',
  })
}
