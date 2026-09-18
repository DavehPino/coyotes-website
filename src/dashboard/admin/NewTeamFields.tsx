import type { TeamSummary } from '@shared/schemas'
import { Field, Input, TeamLogo } from '../ui'
import type { NewTeamDraft, NewTeamErrors } from './teams'

type NewTeamFieldsProps = {
  team: NewTeamDraft
  errors: NewTeamErrors
  onChange: (patch: Partial<NewTeamDraft>) => void
  /** Enfoca el nombre al aparecer (p.ej. al elegir "Nuevo equipo" en un selector). */
  autoFocus?: boolean
}

/** Nombre, abreviatura y logo de un rival nuevo, con vista previa del escudo. */
export function NewTeamFields({ team, errors, onChange, autoFocus }: NewTeamFieldsProps) {
  const preview: TeamSummary = {
    id: 'preview',
    name: team.name.trim() || 'Equipo rival',
    short_name: team.shortName.trim() || null,
    logo_url: team.logoUrl.trim() || null,
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nombre del equipo" error={errors.name}>
        <Input
          data-autofocus={autoFocus || undefined}
          autoFocus={autoFocus}
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
      <div className="flex items-center gap-3 rounded-md bg-floor-deep/40 p-3 shadow-tape">
        {/* key: si cambia la URL se vuelve a intentar cargar el logo */}
        <TeamLogo key={preview.logo_url ?? ''} team={preview} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium tracking-wide text-ink-soft uppercase">Vista previa</span>
          <span className="truncate font-medium text-ink">{preview.name}</span>
        </div>
      </div>
    </div>
  )
}
