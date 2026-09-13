import type { FormEvent, ReactNode } from 'react'
import type { TeamSummary } from '@shared/schemas'
import { ErrorState, Field, Input, Select, Skeleton, TeamLogo } from '../../ui'
import { useRivalTeams } from '../api'
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
        'flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-medium select-none md:min-h-10',
        'transition-[background-color,color] duration-150 ease-out',
        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coyote-gold',
        checked ? 'bg-coyote-ember text-coyote-gold' : 'text-coyote-ash hover:text-coyote-silver',
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

  const preview: TeamSummary = {
    id: 'preview',
    name: team.name.trim() || 'Equipo rival',
    short_name: team.shortName.trim() || null,
    logo_url: team.logoUrl.trim() || null,
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(list)
  }

  if (rivals.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy aria-label="Cargando equipos">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-11 rounded-lg" />
        <Skeleton className="h-20 rounded-xl" />
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
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-coyote-black p-1 shadow-border">
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
            <div className="flex items-center gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
              <TeamLogo team={selected} size="lg" />
              <span className="font-medium text-coyote-silver">{selected.name}</span>
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Nombre" error={errors.name}>
            <Input
              data-autofocus
              value={team.name}
              maxLength={80}
              autoComplete="off"
              placeholder="Las Onas"
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Field label="Abreviatura" optional error={errors.shortName}>
              <Input
                value={team.shortName}
                maxLength={4}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="ONA"
                className="uppercase"
                onChange={(event) => onChange({ shortName: event.target.value })}
              />
            </Field>
            <Field
              label="URL del logo"
              optional
              error={errors.logoUrl}
              hint="Enlace directo a la imagen. Sin logo se muestran las iniciales."
            >
              <Input
                type="url"
                inputMode="url"
                value={team.logoUrl}
                autoComplete="off"
                placeholder="https://…"
                onChange={(event) => onChange({ logoUrl: event.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-coyote-black/60 p-3 shadow-border">
            {/* key: si cambia la URL se vuelve a intentar cargar el logo */}
            <TeamLogo key={preview.logo_url ?? ''} team={preview} size="lg" />
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium tracking-wide text-coyote-ash uppercase">Vista previa</span>
              <span className="truncate font-medium text-coyote-silver">{preview.name}</span>
            </div>
          </div>
        </>
      )}
    </form>
  )
}
