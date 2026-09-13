import { Field, Select, Skeleton } from '../ui'
import { NewTeamFields } from './NewTeamFields'
import { NEW_TEAM, useRivalTeams, type NewTeamDraft, type NewTeamErrors } from './teams'

type RivalFieldProps = {
  /** '' = sin rival (solo con `allowNone`) · id de un equipo existente · NEW_TEAM */
  value: string
  onChange: (value: string) => void
  newTeam: NewTeamDraft
  onNewTeamChange: (patch: Partial<NewTeamDraft>) => void
  errors: NewTeamErrors & { teamChoice?: string }
  /** Permite guardar sin rival (actividades). */
  allowNone?: boolean
  autoFocus?: boolean
}

/** Selector de rival con la opción de crear uno nuevo, que despliega sus campos debajo. */
export function RivalField({ value, onChange, newTeam, onNewTeamChange, errors, allowNone, autoFocus }: RivalFieldProps) {
  const rivals = useRivalTeams()

  if (rivals.isPending) return <Skeleton className="h-[4.25rem] rounded-lg" />

  return (
    <>
      <Field
        label="Equipo rival"
        optional={allowNone}
        error={errors.teamChoice ?? (rivals.isError ? 'No se pudo cargar la lista de equipos' : null)}
      >
        <Select data-autofocus={autoFocus || undefined} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{allowNone ? 'Sin rival' : 'Elige un equipo'}</option>
          {rivals.data?.map((rival) => (
            <option key={rival.id} value={rival.id}>
              {rival.name}
            </option>
          ))}
          <option value={NEW_TEAM}>+ Nuevo equipo…</option>
        </Select>
      </Field>

      {value === NEW_TEAM && (
        <div className="rounded-xl bg-coyote-black/40 p-3 shadow-border">
          <NewTeamFields autoFocus team={newTeam} errors={errors} onChange={onNewTeamChange} />
        </div>
      )}
    </>
  )
}
