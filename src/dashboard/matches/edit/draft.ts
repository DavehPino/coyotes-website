// Borrador de la edición de un partido: parte de los datos guardados y reutiliza las reglas del alta.
import type { MatchDetail, MatchUpdateInput, TeamSummary } from '@shared/schemas'
import { emptyNewTeam, NEW_TEAM, toNewTeamInput, validateNewTeam, type NewTeamDraft } from '../../admin/teams'
import { newKey, toSetScores, validateMatch, type Errors, type MatchDraft } from '../new/draft'

export type MatchEditDraft = {
  /** id de un equipo existente · NEW_TEAM */
  teamChoice: string
  newTeam: NewTeamDraft
  match: MatchDraft
}

export function draftFromMatch(match: MatchDetail): MatchEditDraft {
  const sets = match.set_scores.map((set) => ({ key: newKey(), us: String(set.us), them: String(set.them) }))
  return {
    teamChoice: match.opponent.id,
    newTeam: emptyNewTeam(),
    match: {
      playedOn: match.played_on,
      startTime: match.start_time?.slice(0, 5) ?? '',
      competitionId: match.competition?.id ?? '',
      phase: match.phase ?? '',
      location: match.location ?? '',
      sets: sets.length > 0 ? sets : [{ key: newKey(), us: '', them: '' }],
    },
  }
}

export function validateMatchEdit(draft: MatchEditDraft, rivals: TeamSummary[]): Errors {
  const errors: Errors = validateMatch(draft.match)
  if (draft.teamChoice === NEW_TEAM) Object.assign(errors, validateNewTeam(draft.newTeam, rivals))
  else if (!draft.teamChoice) errors.teamChoice = 'Elige el equipo rival'
  else if (!rivals.some((rival) => rival.id === draft.teamChoice)) errors.teamChoice = 'Ese equipo ya no existe: elige otro'
  return errors
}

export function toMatchUpdateInput(id: string, draft: MatchEditDraft): MatchUpdateInput {
  const { match } = draft
  return {
    id,
    opponent:
      draft.teamChoice === NEW_TEAM
        ? { kind: 'new', team: toNewTeamInput(draft.newTeam) }
        : { kind: 'existing', team_id: draft.teamChoice },
    played_on: match.playedOn,
    start_time: match.startTime || null,
    location: match.location.trim() || null,
    competition_id: match.competitionId,
    phase: match.phase.trim() || null,
    set_scores: toSetScores(match.sets),
  }
}

/** Nombre del rival para las etiquetas de los parciales mientras se edita. */
export function rivalNameOf(draft: MatchEditDraft, rivals: TeamSummary[]): string {
  const name =
    draft.teamChoice === NEW_TEAM
      ? draft.newTeam.name.trim()
      : rivals.find((rival) => rival.id === draft.teamChoice)?.name
  return name || 'Rival'
}
