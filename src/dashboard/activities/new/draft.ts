// Borrador del formulario de alta de actividad: estado, validación y payload para la API.
import { todayIsoDate } from '@shared/dates'
import type { ActivityCategory } from '@shared/domain'
import type { ActivityCreateInput, TeamSummary } from '@shared/schemas'
import { emptyNewTeam, toNewTeamInput, validateNewTeam, type NewTeamDraft } from '../../admin/teams'

/** Valor del selector de rival para "crear uno nuevo". El vacío es "sin rival". */
export const NEW_TEAM = '__new__'

export type ActivityDraft = {
  title: string
  description: string
  date: string
  time: string
  category: ActivityCategory
  /** '' = sin rival · id de un equipo existente · NEW_TEAM */
  teamChoice: string
  newTeam: NewTeamDraft
  location: string
}

export type ActivityErrors = Partial<Record<string, string>>

export function initialActivityDraft(): ActivityDraft {
  return {
    title: '',
    description: '',
    date: todayIsoDate(),
    time: '',
    category: 'general',
    teamChoice: '',
    newTeam: emptyNewTeam(),
    location: '',
  }
}

function currentTime(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/**
 * Solo actividades futuras: el carrusel oculta las que ya empezaron (sin hora de fin, cuenta la de inicio),
 * así que una de hoy con la hora pasada no aparecería nunca.
 */
export function validateActivity(draft: ActivityDraft, rivals: TeamSummary[], now = new Date()): ActivityErrors {
  const errors: ActivityErrors = {}
  const today = todayIsoDate(now)

  if (!draft.title.trim()) errors.title = 'Escribe un título'
  if (!draft.date) errors.date = 'Elige la fecha'
  else if (draft.date < today) errors.date = 'La fecha ya pasó'
  if (!draft.time) errors.time = 'Elige la hora'
  else if (draft.date === today && draft.time <= currentTime(now)) errors.time = 'Esa hora ya pasó'

  if (draft.teamChoice === NEW_TEAM) Object.assign(errors, validateNewTeam(draft.newTeam, rivals))
  else if (draft.teamChoice && !rivals.some((rival) => rival.id === draft.teamChoice)) {
    errors.teamChoice = 'Ese equipo ya no existe: elige otro'
  }
  return errors
}

export function toActivityInput(draft: ActivityDraft): ActivityCreateInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    activity_date: draft.date,
    start_time: draft.time,
    category: draft.category,
    opponent:
      draft.teamChoice === ''
        ? { kind: 'none' }
        : draft.teamChoice === NEW_TEAM
          ? { kind: 'new', team: toNewTeamInput(draft.newTeam) }
          : { kind: 'existing', team_id: draft.teamChoice },
    location: draft.location.trim() || null,
  }
}
