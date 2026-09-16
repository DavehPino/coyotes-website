import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type RefObject } from 'react'
import { PLAYER_POSITION_LABELS } from '@shared/domain'
import type { LineupSlot } from '@shared/schemas'
import { PlayerToken } from './PlayerToken'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COURT,
  COURT_BOX,
  pointFromClient,
  toCanvasPoint,
  ZONE_CENTERS,
  zoneOf,
  type PlayersById,
  type Zone,
} from './rules'
import type { BoardDragBinder } from './useBoardDrag'

export type MoveKind = 'drag' | 'tap' | 'key'

type CourtProps = {
  slots: LineupSlot[]
  players: PlayersById
  selectedId: string | null
  draggingId: string | null
  /** Último movimiento: las fichas soltadas se asientan; las movidas con toque o teclado se deslizan. */
  lastMove: { playerId: string; kind: MoveKind; seq: number } | null
  /** Ficha que debe recibir el foco (p.ej. tras moverla con el teclado). Cada petición es un objeto nuevo. */
  focusRequest: { playerId: string } | null
  canvasRef: RefObject<HTMLDivElement | null>
  courtRef: RefObject<HTMLDivElement | null>
  bind: BoardDragBinder
  onTap: (x: number, y: number) => void
  onTokenClick: (playerId: string, event: MouseEvent) => void
  onTokenKeyDown: (playerId: string, event: KeyboardEvent) => void
}

const ZONES = Object.entries(ZONE_CENTERS) as unknown as [Zone, { x: number; y: number }][]

/** Media cancha propia (SVG) con las fichas encima. Se escala para caber entera en su contenedor. */
export function Court({
  slots,
  players,
  selectedId,
  draggingId,
  lastMove,
  focusRequest,
  canvasRef,
  courtRef,
  bind,
  onTap,
  onTokenClick,
  onTokenKeyDown,
}: CourtProps) {
  const tokenRefs = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    if (focusRequest) tokenRefs.current.get(focusRequest.playerId)?.focus()
  }, [focusRequest])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    // Los toques en una ficha los gestiona la ficha; `detail === 0` es un clic de teclado.
    if (event.detail === 0 || (event.target as Element).closest('[data-token]')) return
    const court = courtRef.current?.getBoundingClientRect()
    if (court) {
      const point = pointFromClient(event.clientX, event.clientY, court)
      onTap(point.x, point.y)
    }
  }

  return (
    // Contenedor con tamaño propio: la cancha cuadrada ocupa el lado menor disponible.
    <div className="flex size-full min-h-0 items-center justify-center [container-type:size]">
      <div
        ref={canvasRef}
        onClick={handleClick}
        className="relative aspect-square w-[min(100cqw,100cqh)] touch-none select-none"
      >
        <CourtDrawing />

        <div
          ref={courtRef}
          className="absolute"
          style={{
            left: `${COURT_BOX.left * 100}%`,
            top: `${COURT_BOX.top * 100}%`,
            width: `${COURT_BOX.width * 100}%`,
            height: `${COURT_BOX.height * 100}%`,
          }}
        >
          {slots.map((slot) => {
            const player = players.get(slot.player_id)
            if (!player) return null
            const selected = selectedId === player.id
            const moved = lastMove?.playerId === player.id ? lastMove : null
            return (
              <div
                key={player.id}
                className={[
                  'pointer-events-none absolute inset-0 motion-reduce:transition-none',
                  moved && moved.kind !== 'drag' ? 'transition-transform duration-150 ease-out' : '',
                  selected || draggingId === player.id ? 'z-20' : 'z-10',
                ].join(' ')}
                style={{ transform: `translate(${slot.x * 100}%, ${slot.y * 100}%)` }}
              >
                <PlayerToken
                  // Al soltar se vuelve a montar la cara para repetir la animación de asentarse.
                  key={moved?.kind === 'drag' ? moved.seq : 'token'}
                  ref={(element) => {
                    if (element) tokenRefs.current.set(player.id, element)
                    else tokenRefs.current.delete(player.id)
                  }}
                  player={player}
                  selected={selected}
                  ghosted={draggingId === player.id}
                  aria-label={`${player.name}, ${PLAYER_POSITION_LABELS[player.primary_position]}, en cancha, zona ${zoneOf(slot.x, slot.y)}`}
                  aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Delete"
                  className={[
                    'pointer-events-auto absolute top-0 left-0 -translate-x-1/2 -translate-y-[26px]',
                    moved?.kind === 'drag' ? 'animate-token-drop motion-reduce:animate-none' : '',
                  ].join(' ')}
                  {...bind(player.id, 'court')}
                  onClick={(event) => onTokenClick(player.id, event)}
                  onKeyDown={(event) => onTokenKeyDown(player.id, event)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Dibujo de la cancha: suelo, líneas, red, línea de ataque y números de zona tenues. Decorativo. */
function CourtDrawing() {
  const court = toCanvasPoint(0, 0)
  const attackY = COURT.marginTop + COURT.attackLine
  const line = 'var(--color-court-line)'
  return (
    <svg
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      aria-hidden
      className="absolute inset-0 size-full rounded-2xl"
    >
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} rx={0.35} fill="var(--color-court-free)" />
      <rect x={court.x} y={court.y} width={COURT.size} height={COURT.size} fill="var(--color-court)" />

      {/* Líneas de 5 cm */}
      <rect
        x={court.x}
        y={court.y}
        width={COURT.size}
        height={COURT.size}
        fill="none"
        stroke={line}
        strokeWidth={0.07}
      />
      <line x1={court.x} x2={court.x + COURT.size} y1={attackY} y2={attackY} stroke={line} strokeWidth={0.07} />
      {/* Prolongación discontinua de la línea de ataque en la zona libre */}
      {[
        [0.15, court.x],
        [court.x + COURT.size, CANVAS_WIDTH - 0.15],
      ].map(([x1, x2]) => (
        <line
          key={x1}
          x1={x1}
          x2={x2}
          y1={attackY}
          y2={attackY}
          stroke={line}
          strokeWidth={0.05}
          strokeDasharray="0.15 0.15"
          opacity={0.5}
        />
      ))}

      {/* Números de zona como guía */}
      {ZONES.map(([zone, center]) => {
        const point = toCanvasPoint(center.x, center.y)
        return (
          <text
            key={zone}
            x={point.x}
            y={point.y}
            fill={line}
            opacity={0.13}
            fontSize={1.9}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {zone}
          </text>
        )
      })}

      {/* Red: cinta blanca, postes y etiqueta */}
      <line x1={0.35} x2={CANVAS_WIDTH - 0.35} y1={court.y} y2={court.y} stroke={line} strokeWidth={0.16} strokeLinecap="round" />
      <line
        x1={0.35}
        x2={CANVAS_WIDTH - 0.35}
        y1={court.y}
        y2={court.y}
        stroke="var(--color-court-free)"
        strokeWidth={0.05}
        strokeDasharray="0.12 0.12"
      />
      <circle cx={0.35} cy={court.y} r={0.16} fill="var(--color-coyote-gold)" />
      <circle cx={CANVAS_WIDTH - 0.35} cy={court.y} r={0.16} fill="var(--color-coyote-gold)" />
      <text
        x={CANVAS_WIDTH / 2}
        y={court.y / 2 - 0.02}
        fill={line}
        opacity={0.75}
        fontSize={0.42}
        letterSpacing={0.12}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        RED
      </text>
    </svg>
  )
}
