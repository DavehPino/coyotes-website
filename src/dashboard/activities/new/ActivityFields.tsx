import { todayIsoDate } from '@shared/dates'
import { ACTIVITY_CATEGORIES, ACTIVITY_CATEGORY_LABELS, type ActivityCategory } from '@shared/domain'
import { RivalField } from '../../admin/RivalField'
import type { NewTeamDraft } from '../../admin/teams'
import { Field, Input, Select, Textarea } from '../../ui'
import type { ActivityDraft, ActivityErrors } from './draft'

type ActivityFieldsProps = {
  draft: ActivityDraft
  errors: ActivityErrors
  onChange: (patch: Partial<ActivityDraft>) => void
}

/** Campos de una actividad, compartidos por el alta y la edición. Van dentro de un `<form>` de quien los usa. */
export function ActivityFields({ draft, errors, onChange }: ActivityFieldsProps) {
  const patchNewTeam = (patch: Partial<NewTeamDraft>) => onChange({ newTeam: { ...draft.newTeam, ...patch } })

  return (
    <>
      <Field label="Título" error={errors.title}>
        <Input
          data-autofocus
          autoFocus
          value={draft.title}
          maxLength={120}
          placeholder="Entrenamiento técnico"
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </Field>

      <Field label="Descripción" optional>
        <Textarea
          value={draft.description}
          maxLength={2000}
          placeholder="Qué hay que traer, horario de llegada…"
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" error={errors.date}>
          <Input
            type="date"
            min={todayIsoDate()}
            value={draft.date}
            onChange={(event) => onChange({ date: event.target.value })}
          />
        </Field>
        <Field label="Hora" error={errors.time}>
          <Input type="time" value={draft.time} onChange={(event) => onChange({ time: event.target.value })} />
        </Field>
      </div>

      <Field label="Categoría" hint="Las de Liga Podio se destacan y van primero en el carrusel.">
        <Select
          value={draft.category}
          onChange={(event) => onChange({ category: event.target.value as ActivityCategory })}
        >
          {ACTIVITY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {ACTIVITY_CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
      </Field>

      <RivalField
        allowNone
        value={draft.teamChoice}
        onChange={(teamChoice) => onChange({ teamChoice })}
        newTeam={draft.newTeam}
        onNewTeamChange={patchNewTeam}
        errors={errors}
      />

      <Field label="Lugar" optional>
        <Input
          value={draft.location}
          maxLength={120}
          placeholder="Gimnasio o club"
          onChange={(event) => onChange({ location: event.target.value })}
        />
      </Field>
    </>
  )
}
