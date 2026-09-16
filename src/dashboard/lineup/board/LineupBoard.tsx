import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { LINEUP_NAME_MAX, LINEUP_NOTES_MAX, PLAYER_POSITIONS, type PlayerPosition } from '@shared/domain'
import type { Lineup, LineupSlot, Player } from '@shared/schemas'
import { errorMessage, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { Button, Field, Input, Textarea } from '../../ui'
import { FullscreenDialog } from '../../ui/FullscreenDialog'
import { CheckIcon, CloseIcon, PencilIcon, SaveIcon, TrashIcon, UndoIcon } from '../../ui/icons'
import { deleteLineup, lineupKeys, refreshLineupData, saveLineup } from '../api'
import { matchesPosition } from '../positions'
import { ShareLineupButton } from '../share/ShareLineupButton'
import { ActionSheet } from './ActionSheet'
import { Bench } from './Bench'
import { BoardMenu } from './BoardMenu'
import { Court, type MoveKind } from './Court'
import { LineupPicker } from './LineupPicker'
import { TokenFace } from './PlayerToken'
import {
  clamp01,
  compareBench,
  countRoles,
  indexPlayers,
  KEYBOARD_STEP,
  lineupSignature,
  MAX_STARTERS,
  nextFreePoint,
  placementBlocker,
  placeSlot,
  removeSlot,
  usableSlots,
  zoneOf,
} from './rules'
import { useBoardDrag, type DragOrigin, type DropTarget } from './useBoardDrag'

type LineupBoardProps = {
  open: boolean
  /** Formación con la que se abre; null = nueva y vacía. */
  initialLineupId: string | null
  players: Player[]
  lineups: Lineup[]
  onClose: () => void
}

/** Formación en edición: la guardada (si existe) y lo que hay ahora en cancha. */
type Current = { id: string | null; name: string; notes: string | null; savedSlots: LineupSlot[] }

type NameMode = 'create' | 'rename' | 'copy'

type Sheet =
  | { kind: 'name'; mode: NameMode }
  | { kind: 'save' }
  | { kind: 'delete' }
  | { kind: 'discard'; then: () => void; message: string; confirmLabel: string }

const NAME_SHEET_TITLES: Record<NameMode, string> = {
  create: 'Guardar formación',
  rename: 'Renombrar formación',
  copy: 'Guardar como nueva',
}

const NOTICE_MS = 2600

/** Cancha a pantalla completa para armar, guardar, cargar y compartir formaciones. */
export default function LineupBoard({ open, initialLineupId, players, lineups, onClose }: LineupBoardProps) {
  const queryClient = useQueryClient()
  const byId = useMemo(() => indexPlayers(players), [players])

  const loadCurrent = (lineupId: string | null): Current => {
    const lineup = lineupId ? lineups.find((item) => item.id === lineupId) : undefined
    if (!lineup) return { id: null, name: '', notes: null, savedSlots: [] }
    return { id: lineup.id, name: lineup.name, notes: lineup.notes, savedSlots: usableSlots(lineup.slots, byId) }
  }

  const [current, setCurrent] = useState<Current>(() => loadCurrent(initialLineupId))
  const [slots, setSlots] = useState<LineupSlot[]>(() => current.savedSlots)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [benchFilter, setBenchFilter] = useState<PlayerPosition | null>(null)
  const [lastMove, setLastMove] = useState<{ playerId: string; kind: MoveKind; seq: number } | null>(null)
  const [focusRequest, setFocusRequest] = useState<{ playerId: string; area: DragOrigin } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error'; seq: number } | null>(null)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSeq, setSheetSeq] = useState(0)
  const [nameDraft, setNameDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const courtRef = useRef<HTMLDivElement>(null)
  const benchRef = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  const nextSeq = () => ++seq.current

  const dirty = lineupSignature('', slots) !== lineupSignature('', current.savedSlots)
  const roles = countRoles(slots, byId)
  const onCourt = new Set(slots.map((slot) => slot.player_id))
  const benchAll = players.filter((player) => player.is_active && !onCourt.has(player.id))
  const bench = benchAll.filter((player) => matchesPosition(player, benchFilter)).sort(compareBench(PLAYER_POSITIONS))
  const selected = selectedId ? byId.get(selectedId) ?? null : null
  const selectedOnCourt = selectedId !== null && onCourt.has(selectedId)
  const displayName = current.name || 'Nueva formación'

  // ─── Avisos ─────────────────────────────────────────────────────────────
  const announce = (text: string) =>
    // El mismo texto dos veces seguidas no se volvería a leer: se alterna un espacio al final.
    setAnnouncement((previous) => (previous === text ? `${text} ` : text))

  const flash = (text: string, tone: 'info' | 'error' = 'info') => {
    setNotice({ text, tone, seq: nextSeq() })
    announce(text)
  }

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  // ─── Movimientos ────────────────────────────────────────────────────────
  function place(playerId: string, x: number, y: number, kind: MoveKind): boolean {
    const player = byId.get(playerId)
    if (!player) return false
    const blocker = placementBlocker(player, slots, byId)
    if (blocker) {
      flash(blocker, 'error')
      return false
    }
    setSlots((prev) => placeSlot(prev, playerId, x, y))
    setLastMove({ playerId, kind, seq: nextSeq() })
    announce(`${player.name}, zona ${zoneOf(x, y)}`)
    return true
  }

  function toBench(playerId: string) {
    const player = byId.get(playerId)
    if (!player || !onCourt.has(playerId)) return
    setSlots((prev) => removeSlot(prev, playerId))
    announce(`${player.name}, al banco`)
  }

  const drag = useBoardDrag({
    canvasRef,
    courtRef,
    benchRef,
    onDrop(playerId: string, origin: DragOrigin, target: DropTarget) {
      setSelectedId(null)
      if (target.kind === 'court') place(playerId, target.x, target.y, 'drag')
      else if (target.kind === 'bench' && origin === 'court') toBench(playerId)
    },
  })

  function select(player: Player, origin: DragOrigin) {
    setSelectedId(player.id)
    announce(
      origin === 'bench'
        ? `${player.name} seleccionado. Toca la cancha para ubicarlo o pulsa Enter otra vez para ponerlo en la primera zona libre.`
        : `${player.name} seleccionado. Toca la cancha para moverlo, usa las flechas o Suprimir para mandarlo al banco.`,
    )
  }

  function placeSelectedInFreeZone() {
    if (!selected) return
    const point = nextFreePoint(selected, slots)
    if (place(selected.id, point.x, point.y, 'key')) {
      // Queda seleccionado y con el foco en la cancha: las flechas lo mueven enseguida.
      setFocusRequest({ playerId: selected.id, area: 'court' })
    } else {
      setSelectedId(null)
    }
  }

  function handleTokenClick(playerId: string, origin: DragOrigin, event: MouseEvent) {
    const player = byId.get(playerId)
    if (!player) return
    const keyboard = event.detail === 0
    if (selectedId !== playerId) return select(player, origin)
    // Segunda pulsación: con teclado en el banco, lo ubica; en los demás casos, deselecciona.
    if (keyboard && origin === 'bench') return placeSelectedInFreeZone()
    setSelectedId(null)
    announce(`${player.name}, sin seleccionar`)
  }

  function handleTokenKeyDown(playerId: string, origin: DragOrigin, event: KeyboardEvent) {
    if (event.key === 'Escape' && selectedId === playerId) {
      // Solo deselecciona: que no cierre la cancha.
      event.preventDefault()
      event.stopPropagation()
      setSelectedId(null)
      return
    }
    if (origin !== 'court' || selectedId !== playerId) return
    const slot = slots.find((item) => item.player_id === playerId)
    if (!slot) return

    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      const step = event.shiftKey ? KEYBOARD_STEP * 3 : KEYBOARD_STEP
      place(playerId, clamp01(slot.x + move[0] * step), clamp01(slot.y + move[1] * step), 'key')
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      toBench(playerId)
      setBenchFilter(null)
      setFocusRequest({ playerId, area: 'bench' })
    }
  }

  function handleCourtTap(x: number, y: number) {
    if (!selectedId) return
    place(selectedId, x, y, 'tap')
    setSelectedId(null)
  }

  function handleBenchTap() {
    if (!selectedId || !selectedOnCourt) return
    toBench(selectedId)
    setSelectedId(null)
  }

  // ─── Formaciones ────────────────────────────────────────────────────────
  function openSheet(next: Sheet) {
    setSheet(next)
    setSheetSeq((n) => n + 1)
    setSheetOpen(true)
  }
  const closeSheet = () => setSheetOpen(false)

  function loadLineup(lineupId: string | null) {
    const next = loadCurrent(lineupId)
    setCurrent(next)
    setSlots(next.savedSlots)
    setSelectedId(null)
    setLastMove(null)
    announce(lineupId ? `Formación ${next.name} cargada` : 'Formación nueva')
  }

  /** Si hay cambios sin guardar, pregunta antes de seguir. */
  function guardDirty(then: () => void, message: string, confirmLabel: string) {
    if (!dirty) return then()
    openSheet({ kind: 'discard', then, message, confirmLabel })
  }

  const requestClose = () => guardDirty(onClose, 'Hay cambios en la cancha que no se guardaron.', 'Descartar')

  function applySaved(saved: Lineup) {
    const next: Current = { id: saved.id, name: saved.name, notes: saved.notes, savedSlots: saved.slots }
    setCurrent(next)
    // La API redondea las coordenadas: la cancha queda igual que lo guardado.
    setSlots(saved.slots)
    queryClient.setQueryData<Lineup[]>(lineupKeys.lineups, (items) => [
      saved,
      ...(items ?? []).filter((item) => item.id !== saved.id),
    ])
    void refreshLineupData(queryClient).catch(() => undefined)
  }

  function openNameSheet(mode: NameMode) {
    setNameDraft(mode === 'copy' ? `${current.name} (copia)`.slice(0, LINEUP_NAME_MAX) : current.name)
    setNotesDraft(current.notes ?? '')
    setNameError(null)
    openSheet({ kind: 'name', mode })
  }

  function validateName(): boolean {
    const name = nameDraft.trim()
    const error = !name ? 'Escribe un nombre para la formación' : name.length > LINEUP_NAME_MAX ? `Máximo ${LINEUP_NAME_MAX} caracteres` : null
    setNameError(error)
    return error === null
  }

  async function submitName(mode: NameMode, safeword: string) {
    const name = nameDraft.trim()
    const notes = notesDraft.trim() || null
    // Renombrar guarda lo que ya estaba guardado: los cambios en cancha siguen pendientes.
    const input =
      mode === 'rename'
        ? { id: current.id ?? undefined, name, notes, slots: current.savedSlots }
        : { name, notes, slots }
    const saved = await saveLineup(input, safeword)
    if (mode === 'rename') {
      setCurrent((prev) => ({ ...prev, name: saved.name, notes: saved.notes }))
      queryClient.setQueryData<Lineup[]>(lineupKeys.lineups, (items) =>
        (items ?? []).map((item) => (item.id === saved.id ? saved : item)),
      )
      void refreshLineupData(queryClient).catch(() => undefined)
    } else {
      applySaved(saved)
    }
    closeSheet()
    flash(
      mode === 'rename'
        ? `Formación renombrada a «${saved.name}»`
        : mode === 'copy'
          ? `Copia «${saved.name}» guardada`
          : `Formación «${saved.name}» guardada`,
    )
  }

  async function saveExisting(safeword: string) {
    const saved = await saveLineup(
      { id: current.id ?? undefined, name: current.name, notes: current.notes, slots },
      safeword,
    )
    applySaved(saved)
    closeSheet()
    flash(`Formación «${saved.name}» guardada`)
  }

  async function removeLineup(safeword: string) {
    if (!current.id) return
    const name = current.name
    await deleteLineup(current.id, safeword)
    queryClient.setQueryData<Lineup[]>(lineupKeys.lineups, (items) =>
      (items ?? []).filter((item) => item.id !== current.id),
    )
    void refreshLineupData(queryClient).catch(() => undefined)
    closeSheet()
    loadLineup(null)
    flash(`Formación «${name}» borrada`)
  }

  const counter = (
    <p className="flex items-center gap-2 text-sm text-coyote-ash tabular-nums">
      <span>
        Titulares{' '}
        <strong className={roles.starters === MAX_STARTERS ? 'text-coyote-gold' : 'text-coyote-silver'}>
          {roles.starters}/{MAX_STARTERS}
        </strong>
      </span>
      <span aria-hidden>·</span>
      <span>
        Líbero{' '}
        <strong className={roles.libero > 0 ? 'text-coyote-gold' : 'text-coyote-silver'}>
          <span aria-hidden>{roles.libero > 0 ? '✓' : '—'}</span>
          <span className="sr-only">{roles.libero > 0 ? 'sí' : 'no'}</span>
        </strong>
      </span>
      {dirty && <span className="ml-1 text-xs text-coyote-orange">Sin guardar</span>}
    </p>
  )

  let sheetContent: ReactNode = null
  if (sheet?.kind === 'name') {
    const mode = sheet.mode
    sheetContent = (
      <ActionSheet
        key={sheetSeq}
        open={sheetOpen}
        title={NAME_SHEET_TITLES[mode]}
        confirmLabel={mode === 'rename' ? 'Renombrar' : 'Guardar'}
        requiresSafeword
        validate={validateName}
        onConfirm={(safeword) => (safeword ? submitName(mode, safeword) : undefined)}
        onCancel={closeSheet}
      >
        <Field
          label="Nombre"
          error={nameError}
          hint={mode === 'copy' ? `La formación «${current.name}» no se modifica.` : 'Así aparece en la lista de formaciones.'}
        >
          <Input
            data-autofocus
            value={nameDraft}
            maxLength={LINEUP_NAME_MAX}
            autoComplete="off"
            placeholder="Titular, vs Onas…"
            onChange={(event) => setNameDraft(event.target.value)}
          />
        </Field>
        <Field label="Notas" optional>
          <Textarea
            value={notesDraft}
            rows={2}
            maxLength={LINEUP_NOTES_MAX}
            placeholder="Para qué rival o situación es"
            onChange={(event) => setNotesDraft(event.target.value)}
          />
        </Field>
        {mode === 'rename' && dirty && (
          <p className="text-xs text-coyote-ash">Solo cambia el nombre: los movimientos en cancha siguen sin guardar.</p>
        )}
      </ActionSheet>
    )
  } else if (sheet?.kind === 'save') {
    sheetContent = (
      <ActionSheet
        key={sheetSeq}
        open={sheetOpen}
        title="Guardar formación"
        confirmLabel="Guardar"
        requiresSafeword
        autoConfirm
        onConfirm={(safeword) => (safeword ? saveExisting(safeword) : undefined)}
        onCancel={closeSheet}
      >
        <p className="text-sm text-coyote-silver">
          Se reemplaza la formación «{current.name}» con lo que hay ahora en la cancha.
        </p>
      </ActionSheet>
    )
  } else if (sheet?.kind === 'delete') {
    sheetContent = (
      <ActionSheet
        key={sheetSeq}
        open={sheetOpen}
        title="Borrar formación"
        confirmLabel="Borrar"
        busyLabel="Borrando…"
        tone="danger"
        requiresSafeword
        onConfirm={(safeword) => (safeword ? removeLineup(safeword) : undefined)}
        onCancel={closeSheet}
      >
        <p className="text-sm text-coyote-silver">
          «{current.name}» se borra para siempre. Los jugadores siguen en el plantel.
        </p>
      </ActionSheet>
    )
  } else if (sheet?.kind === 'discard') {
    const { then, message, confirmLabel } = sheet
    sheetContent = (
      <ActionSheet
        key={sheetSeq}
        open={sheetOpen}
        title="¿Descartar los cambios?"
        confirmLabel={confirmLabel}
        cancelLabel="Seguir editando"
        tone="danger"
        onConfirm={() => {
          closeSheet()
          then()
        }}
        onCancel={closeSheet}
      >
        <p className="text-sm text-coyote-silver">{message}</p>
      </ActionSheet>
    )
  }

  /** Nueva: pide el nombre. Existente: guarda directo; solo abre un diálogo si falta la palabra clave. */
  async function handleSave() {
    if (!current.id) return openNameSheet('create')
    const safeword = safewordStore.get()
    if (!safeword) return openSheet({ kind: 'save' })
    setSaving(true)
    try {
      await saveExisting(safeword)
    } catch (err) {
      if (isUnauthorized(err)) {
        safewordStore.clear()
        openSheet({ kind: 'save' })
      } else {
        flash(errorMessage(err), 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <FullscreenDialog open={open} onRequestClose={requestClose} labelledBy="lineup-board-title">
      <h2 id="lineup-board-title" className="sr-only">
        Alineación: {displayName}
      </h2>

      {/* ─── Barra superior ─────────────────────────────────────────── */}
      <header className="flex items-center gap-1.5 border-b border-coyote-rust/50 bg-coyote-night px-2 py-2 md:gap-2 md:px-4">
        <Button variant="ghost" size="icon" aria-label="Cerrar la cancha" data-autofocus onClick={requestClose}>
          <CloseIcon strokeWidth={2} />
        </Button>
        <LineupPicker
          lineups={lineups}
          currentId={current.id}
          currentName={current.name}
          dirty={dirty}
          onChange={(lineupId) =>
            guardDirty(
              () => loadLineup(lineupId),
              `Si cambias a ${lineupId ? `«${lineups.find((item) => item.id === lineupId)?.name ?? ''}»` : 'una formación nueva'}, se pierden los cambios de «${displayName}».`,
              'Cambiar de formación',
            )
          }
        />
        <Button
          variant={dirty || !current.id ? 'primary' : 'secondary'}
          onClick={() => void handleSave()}
          disabled={saving || (!current.id && slots.length === 0)}
          aria-label="Guardar formación"
          className="size-11 px-0 sm:size-auto sm:pr-4 sm:pl-3.5"
        >
          <SaveIcon className="size-5 sm:size-4" strokeWidth={2} />
          <span className="hidden sm:inline">{saving ? 'Guardando…' : 'Guardar'}</span>
        </Button>
        <ShareLineupButton
          lineup={{ name: displayName, slots }}
          players={players}
          variant="toolbar"
          disabled={slots.length === 0}
        />
        <BoardMenu
          items={[
            {
              label: 'Renombrar',
              icon: <PencilIcon className="size-4" />,
              disabled: !current.id,
              onSelect: () => openNameSheet('rename'),
            },
            {
              label: 'Guardar como nueva',
              icon: <SaveIcon className="size-4" />,
              disabled: !current.id,
              onSelect: () => openNameSheet('copy'),
            },
            {
              label: 'Vaciar cancha',
              icon: <UndoIcon className="size-4" />,
              disabled: slots.length === 0,
              onSelect: () => {
                setSlots([])
                setSelectedId(null)
                flash('Cancha vacía')
              },
            },
            {
              label: 'Borrar formación',
              icon: <TrashIcon className="size-4" />,
              danger: true,
              disabled: !current.id,
              onSelect: () => openSheet({ kind: 'delete' }),
            },
          ]}
        />
      </header>

      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-1.5 md:px-4">
        {counter}
        {selected && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-coyote-silver">
              {selectedOnCourt ? 'Toca la cancha para moverlo' : 'Toca la cancha para ubicar a'}{' '}
              {!selectedOnCourt && <strong className="font-semibold">{selected.name}</strong>}
            </span>
            {!selectedOnCourt && (
              <Button size="sm" variant="secondary" onClick={placeSelectedInFreeZone} className="min-h-9 md:min-h-9">
                <CheckIcon className="size-4" strokeWidth={2} />
                Zona libre
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Cancha y banco ─────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col wide:flex-row">
        <div className="relative min-h-0 flex-1 px-3 pt-1 pb-3 md:px-6 md:pb-6">
          <Court
            slots={slots}
            players={byId}
            selectedId={selectedId}
            draggingId={drag.dragging?.playerId ?? null}
            lastMove={lastMove}
            focusRequest={focusRequest?.area === 'court' ? focusRequest : null}
            canvasRef={canvasRef}
            courtRef={courtRef}
            bind={drag.bind}
            onTap={handleCourtTap}
            onTokenClick={(playerId, event) => handleTokenClick(playerId, 'court', event)}
            onTokenKeyDown={(playerId, event) => handleTokenKeyDown(playerId, 'court', event)}
          />
          {notice && (
            <p
              key={notice.seq}
              role={notice.tone === 'error' ? 'alert' : undefined}
              className={[
                'pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-[0_8px_24px_rgb(0_0_0/0.5)]',
                'animate-rise motion-reduce:animate-none',
                notice.tone === 'error' ? 'bg-coyote-orange text-coyote-black' : 'bg-coyote-silver text-coyote-black',
              ].join(' ')}
            >
              {notice.text}
            </p>
          )}
        </div>

        <Bench
          players={bench}
          total={benchAll.length}
          filter={benchFilter}
          onFilterChange={setBenchFilter}
          selectedId={selectedId}
          draggingId={drag.dragging?.playerId ?? null}
          highlighted={drag.overBench}
          canReceive={selectedOnCourt}
          focusRequest={focusRequest?.area === 'bench' ? focusRequest : null}
          benchRef={benchRef}
          bind={drag.bind}
          onTap={handleBenchTap}
          onTokenClick={(playerId, event) => handleTokenClick(playerId, 'bench', event)}
          onTokenKeyDown={(playerId, event) => handleTokenKeyDown(playerId, 'bench', event)}
        />
      </div>

      {/* Ficha que sigue al puntero mientras se arrastra */}
      {drag.dragging && byId.get(drag.dragging.playerId) && (
        <div
          ref={drag.ghostRef}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-50 flex flex-col items-center will-change-transform"
        >
          <TokenFace player={byId.get(drag.dragging.playerId) as Player} lifted />
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {sheetContent}
    </FullscreenDialog>
  )
}
