// Orden del carrusel de próximas actividades.
import type { Activity } from '@shared/schemas'
import { shortTime, todayIsoDate } from '@shared/dates'

function currentTime(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/** Ya terminó: día anterior a hoy, o de hoy con la hora de fin (o de inicio, si no hay fin) pasada. */
function hasEnded(activity: Activity, today: string, time: string): boolean {
  if (activity.activity_date !== today) return activity.activity_date < today
  const last = shortTime(activity.end_time ?? activity.start_time)
  return last !== null && last <= time
}

/**
 * Actividades que aún no han pasado, en orden cronológico (el que devuelve la API).
 * Se descartan las canceladas y las que ya terminaron hoy.
 */
export function filterUpcoming(items: Activity[], now = new Date()): Activity[] {
  const today = todayIsoDate(now)
  const time = currentTime(now)
  return items.filter((activity) => !activity.is_cancelled && !hasEnded(activity, today, time))
}

/**
 * Próximas actividades en orden cronológico, salvo la primera: si hay alguna de Liga Podio,
 * la más cercana de ellas pasa al frente; si no, queda la más cercana de todas.
 * `items` llega ordenado por fecha y hora desde la API.
 */
export function orderUpcoming(items: Activity[], now = new Date()): Activity[] {
  const upcoming = filterUpcoming(items, now)

  const podioIndex = upcoming.findIndex((activity) => activity.category === 'podio')
  if (podioIndex <= 0) return upcoming
  const podio = upcoming[podioIndex]!
  return [podio, ...upcoming.slice(0, podioIndex), ...upcoming.slice(podioIndex + 1)]
}
