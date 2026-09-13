// Semana activa del tablero: viaja en la URL como ?week=YYYY-MM-DD (lunes).
import { addDays, isIsoDate, mondayOf, todayIsoDate } from '@shared/dates'

export const WEEK_PARAM = 'week'

export function currentWeekStart(): string {
  return mondayOf(todayIsoDate())
}

/** Lunes de la semana pedida en la URL; con un valor ausente o inválido, la semana actual. */
export function weekFromSearch(params: URLSearchParams): string {
  const raw = params.get(WEEK_PARAM)
  return raw && isIsoDate(raw) ? mondayOf(raw) : currentWeekStart()
}

/** Los 7 días de la semana (lunes → domingo) como "YYYY-MM-DD". */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}
