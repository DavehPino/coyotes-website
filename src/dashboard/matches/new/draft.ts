// Borrador del formulario de alta de partido: estado de cada paso, validación y payload para la API.
// Los mensajes de error son para la persona que carga los datos; la API vuelve a validar todo.
import { todayIsoDate } from '@shared/dates'
import {
  MAX_SETS,
  MAX_VIDEO_BYTES,
  MATCH_COMPETITIONS,
  VIDEO_FILE_EXTENSIONS,
  type MatchCompetition,
} from '@shared/domain'
import type { MatchCreateInput, SetScore, TeamSummary } from '@shared/schemas'
import { formatBytes } from '@/lib/format'
import { emptyNewTeam, toNewTeamInput, validateNewTeam, type NewTeamDraft } from '../../admin/teams'

export type TeamDraft = {
  mode: 'existing' | 'new'
  teamId: string
  newTeam: NewTeamDraft
}

export type SetDraft = { key: number; us: string; them: string }

export type MatchDraft = {
  playedOn: string
  startTime: string
  competition: MatchCompetition
  phase: string
  location: string
  sets: SetDraft[]
}

export type VideoDraft = {
  key: string
  file: File
  title: string
  /** null = partido completo, resumen u otro. */
  setNumber: number | null
}

export type Draft = { team: TeamDraft; match: MatchDraft; videos: VideoDraft[] }

export type Errors = Partial<Record<string, string>>

let nextKey = 0
export const newKey = () => ++nextKey

/** Tres sets vacíos para empezar: lo mínimo de un partido a cinco sets. */
export function initialDraft(): Draft {
  return {
    team: { mode: 'new', teamId: '', newTeam: emptyNewTeam() },
    match: {
      playedOn: todayIsoDate(),
      startTime: '',
      competition: MATCH_COMPETITIONS[0],
      phase: '',
      location: '',
      sets: Array.from({ length: 3 }, () => ({ key: newKey(), us: '', them: '' })),
    },
    videos: [],
  }
}

export function validateTeam(team: TeamDraft, rivals: TeamSummary[]): Errors {
  if (team.mode === 'existing') {
    return rivals.some((rival) => rival.id === team.teamId) ? {} : { teamId: 'Elige el equipo rival' }
  }
  return validateNewTeam(team.newTeam, rivals)
}

/** Filas con los dos marcadores vacíos se ignoran; el resto tiene que estar completo. */
export function filledSets(sets: SetDraft[]): SetDraft[] {
  return sets.filter((set) => set.us !== '' || set.them !== '')
}

export function toSetScores(sets: SetDraft[]): SetScore[] {
  return filledSets(sets).map((set) => ({ us: Number(set.us), them: Number(set.them) }))
}

export const setErrorKey = (key: number) => `set-${key}`

export function validateMatch(match: MatchDraft): Errors {
  const errors: Errors = {}
  if (!match.playedOn) errors.playedOn = 'Elige la fecha del partido'
  else if (match.playedOn > todayIsoDate()) errors.playedOn = 'La fecha no puede ser futura'

  const filled = filledSets(match.sets)
  if (filled.length === 0) errors.sets = 'Carga al menos un set con su marcador'
  for (const set of filled) {
    if (set.us === '' || set.them === '') errors[setErrorKey(set.key)] = 'Completa los dos marcadores'
    else if (set.us === set.them) errors[setErrorKey(set.key)] = 'Un set no puede terminar empatado'
  }
  return errors
}

export function toMatchInput(draft: Draft): MatchCreateInput {
  const { team, match } = draft
  return {
    opponent:
      team.mode === 'existing'
        ? { kind: 'existing', team_id: team.teamId }
        : { kind: 'new', team: toNewTeamInput(team.newTeam) },
    played_on: match.playedOn,
    start_time: match.startTime || null,
    location: match.location.trim() || null,
    competition: match.competition,
    phase: match.phase.trim() || null,
    set_scores: toSetScores(match.sets).slice(0, MAX_SETS),
  }
}

export const VIDEO_ACCEPT = ['video/*', ...VIDEO_FILE_EXTENSIONS].join(',')

export function videoFileError(file: File): string | null {
  const name = file.name.toLowerCase()
  if (!VIDEO_FILE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return `${file.name}: formato no admitido (usa MP4, MOV, M4V, WEBM o MKV)`
  }
  if (file.size === 0) return `${file.name}: el archivo está vacío`
  if (file.size > MAX_VIDEO_BYTES) return `${file.name}: pesa más de ${formatBytes(MAX_VIDEO_BYTES)}`
  return null
}

/** "set-2 final.mp4" → { title: "Set 2", setNumber: 2 } · "resumen.mov" → { title: "resumen", setNumber: null } */
export function videoDraftFrom(file: File): VideoDraft {
  const stem = file.name.replace(/\.[^.]+$/, '')
  const setMatch = /^set[-_ ]?([1-5])(?!\d)/i.exec(stem)
  const setNumber = setMatch ? Number(setMatch[1]) : null
  const title = setNumber ? `Set ${setNumber}` : stem.replace(/[_-]+/g, ' ').trim() || 'Video'
  return { key: `${file.name}-${file.size}-${file.lastModified}-${newKey()}`, file, title: title.slice(0, 120), setNumber }
}

export function validateVideos(videos: VideoDraft[]): Errors {
  const errors: Errors = {}
  for (const video of videos) {
    if (!video.title.trim()) errors[video.key] = 'Ponle un título al video'
  }
  return errors
}
