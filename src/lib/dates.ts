// Formato de fechas en español para la interfaz. Las fechas llegan como "YYYY-MM-DD" y las
// horas como "HH:MM:SS", siempre locales: no se convierte de zona horaria.
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseIsoDate, shortTime } from '@shared/dates'

export { shortTime }

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function fmt(isoDate: string, pattern: string): string {
  return format(parseISO(isoDate), pattern, { locale: es })
}

/** "Domingo, 6 de septiembre de 2026" */
export function formatDateFull(isoDate: string): string {
  return capitalize(fmt(isoDate, "EEEE, d 'de' MMMM 'de' yyyy"))
}

/** "6 sep 2026" */
export function formatDateShort(isoDate: string): string {
  return fmt(isoDate, 'd MMM yyyy').replace('.', '')
}

/** "dom 6 sep" — filas compactas. */
export function formatDateCompact(isoDate: string): string {
  return fmt(isoDate, 'EEE d MMM').replaceAll('.', '')
}

/** "6 sep" — primera línea de las filas compactas. */
export function formatDayMonth(isoDate: string): string {
  return fmt(isoDate, 'd MMM').replaceAll('.', '')
}

/** "dom" — segunda línea de las filas compactas. */
export function formatWeekdayShort(isoDate: string): string {
  return fmt(isoDate, 'EEE').replaceAll('.', '')
}

/** "Septiembre 2026" — cabeceras de mes. */
export function formatMonthYear(isoDate: string): string {
  return capitalize(fmt(isoDate, 'LLLL yyyy'))
}

/** "Hoy" · "Mañana" · "En 5 días" — distancia desde `today` a una fecha futura. */
export function formatDaysFromToday(isoDate: string, today: string): string {
  const days = Math.round((parseIsoDate(isoDate).getTime() - parseIsoDate(today).getTime()) / 86_400_000)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  return `En ${days} días`
}

/** "18:30 – 20:00" · "18:30" · null si no hay hora. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  const from = shortTime(start)
  const to = shortTime(end)
  if (from && to) return `${from} – ${to}`
  return from ?? to
}

/** 754 → "12:34" · 3725 → "1:02:05" */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds)) return null
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}
