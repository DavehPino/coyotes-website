import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { LOGO_SRC } from '@/config'
import { FLYER_FORMAT_SIZES, type FlyerContent } from '@shared/flyers'
import type { FlyerImage } from './assetLibrary'
import { loadFlyerFonts, loadImage, renderFlyer, type FlyerAssets } from './render'

// Fuentes y escudo se cargan una sola vez para todos los lienzos (vista previa y miniaturas).
let baseAssets: Promise<HTMLImageElement | null> | null = null
function loadBaseAssets() {
  baseAssets ??= Promise.all([loadFlyerFonts(), loadImage(LOGO_SRC).catch(() => null)]).then(([, logo]) => logo)
  return baseAssets
}

// Cada imagen de la biblioteca se decodifica una vez, aunque la usen varios lienzos.
const decoded = new Map<string, Promise<HTMLImageElement | null>>()
function decode(image: FlyerImage) {
  let pending = decoded.get(image.id)
  if (!pending) {
    pending = loadImage(image.src).catch(() => null)
    decoded.set(image.id, pending)
  }
  return pending
}

const NO_IMAGES: ReadonlyMap<string, HTMLImageElement> = new Map()

/**
 * Recursos del flyer: escudo, fuentes, la foto de fondo opcional (URL local del archivo elegido) y las imágenes
 * de la biblioteca. Devuelve siempre el mismo objeto mientras no cambie nada, para no redibujar de más.
 */
export function useFlyerAssets(
  photoUrl: string | null,
  library: FlyerImage[] = [],
): { assets: FlyerAssets; ready: boolean } {
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [images, setImages] = useState<ReadonlyMap<string, HTMLImageElement>>(NO_IMAGES)

  useEffect(() => {
    let active = true
    void loadBaseAssets().then((image) => {
      if (!active) return
      setLogo(image)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!photoUrl) {
      setPhoto(null)
      return
    }
    let active = true
    loadImage(photoUrl)
      .then((image) => active && setPhoto(image))
      .catch(() => active && setPhoto(null))
    return () => {
      active = false
    }
  }, [photoUrl])

  const libraryKey = library.map((image) => image.id).join(',')
  useEffect(() => {
    let active = true
    void Promise.all(library.map(async (image) => [image.id, await decode(image)] as const)).then((entries) => {
      if (!active) return
      const map = new Map<string, HTMLImageElement>()
      for (const [id, element] of entries) if (element) map.set(id, element)
      setImages(map.size > 0 ? map : NO_IMAGES)
    })
    return () => {
      active = false
    }
    // Solo depende de qué imágenes hay (`library` cambia de identidad en cada render y renombrar no redibuja).
  }, [libraryKey])

  const assets = useMemo(() => ({ logo, photo, images }), [logo, photo, images])
  return { assets, ready }
}

type FlyerCanvasProps = {
  flyer: FlyerContent
  assets: FlyerAssets
  ready: boolean
  /** Escala del lienzo: 1 para el tamaño real; menos para miniaturas. */
  pixelRatio?: number
  className?: string
  label: string
  ref?: Ref<HTMLCanvasElement>
}

export function FlyerCanvas({ flyer, assets, ready, pixelRatio = 1, className = '', label, ref }: FlyerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement, [])

  useEffect(() => {
    if (canvasRef.current && ready) renderFlyer(canvasRef.current, flyer, assets, pixelRatio)
  }, [ready, flyer, assets, pixelRatio])

  // Tamaño fijado desde el primer render para que el hueco tenga ya la proporción del formato.
  const size = FLYER_FORMAT_SIZES[flyer.format]
  return (
    <canvas
      ref={canvasRef}
      width={Math.round(size.width * pixelRatio)}
      height={Math.round(size.height * pixelRatio)}
      role="img"
      aria-label={label}
      className={['transition-opacity duration-200', ready ? 'opacity-100' : 'opacity-0', className].join(' ')}
    />
  )
}
