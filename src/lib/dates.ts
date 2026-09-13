// Formato de fechas en español para la interfaz. Las fechas llegan como "YYYY-MM-DD" y las
// horas como "HH:MM:SS", siempre locales: no se convierte de zona horaria.
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { shortTime } from '@shared/dates'

export { shortTime }

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function fmt(isoDate: string, pattern: string): string {
  return format(parseISO(isoDate), pattern, { locale: es })
}

/** "Mar 15" — cabecera de columna del tablero. */
export function formatDayShort(isoDate: string): string {
  return capitalize(fmt(isoDate, 'EEE d'))
}

/** "Martes 15 de septiembre" */
export function formatDayLong(isoDate: string): string {
  return capitalize(fmt(isoDate, "EEEE d 'de' MMMM"))
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

/** "Septiembre 2026" — cabeceras de mes. */
export function formatMonthYear(isoDate: string): string {
  return capitalize(fmt(isoDate, 'LLLL yyyy'))
}

/** "15 – 21 sep 2026" · "28 sep – 4 oct 2026" · "29 dic 2025 – 4 ene 2026" */
export function formatWeekRange(monday: string, sunday: string): string {
  const [y1, m1] = monday.split('-')
  const [y2, m2] = sunday.split('-')
  const day = (iso: string) => fmt(iso, 'd')
  const dayMonth = (iso: string) => fmt(iso, 'd MMM').replace('.', '')
  if (y1 !== y2) return `${formatDateShort(monday)} – ${formatDateShort(sunday)}`
  if (m1 !== m2) return `${dayMonth(monday)} – ${dayMonth(sunday)} ${y2}`
  return `${day(monday)} – ${dayMonth(sunday)} ${y2}`
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
