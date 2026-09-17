// Arrastre de fichas con Pointer Events (dedo, ratón y lápiz), sin librerías.
// La ficha arrastrada es un "fantasma" fijo que sigue al puntero; su posición se escribe directamente en el DOM
// para no volver a renderizar el tablero en cada movimiento.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { pointFromClient } from './rules'

export type DragOrigin = 'bench' | 'court'

export type DropTarget = { kind: 'court'; x: number; y: number } | { kind: 'bench' } | { kind: 'none' }

type Pending = {
  pointerId: number
  playerId: string
  origin: DragOrigin
  startX: number
  startY: number
  dragging: boolean
}

type UseBoardDragOptions = {
  /** Lienzo completo de la cancha (con zona libre): soltar dentro cuenta como cancha. */
  canvasRef: RefObject<HTMLElement | null>
  /** Rectángulo 9 × 9 m: referencia para normalizar las coordenadas. */
  courtRef: RefObject<HTMLElement | null>
  benchRef: RefObject<HTMLElement | null>
  onDrop: (playerId: string, origin: DragOrigin, target: DropTarget) => void
}

/** Distancia mínima para que un toque se convierta en arrastre (por debajo, es un toque normal). */
const DRAG_THRESHOLD = 6

/** true si el gesto va en una dirección que la ficha deja desplazar al navegador (touch-action pan-x / pan-y). */
function isPanGesture(element: HTMLElement, dx: number, dy: number): boolean {
  const touchAction = getComputedStyle(element).touchAction
  const horizontal = Math.abs(dx) > Math.abs(dy)
  return (horizontal && touchAction.includes('pan-x')) || (!horizontal && touchAction.includes('pan-y'))
}

const inside = (rect: DOMRect, x: number, y: number) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

export function useBoardDrag({ canvasRef, courtRef, benchRef, onDrop }: UseBoardDragOptions) {
  const pending = useRef<Pending | null>(null)
  const lastPoint = useRef({ x: 0, y: 0 })
  const ghost = useRef<HTMLElement | null>(null)
  // Tras un arrastre el navegador aún dispara `click` en la ficha: no debe contar como toque.
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState<{ playerId: string; origin: DragOrigin } | null>(null)
  const [overBench, setOverBench] = useState(false)

  const finish = useCallback(() => {
    pending.current = null
    setDragging(null)
    setOverBench(false)
  }, [])

  // Mientras se arrastra, el navegador no debe interpretar el gesto como desplazamiento: si lo hace (p.ej. un arrastre
  // rápido en el banco, que admite pan-x), Chrome se come el siguiente toque. React registra touchmove como pasivo,
  // así que el listener va directo al documento.
  // Si la ventana pierde el foco o la pestaña se oculta a mitad de un gesto, no llega `pointerup`: se suelta aquí
  // para que la siguiente ficha responda sin recargar.
  useEffect(() => {
    const block = (event: TouchEvent) => {
      if (pending.current?.dragging && event.cancelable) event.preventDefault()
    }
    const cancel = () => {
      if (pending.current) finish()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cancel()
    }
    document.addEventListener('touchmove', block, { passive: false })
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('touchmove', block)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [finish])

  const placeGhost = (x: number, y: number) => {
    lastPoint.current = { x, y }
    if (ghost.current) ghost.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
  }

  const ghostRef = useCallback((element: HTMLElement | null) => {
    ghost.current = element
    if (element) {
      const { x, y } = lastPoint.current
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    }
  }, [])

  function targetAt(x: number, y: number): DropTarget {
    const canvas = canvasRef.current?.getBoundingClientRect()
    const court = courtRef.current?.getBoundingClientRect()
    if (canvas && court && inside(canvas, x, y)) return { kind: 'court', ...pointFromClient(x, y, court) }
    const bench = benchRef.current?.getBoundingClientRect()
    if (bench && inside(bench, x, y)) return { kind: 'bench' }
    return { kind: 'none' }
  }

  /** Manejadores para la ficha de un jugador. */
  function bind(playerId: string, origin: DragOrigin) {
    return {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (event.button !== 0 || pending.current) return
        suppressClick.current = false
        event.currentTarget.setPointerCapture(event.pointerId)
        pending.current = {
          pointerId: event.pointerId,
          playerId,
          origin,
          startX: event.clientX,
          startY: event.clientY,
          dragging: false,
        }
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        const current = pending.current
        if (!current || current.pointerId !== event.pointerId) return
        if (!current.dragging) {
          const dx = event.clientX - current.startX
          const dy = event.clientY - current.startY
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
          if (event.pointerType === 'touch' && isPanGesture(event.currentTarget, dx, dy)) {
            // El dedo va en la dirección en que se desplaza el banco: es un desplazamiento, no un arrastre.
            pending.current = null
            return
          }
          current.dragging = true
          setDragging({ playerId, origin })
        }
        event.preventDefault()
        placeGhost(event.clientX, event.clientY)
        setOverBench(origin === 'court' && targetAt(event.clientX, event.clientY).kind === 'bench')
      },
      onPointerUp(event: ReactPointerEvent<HTMLElement>) {
        const current = pending.current
        if (!current || current.pointerId !== event.pointerId) return
        if (current.dragging) {
          // El `click` de este gesto llega justo después, en la misma tarea (o nunca): se ignora.
          suppressClick.current = true
          setTimeout(() => {
            suppressClick.current = false
          }, 0)
          onDrop(playerId, origin, targetAt(event.clientX, event.clientY))
        }
        finish()
      },
      onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
        if (pending.current?.pointerId === event.pointerId) finish()
      },
      onLostPointerCapture(event: ReactPointerEvent<HTMLElement>) {
        // Captura perdida sin `pointerup` (p.ej. la ficha se desmonta): mismo cierre que una cancelación.
        if (pending.current?.pointerId === event.pointerId) finish()
      },
      onClickCapture(event: ReactMouseEvent<HTMLElement>) {
        // Solo clics de puntero: Enter o Espacio (detail 0) nunca vienen de un arrastre.
        if (!suppressClick.current || event.detail === 0) return
        suppressClick.current = false
        event.preventDefault()
        event.stopPropagation()
      },
    }
  }

  return { bind, dragging, overBench, ghostRef }
}

export type BoardDragBinder = ReturnType<typeof useBoardDrag>['bind']
