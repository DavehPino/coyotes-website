import { useEffect, useState, type ReactNode } from 'react'
import { ACTIVITY_TYPE_LABELS } from '@shared/domain'
import type { Activity } from '@shared/schemas'
import { formatDateFull, formatTimeRange } from '@/lib/dates'
import { Chip, Modal, TeamLogo } from '../ui'

type ActivityDetailModalProps = {
  activity: Activity | null
  onClose: () => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium tracking-wide text-coyote-ash uppercase">{label}</dt>
      <dd className="text-coyote-silver">{children}</dd>
    </div>
  )
}

/** Detalle de solo lectura con todos los campos de la actividad. */
export function ActivityDetailModal({ activity, onClose }: ActivityDetailModalProps) {
  // Se conserva la última actividad mientras el diálogo termina su animación de salida.
  const [shown, setShown] = useState<Activity | null>(activity)
  useEffect(() => {
    if (activity) setShown(activity)
  }, [activity])

  const time = shown ? formatTimeRange(shown.start_time, shown.end_time) : null

  return (
    <Modal
      open={activity !== null}
      onClose={onClose}
      title={shown?.title ?? ''}
      eyebrow={shown?.category === 'podio' && <Chip tone="podio">Podio</Chip>}
    >
      {shown && (
        <dl className="flex flex-col gap-4">
          {shown.activity_type !== 'otro' && <Field label="Tipo">{ACTIVITY_TYPE_LABELS[shown.activity_type]}</Field>}
          <Field label="Fecha">{formatDateFull(shown.activity_date)}</Field>
          <Field label="Horario">
            <span className="tabular-nums">{time ?? 'Hora por confirmar'}</span>
          </Field>
          {shown.location && <Field label="Lugar">{shown.location}</Field>}
          {shown.opponent && (
            <Field label="Rival">
              <span className="inline-flex items-center gap-2">
                <TeamLogo team={shown.opponent} size="md" />
                {shown.opponent.name}
              </span>
            </Field>
          )}
          {shown.description && (
            <Field label="Descripción">
              <span className="whitespace-pre-line">{shown.description}</span>
            </Field>
          )}
        </dl>
      )}
    </Modal>
  )
}
