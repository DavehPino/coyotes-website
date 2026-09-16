// Borrador del formulario de jugador (alta y edición): estado, validación y payload para la API.
import { PLAYER_NAME_MAX, type PlayerPosition } from '@shared/domain'
import type { Player, PlayerCreateInput, PlayerUpdateInput } from '@shared/schemas'

export type PlayerDraft = {
  name: string
  /** Texto del campo: vacío = sin número. */
  jerseyNumber: string
  primaryPosition: PlayerPosition | null
  secondaryPosition: PlayerPosition | null
  isActive: boolean
}

export type PlayerErrors = Partial<Record<'name' | 'jerseyNumber' | 'primaryPosition' | 'secondaryPosition', string>>

export const emptyPlayerDraft = (): PlayerDraft => ({
  name: '',
  jerseyNumber: '',
  primaryPosition: null,
  secondaryPosition: null,
  isActive: true,
})

export const draftFromPlayer = (player: Player): PlayerDraft => ({
  name: player.name,
  jerseyNumber: player.jersey_number === null ? '' : String(player.jersey_number),
  primaryPosition: player.primary_position,
  secondaryPosition: player.secondary_position,
  isActive: player.is_active,
})

/** Cambiar la principal a la que era secundaria deja la secundaria en «Ninguna». */
export function withPrimaryPosition(draft: PlayerDraft, position: PlayerPosition | null): PlayerDraft {
  return {
    ...draft,
    primaryPosition: position,
    secondaryPosition: draft.secondaryPosition === position ? null : draft.secondaryPosition,
  }
}

function parseJersey(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

/** `others`: el resto del plantel, para avisar antes de guardar si el número ya lo usa un activo. */
export function validatePlayer(draft: PlayerDraft, others: Player[]): PlayerErrors {
  const errors: PlayerErrors = {}
  const name = draft.name.trim()
  if (!name) errors.name = 'Escribe el nombre del jugador'
  else if (name.length > PLAYER_NAME_MAX) errors.name = `Máximo ${PLAYER_NAME_MAX} caracteres`

  const jersey = parseJersey(draft.jerseyNumber)
  if (jersey !== null) {
    if (!Number.isInteger(jersey) || jersey < 0 || jersey > 99) errors.jerseyNumber = 'Un número entero del 0 al 99'
    else if (draft.isActive) {
      const taken = others.find((player) => player.is_active && player.jersey_number === jersey)
      if (taken) errors.jerseyNumber = `El ${jersey} ya lo usa ${taken.name}`
    }
  }

  if (!draft.primaryPosition) errors.primaryPosition = 'Elige la posición principal'
  else if (draft.secondaryPosition === draft.primaryPosition) {
    errors.secondaryPosition = 'Tiene que ser distinta de la principal'
  }
  return errors
}

/** Solo con un borrador válido (validatePlayer sin errores). */
export function toPlayerCreateInput(draft: PlayerDraft): PlayerCreateInput {
  if (!draft.primaryPosition) throw new Error('Falta la posición principal')
  return {
    name: draft.name.trim(),
    jersey_number: parseJersey(draft.jerseyNumber),
    primary_position: draft.primaryPosition,
    secondary_position: draft.secondaryPosition,
  }
}

export const toPlayerUpdateInput = (id: string, draft: PlayerDraft): PlayerUpdateInput => ({
  ...toPlayerCreateInput(draft),
  id,
  is_active: draft.isActive,
})
