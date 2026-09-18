import { useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { todayIsoDate } from '@shared/dates'
import type { Activity } from '@shared/schemas'
import { formatDateFull, formatTimeRange } from '@/lib/dates'
import { adminPost, errorMessage, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { SafewordStep } from '../../admin/SafewordStep'
import { NEW_TEAM, rivalsKey, useRivalTeams } from '../../admin/teams'
import { Button, Chip, FormError, Modal, TeamLogo } from '../../ui'
import { CheckIcon } from '../../ui/icons'
import { refreshUpcomingActivities } from '../api'
import { ActivityFields } from './ActivityFields'
import {
  initialActivityDraft,
  toActivityInput,
  validateActivity,
  type ActivityDraft,
  type ActivityErrors,
} from './draft'

type Step = 'safeword' | 'form' | 'done'

type NewActivityDialogProps = {
  open: boolean
  /** `finished`: la actividad ya se guardó y el formulario debe empezar vacío la próxima vez. */
  onClose: (finished: boolean) => void
  /** Empieza otra alta sin cerrar el diálogo. */
  onRestart: () => void
}

/** Alta de actividad: palabra clave (compartida con Partidos) y un único formulario. */
export default function NewActivityDialog({ open, onClose, onRestart }: NewActivityDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const rivals = useRivalTeams()
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [step, setStep] = useState<Step>(() => (safeword ? 'form' : 'safeword'))
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [draft, setDraft] = useState<ActivityDraft>(initialActivityDraft)
  const [errors, setErrors] = useState<ActivityErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [created, setCreated] = useState<Activity | null>(null)

  const patch = (changes: Partial<ActivityDraft>) => setDraft((prev) => ({ ...prev, ...changes }))

  function requireSafeword(message: string) {
    safewordStore.clear()
    setSafeword(null)
    setNotice(message)
    setStep('safeword')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validateActivity(draft, rivals.data ?? [])
    setErrors(found)
    setSaveError(null)
    if (Object.keys(found).length > 0) return
    if (!safeword) return requireSafeword('Escribe la palabra clave para guardar.')

    setSaving(true)
    try {
      const activity = await adminPost<Activity>('/activities', toActivityInput(draft), safeword)
      setCreated(activity)
      setStep('done')
      const today = todayIsoDate()
      void refreshUpcomingActivities(queryClient, today).catch(() => undefined)
      if (draft.teamChoice === NEW_TEAM) void queryClient.invalidateQueries({ queryKey: rivalsKey })
    } catch (err) {
      if (isUnauthorized(err)) requireSafeword('La palabra clave ya no es válida. Escríbela de nuevo para guardar.')
      else setSaveError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const dismissible = !saving && !verifying
  const handleClose = () => dismissible && onClose(created !== null)

  let title: ReactNode = 'Cargar actividad'
  let meta: ReactNode = null
  let footer: ReactNode = null
  if (step === 'safeword') {
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
  } else if (step === 'form') {
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={saving || rivals.isPending}>
          {saving ? 'Guardando…' : 'Guardar actividad'}
        </Button>
      </>
    )
  } else {
    title = 'Actividad cargada'
    footer = (
      <>
        <Button variant="ghost" onClick={onRestart}>
          Cargar otra
        </Button>
        <Button variant="primary" onClick={() => onClose(true)}>
          Listo
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
      scrollResetKey={step}
    >
      {step === 'safeword' && (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            safewordStore.set(value)
            setSafeword(value)
            setNotice(null)
            setStep('form')
          }}
        />
      )}

      {step === 'form' && (
        <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <ActivityFields draft={draft} errors={errors} onChange={patch} />
          {saveError && <FormError>{saveError}</FormError>}
        </form>
      )}

      {step === 'done' && created && <CreatedSummary activity={created} />}
    </Modal>
  )
}

function CreatedSummary({ activity }: { activity: Activity }) {
  const time = formatTimeRange(activity.start_time, activity.end_time)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 rounded-md bg-paper-deep/40 p-3 shadow-outline">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-key text-on-key">
          <CheckIcon className="size-5" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium text-ink">{activity.title}</span>
          <span className="text-sm text-ink-soft tabular-nums">
            {formatDateFull(activity.activity_date)}
            {time && ` · ${time}`}
          </span>
          {activity.opponent && (
            <span className="mt-1 flex items-center gap-2 text-sm text-ink">
              <TeamLogo team={activity.opponent} size="sm" />
              vs {activity.opponent.name}
            </span>
          )}
        </div>
        {activity.category === 'podio' && (
          <Chip tone="podio" className="ml-auto">
            Podio
          </Chip>
        )}
      </div>
      <p className="text-sm text-ink-soft">Ya aparece en el carrusel de próximas actividades.</p>
    </div>
  )
}
