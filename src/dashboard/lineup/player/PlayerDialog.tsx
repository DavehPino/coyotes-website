import { useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import type { Lineup, Player } from '@shared/schemas'
import { errorMessage } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { Button, Field, FormError, Input, Modal } from '../../ui'
import { CheckIcon, TrashIcon } from '../../ui/icons'
import { createPlayer, deletePlayer, refreshLineupData, updatePlayer, useAdminSafeword } from '../api'
import { JerseyBadge, PlayerPositions } from '../PlayerChip'
import { PositionPicker } from '../PositionPicker'
import {
  draftFromPlayer,
  emptyPlayerDraft,
  toPlayerCreateInput,
  toPlayerUpdateInput,
  validatePlayer,
  withPrimaryPosition,
  type PlayerDraft,
  type PlayerErrors,
} from './draft'

type Step = 'form' | 'confirm-delete' | 'done'

type PlayerDialogProps = {
  open: boolean
  /** null: alta de un jugador nuevo. */
  player: Player | null
  players: Player[]
  lineups: Lineup[]
  /** `finished`: se guardó algo y la próxima apertura empieza de cero. */
  onClose: (finished: boolean) => void
  /** Carga otro jugador sin cerrar el diálogo. */
  onRestart: () => void
}

/** Alta y edición de un jugador del plantel, con la palabra clave de carga y el borrado con confirmación. */
export default function PlayerDialog({ open, player, players, lineups, onClose, onRestart }: PlayerDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const auth = useAdminSafeword()
  const [step, setStep] = useState<Step>('form')
  const [verifying, setVerifying] = useState(false)
  const [draft, setDraft] = useState<PlayerDraft>(() => (player ? draftFromPlayer(player) : emptyPlayerDraft()))
  const [errors, setErrors] = useState<PlayerErrors>({})
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [created, setCreated] = useState<Player | null>(null)

  const isEdit = player !== null
  const others = players.filter((other) => other.id !== player?.id)
  const inLineups = player ? lineups.filter((lineup) => lineup.slots.some((slot) => slot.player_id === player.id)) : []
  const patch = (changes: Partial<PlayerDraft>) => setDraft((prev) => ({ ...prev, ...changes }))

  async function write(action: (safeword: string) => Promise<unknown>, after: () => void) {
    setBusy(true)
    setSaveError(null)
    try {
      if (await auth.run(action)) {
        await refreshLineupData(queryClient).catch(() => undefined)
        after()
      }
    } catch (err) {
      setSaveError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validatePlayer(draft, others)
    setErrors(found)
    setSaveError(null)
    if (Object.keys(found).length > 0) return

    if (player) {
      void write(
        (safeword) => updatePlayer(toPlayerUpdateInput(player.id, draft), safeword),
        () => onClose(true),
      )
    } else {
      let saved: Player | null = null
      void write(
        async (safeword) => {
          saved = await createPlayer(toPlayerCreateInput(draft), safeword)
        },
        () => {
          setCreated(saved)
          setStep('done')
        },
      )
    }
  }

  function handleDelete() {
    if (!player) return
    void write(
      (safeword) => deletePlayer(player.id, safeword),
      () => onClose(true),
    )
  }

  const needsSafeword = auth.safeword === null
  const dismissible = !busy && !verifying
  const handleClose = () => dismissible && onClose(created !== null)

  let title: ReactNode = isEdit ? 'Editar jugador' : 'Cargar jugador'
  let meta: ReactNode = null
  let footer: ReactNode
  if (needsSafeword) {
    meta = null
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={verifying}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={verifying}>
          {verifying ? 'Comprobando…' : 'Continuar'}
        </Button>
      </>
    )
  } else if (step === 'confirm-delete') {
    title = 'Borrar jugador'
    footer = (
      <>
        <Button variant="ghost" onClick={() => setStep('form')} disabled={busy}>
          Volver
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={busy} className="pr-4 pl-3.5">
          <TrashIcon className="size-4" strokeWidth={2} />
          {busy ? 'Borrando…' : 'Borrar'}
        </Button>
      </>
    )
  } else if (step === 'done') {
    title = 'Jugador cargado'
    footer = (
      <>
        <Button variant="ghost" onClick={onRestart}>
          Cargar otro
        </Button>
        <Button variant="primary" onClick={() => onClose(true)}>
          Listo
        </Button>
      </>
    )
  } else {
    footer = (
      <>
        {isEdit && (
          <Button
            variant="danger"
            onClick={() => setStep('confirm-delete')}
            disabled={busy}
            className="mr-auto pr-3.5 pl-3"
          >
            <TrashIcon className="size-4" strokeWidth={2} />
            Borrar jugador
          </Button>
        )}
        <Button variant="ghost" onClick={handleClose} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={busy}>
          {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar jugador'}
        </Button>
      </>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      meta={meta}
      footer={footer}
      dismissible={dismissible}
      scrollResetKey={needsSafeword ? 'safeword' : step}
    >
      {needsSafeword && (
        <SafewordStep formId={formId} notice={auth.notice} onBusyChange={setVerifying} onVerified={auth.accept} />
      )}

      {!needsSafeword && step === 'form' && (
        <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
            <Field label="Nombre" error={errors.name}>
              <Input
                data-autofocus
                value={draft.name}
                maxLength={60}
                autoComplete="off"
                placeholder="Juan Pérez"
                onChange={(event) => patch({ name: event.target.value })}
              />
            </Field>
            <Field label="Número" optional error={errors.jerseyNumber}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                step={1}
                value={draft.jerseyNumber}
                placeholder="7"
                className="tabular-nums"
                onChange={(event) => patch({ jerseyNumber: event.target.value })}
              />
            </Field>
          </div>

          <PositionPicker
            label="Posición principal"
            value={draft.primaryPosition}
            error={errors.primaryPosition}
            onChange={(position) => setDraft((prev) => withPrimaryPosition(prev, position))}
          />

          <PositionPicker
            label="Posición secundaria"
            optional
            allowNone
            value={draft.secondaryPosition}
            disabledPosition={draft.primaryPosition}
            error={errors.secondaryPosition}
            onChange={(position) => patch({ secondaryPosition: position })}
          />

          {isEdit && (
            <ActiveSwitch checked={draft.isActive} onChange={(isActive) => patch({ isActive })} />
          )}

          {saveError && <FormError>{saveError}</FormError>}
        </form>
      )}

      {!needsSafeword && step === 'confirm-delete' && player && (
        <div className="flex flex-col gap-3">
          <PlayerSummary player={player} />
          <p className="text-sm text-ink">
            Se borra del plantel para siempre.
            {inLineups.length > 0 && (
              <>
                {' '}
                También sale de {inLineups.length === 1 ? 'la formación' : `${inLineups.length} formaciones`}:{' '}
                <strong className="font-semibold">{inLineups.map((lineup) => lineup.name).join(', ')}</strong>.
              </>
            )}
          </p>
          <p className="text-sm text-ink-soft">Si solo deja de venir, mejor márcalo como inactivo.</p>
          {saveError && <FormError>{saveError}</FormError>}
        </div>
      )}

      {!needsSafeword && step === 'done' && created && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-md bg-paper-deep/40 p-3 shadow-outline">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-key text-on-key">
              <CheckIcon className="size-5" strokeWidth={2} />
            </span>
            <PlayerSummary player={created} />
          </div>
          <p className="text-sm text-ink-soft">Ya aparece en el plantel y en el banco de la cancha.</p>
        </div>
      )}
    </Modal>
  )
}

function PlayerSummary({ player }: { player: Player }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <JerseyBadge player={player} />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium text-ink">{player.name}</span>
        <PlayerPositions player={player} />
      </div>
    </div>
  )
}

function ActiveSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-paper-deep/40 p-3 shadow-outline">
      <div className="flex min-w-0 flex-col">
        <span id={`${id}-label`} className="text-sm font-medium text-ink">
          Activo
        </span>
        <span id={`${id}-hint`} className="text-xs text-ink-soft">
          Los inactivos no aparecen en el banco ni pueden estar en cancha.
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        onClick={() => onChange(!checked)}
        className="group relative inline-flex h-11 w-14 shrink-0 items-center justify-center"
      >
        <span
          aria-hidden
          className={[
            'h-7 w-12 rounded-full transition-colors duration-150 ease-out',
            checked ? 'bg-ink' : 'bg-ink/20',
          ].join(' ')}
        />
        <span
          aria-hidden
          className={[
            'absolute top-1/2 left-2 size-5 -translate-y-1/2 rounded-full bg-ink shadow transition-transform duration-150 ease-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  )
}
