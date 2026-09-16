// Hooks de TanStack Query y escrituras de Alineación (plantel y formaciones).
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet } from '@/lib/api'
import type { Lineup, LineupSaveInput, Player, PlayerCreateInput, PlayerUpdateInput } from '@shared/schemas'
import { adminPost, isUnauthorized, safewordStore } from '../admin/adminApi'

export const lineupKeys = {
  players: ['lineup', 'players'] as const,
  lineups: ['lineup', 'lineups'] as const,
}

// Sin caché HTTP (lookups): el equipo lo consulta desde varios móviles y tiene que ver lo último.
export const usePlayers = () =>
  useQuery({
    queryKey: lineupKeys.players,
    queryFn: ({ signal }) => apiGet<Player[]>('/lookups/players', signal),
    staleTime: 30_000,
  })

export const useLineups = () =>
  useQuery({
    queryKey: lineupKeys.lineups,
    queryFn: ({ signal }) => apiGet<Lineup[]>('/lookups/lineups', signal),
    staleTime: 30_000,
  })

/** Tras cualquier escritura: el plantel y las formaciones se piden de nuevo (borrar un jugador cambia ambas). */
export function refreshLineupData(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: ['lineup'] })
}

export const createPlayer = (input: PlayerCreateInput, safeword: string) =>
  adminPost<Player>('/player-create', input, safeword)

export const updatePlayer = (input: PlayerUpdateInput, safeword: string) =>
  adminPost<Player>('/player-update', input, safeword)

export const deletePlayer = (id: string, safeword: string) => adminPost<{ ok: true }>('/player-delete', { id }, safeword)

export const saveLineup = (input: LineupSaveInput, safeword: string) =>
  adminPost<Lineup>('/lineup-save', input, safeword)

export const deleteLineup = (id: string, safeword: string) => adminPost<{ ok: true }>('/lineup-delete', { id }, safeword)

export const INVALID_SAFEWORD_NOTICE = 'La palabra clave ya no es válida. Escríbela de nuevo para continuar.'

/**
 * Palabra clave de carga para un diálogo: la recordada en el navegador o la que se pida con SafewordStep.
 * `run` ejecuta una escritura; si falta la palabra o el servidor la rechaza, pide escribirla y devuelve false.
 */
export function useAdminSafeword() {
  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [notice, setNotice] = useState<string | null>(null)

  function forget(message: string) {
    safewordStore.clear()
    setSafeword(null)
    setNotice(message)
  }

  return {
    safeword,
    notice,
    /** SafewordStep la validó: se recuerda para las siguientes escrituras. */
    accept(value: string) {
      safewordStore.set(value)
      setSafeword(value)
      setNotice(null)
    },
    async run(write: (safeword: string) => Promise<unknown>): Promise<boolean> {
      // Del almacén y no del estado: puede haberse aceptado en este mismo evento.
      const current = safewordStore.get() ?? safeword
      if (!current) {
        forget('Escribe la palabra clave para guardar.')
        return false
      }
      try {
        await write(current)
        return true
      } catch (err) {
        if (!isUnauthorized(err)) throw err
        forget(INVALID_SAFEWORD_NOTICE)
        return false
      }
    },
  }
}
