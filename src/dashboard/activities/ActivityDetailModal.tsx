import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { todayIsoDate } from '@shared/dates'
import { ACTIVITY_TYPE_LABELS } from '@shared/domain'
import type { Activity } from '@shared/schemas'
import { formatDateFull, formatTimeRange } from '@/lib/dates'
import { adminPost, errorMessage, isUnauthorized, safewordStore } from '../admin/adminApi'
import { SafewordStep } from '../admin/SafewordStep'
import { NEW_TEAM, rivalsKey, useRivalTeams } from '../admin/teams'
import { Button, Chip, FormError, Modal, TeamLogo } from '../ui'
import { PencilIcon, TrashIcon } from '../ui/icons'
import { activitiesKeys, refreshUpcomingActivities } from './api'
import { ActivityFields } from './new/ActivityFields'
import {
  draftFromActivity,
  toActivityUpdateInput,
  validateActivity,
  type ActivityDraft,
  type ActivityErrors,
} from './new/draft'

type ActivityDetailModalProps = {
  activity: Activity | null
  onClose: () => void
}

type Mode = 'view' | 'safeword' | 'edit' | 'delete'
type AdminMode = 'edit' | 'delete'

const SAFEWORD_REJECTED = 'La palabra clave ya no es válida. Escríbela de nuevo para continuar.'

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">{label}</dt>
      <dd className="text-coyote-silver">{children}</dd>
    </div>
  )
}

/** Detalle de la actividad. Con la palabra clave se puede editar o eliminar desde el mismo diálogo. */
export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  const formId = useId()
  const queryClient = useQueryClient()

  // Se conserva la última actividad mientras el diálogo termina su animación de salida.
  const [shown, setShown] = useState<Activity | null>(activity)
  const [mode, setMode] = useState<Mode>('view')
  const [afterSafeword, setAfterSafeword] = useState<AdminMode>('edit')
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [draft, setDraft] = useState<ActivityDraft | null>(null)
  const [errors, setErrors] = useState<ActivityErrors>({})
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!activity) return
    setShown(activity)
    setMode('view')
    setDraft(null)
    setErrors({})
    setActionError(null)
    setNotice(null)
  }, [activity])

  const rivals = useRivalTeams({ enabled: mode === 'edit' })

  function enter(next: AdminMode, current: Activity) {
    setActionError(null)
    setErrors({})
    if (next === 'edit') setDraft(draftFromActivity(current))
    if (!safewordStore.get()) {
      setAfterSafeword(next)
      setMode('safeword')
      return
    }
    setMode(next)
  }

  function requireSafeword(next: AdminMode, message: string) {
    safewordStore.clear()
    setNotice(message)
    setAfterSafeword(next)
    setMode('safeword')
  }

  /** Vuelve a pedir la lista saltando la caché HTTP; mientras tanto, la caché ya refleja el cambio. */
  function refreshList(update: (items: Activity[]) => Activity[]) {
    const today = todayIsoDate()
    queryClient.setQueryData<Activity[]>(activitiesKeys.upcoming(today), (items) => items && update(items))
    void refreshUpcomingActivities(queryClient, today).catch(() => undefined)
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!shown || !draft) return
    const found = validateActivity(draft, rivals.data ?? [])
    setErrors(found)
    setActionError(null)
    if (Object.keys(found).length > 0) return
    const safeword = safewordStore.get()
    if (!safeword) return requireSafeword('edit', 'Escribe la palabra clave para guardar.')

    setBusy(true)
    try {
      const updated = await adminPost<Activity>('/activity-update', toActivityUpdateInput(shown.id, draft), safeword)
      setShown(updated)
      setMode('view')
      refreshList((items) => items.map((item) => (item.id === updated.id ? updated : item)))
      if (draft.teamChoice === NEW_TEAM) void queryClient.invalidateQueries({ queryKey: rivalsKey })
    } catch (err) {
      if (isUnauthorized(err)) requireSafeword('edit', SAFEWORD_REJECTED)
      else setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!shown) return
    const safeword = safewordStore.get()
    if (!safeword) return requireSafeword('delete', 'Escribe la palabra clave para eliminar.')

    setBusy(true)
    setActionError(null)
    try {
      await adminPost('/activity-delete', { id: shown.id }, safeword)
      refreshList((items) => items.filter((item) => item.id !== shown.id))
      onClose()
    } catch (err) {
      if (isUnauthorized(err)) requireSafeword('delete', SAFEWORD_REJECTED)
      else setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const dismissible = !busy && !verifying
  const handleClose = () => dismissible && onClose()
  const dirty =
    shown !== null && draft !== null && JSON.stringify(draft) !== JSON.stringify(draftFromActivity(shown))

  let title: ReactNode = shown?.title ?? ''
  let eyebrow: ReactNode = shown?.category === 'podio' && <Chip tone="podio">Podio</Chip>
  let footer: ReactNode = null

  switch (mode) {
    case 'view':
      footer = shown && (
        <>
          <Button variant="ghost" onClick={() => enter('delete', shown)} className="mr-auto pr-3.5 pl-3">
            <TrashIcon className="size-4" />
            Eliminar
          </Button>
          <Button onClick={() => enter('edit', shown)} className="pr-4 pl-3.5">
            <PencilIcon className="size-4" />
            Editar
          </Button>
        </>
      )
      break
    case 'safeword':
      eyebrow = <Chip tone="ash">Acceso restringido</Chip>
      footer = (
        <>
          <Button variant="ghost" onClick={() => setMode('view')} disabled={verifying}>
            Volver
          </Button>
          <Button type="submit" form={formId} variant="primary" disabled={verifying}>
            {verifying ? 'Comprobando…' : 'Continuar'}
          </Button>
        </>
      )
      break
    case 'edit':
      title = 'Editar actividad'
      eyebrow = null
      footer = (
        <>
          <Button variant="ghost" onClick={() => setMode('view')} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="primary" disabled={busy || rivals.isPending || !dirty}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      )
      break
    case 'delete':
      eyebrow = <Chip tone="orange">Eliminar actividad</Chip>
      footer = (
        <>
          <Button variant="ghost" onClick={() => setMode('view')} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => void handleDelete()} disabled={busy}>
            {busy ? 'Eliminando…' : 'Eliminar actividad'}
          </Button>
        </>
      )
      break
  }

  const time = shown ? formatTimeRange(shown.start_time, shown.end_time) : null

  return (
    <Modal
      open={activity !== null}
      onClose={handleClose}
      title={title}
      eyebrow={eyebrow}
      footer={footer}
      dismissible={dismissible}
      scrollResetKey={mode}
    >
      {shown && mode === 'safeword' && (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            safewordStore.set(value)
            setNotice(null)
            setMode(afterSafeword)
          }}
        />
      )}

      {shown && mode === 'edit' && draft && (
        <form id={formId} onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <ActivityFields draft={draft} errors={errors} onChange={(patch) => setDraft({ ...draft, ...patch })} />
          {actionError && <FormError>{actionError}</FormError>}
        </form>
      )}

      {shown && mode === 'delete' && (
        <div className="flex flex-col gap-3">
          <p className="text-coyote-silver">
            Se elimina <span className="font-medium">{shown.title}</span> ({formatDateFull(shown.activity_date)}) y
            deja de aparecer en el carrusel. No se puede deshacer.
          </p>
          {actionError && <FormError>{actionError}</FormError>}
        </div>
      )}

      {shown && mode === 'view' && (
        <dl className="flex flex-col gap-4">
          {shown.activity_type !== 'otro' && (
            <DetailField label="Tipo">{ACTIVITY_TYPE_LABELS[shown.activity_type]}</DetailField>
          )}
          <DetailField label="Fecha">{formatDateFull(shown.activity_date)}</DetailField>
          <DetailField label="Horario">
            <span className="tabular-nums">{time ?? 'Hora por confirmar'}</span>
          </DetailField>
          {shown.location && <DetailField label="Lugar">{shown.location}</DetailField>}
          {shown.opponent && (
            <DetailField label="Rival">
              <span className="inline-flex items-center gap-2">
                <TeamLogo team={shown.opponent} size="md" />
                {shown.opponent.name}
              </span>
            </DetailField>
          )}
          {shown.description && (
            <DetailField label="Descripción">
              <span className="whitespace-pre-line">{shown.description}</span>
            </DetailField>
          )}
        </dl>
      )}
    </Modal>
  )
}
