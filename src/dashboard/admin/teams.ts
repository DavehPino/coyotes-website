// Rivales para los formularios de alta y el borrador de un equipo nuevo.
import { queryOptions, useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import type { NewTeamInput, TeamSummary } from '@shared/schemas'

export const rivalsKey = ['teams', 'rivals'] as const

/** Siempre frescos: puede haberse creado un rival hace un momento desde otro formulario. */
export function rivalTeamsOptions() {
  return queryOptions({
    queryKey: rivalsKey,
    queryFn: ({ signal }) => apiGet<TeamSummary[]>('/lookups/teams', signal),
    staleTime: 0,
  })
}

/** `enabled: false` evita pedirlos hasta que el formulario los necesita. */
export const useRivalTeams = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...rivalTeamsOptions(), enabled })

/** Valor del selector de rival para "crear uno nuevo" (RivalField). */
export const NEW_TEAM = '__new__'

export type NewTeamDraft = { name: string; shortName: string; logoUrl: string }

export const emptyNewTeam = (): NewTeamDraft => ({ name: '', shortName: '', logoUrl: '' })

export type NewTeamErrors = Partial<Record<keyof NewTeamDraft, string>>

const normalizeName = (name: string) => name.trim().toLocaleLowerCase('es')

function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function validateNewTeam(team: NewTeamDraft, rivals: TeamSummary[]): NewTeamErrors {
  const errors: NewTeamErrors = {}
  const name = team.name.trim()
  if (!name) errors.name = 'Escribe el nombre del equipo'
  else if (name.length > 80) errors.name = 'Máximo 80 caracteres'
  else if (rivals.some((rival) => normalizeName(rival.name) === normalizeName(name))) {
    errors.name = 'Ese equipo ya existe: elígelo en la lista'
  }
  if (team.shortName.trim().length > 4) errors.shortName = 'Máximo 4 caracteres'
  const logoUrl = team.logoUrl.trim()
  if (logoUrl && !isHttpUrl(logoUrl)) errors.logoUrl = 'Tiene que ser un enlace que empiece por https://'
  return errors
}

export function toNewTeamInput(team: NewTeamDraft): NewTeamInput {
  return {
    name: team.name.trim(),
    short_name: team.shortName.trim() || null,
    logo_url: team.logoUrl.trim() || null,
  }
}
