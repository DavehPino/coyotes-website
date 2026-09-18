import type { FormEvent, ReactNode } from 'react'
import type { TeamSummary } from '@shared/schemas'
import { NewTeamFields } from '../../admin/NewTeamFields'
import { useRivalTeams, type NewTeamDraft } from '../../admin/teams'
import { ErrorState, Field, Select, Skeleton, TeamLogo } from '../../ui'
import type { Errors, TeamDraft } from './draft'

type TeamStepProps = {
  formId: string
  team: TeamDraft
  errors: Errors
  onChange: (patch: Partial<TeamDraft>) => void
  onSubmit: (rivals: TeamSummary[]) => void
}

function ModeOption({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <label
      className={[
        'flex min-h-11 cursor-pointer items-center justify-center rounded-sm px-3 text-sm font-medium select-none md:min-h-10',
        'transition-[background-color,color] duration-150 ease-out',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink',
        checked ? 'bg-floor-deep text-ink' : 'text-ink-soft hover:text-ink',
      ].join(' ')}
    >
      <input type="radio" name="team-mode" checked={checked} onChange={onSelect} className="sr-only" />
      {children}
    </label>
  )
}

/** Paso 1: elegir un rival existente o crear uno nuevo. */
export function TeamStep({ formId, team, errors, onChange, onSubmit }: TeamStepProps) {
  const rivals = useRivalTeams()
  const list = rivals.data ?? []
  const selected = list.find((rival) => rival.id === team.teamId) ?? null
  const hasRivals = list.length > 0
  const mode = hasRivals ? team.mode : 'new'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(list)
  }

  if (rivals.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy aria-label="Cargando equipos">
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-11 rounded-sm" />
        <Skeleton className="h-20 rounded-md" />
      </div>
    )
  }

  if (rivals.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los equipos"
        message={rivals.error.message}
        onRetry={() => void rivals.refetch()}
        retrying={rivals.isFetching}
        className="py-8"
      />
    )
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {hasRivals && (
        <fieldset>
          <legend className="sr-only">Contra quién se jugó</legend>
          {/* Radio exterior 12 px = interior 8 px + 4 px de padding */}
          <div className="grid grid-cols-2 gap-1 rounded-md bg-line/40 p-1 shadow-tape">
            <ModeOption checked={mode === 'new'} onSelect={() => onChange({ mode: 'new' })}>
              Equipo nuevo
            </ModeOption>
            <ModeOption checked={mode === 'existing'} onSelect={() => onChange({ mode: 'existing' })}>
              Equipo existente
            </ModeOption>
          </div>
        </fieldset>
      )}

      {mode === 'existing' ? (
        <>
          <Field label="Rival" error={errors.teamId}>
            <Select data-autofocus value={team.teamId} onChange={(event) => onChange({ teamId: event.target.value })}>
              <option value="">Elige un equipo</option>
              {list.map((rival) => (
                <option key={rival.id} value={rival.id}>
                  {rival.name}
                </option>
              ))}
            </Select>
          </Field>
          {selected && (
            <div className="flex items-center gap-3 rounded-md bg-floor-deep/40 p-3 shadow-tape">
              <TeamLogo team={selected} size="lg" />
              <span className="font-medium text-ink">{selected.name}</span>
            </div>
          )}
        </>
      ) : (
        <NewTeamFields
          autoFocus
          team={team.newTeam}
          errors={errors}
          onChange={(patch: Partial<NewTeamDraft>) => onChange({ newTeam: { ...team.newTeam, ...patch } })}
        />
      )}
    </form>
  )
}
