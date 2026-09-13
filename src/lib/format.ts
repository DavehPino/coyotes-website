// Formato de números para la interfaz.

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/** 1536 → "1,5 KB" · 734003200 → "700 MB" */
export function formatBytes(bytes: number): string {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1
  return `${value.toLocaleString('es', { maximumFractionDigits: digits })} ${UNITS[unit]}`
}

/** 0.4567 → "46 %" */
export function formatPercent(ratio: number): string {
  return `${Math.floor(Math.min(1, Math.max(0, ratio)) * 100)} %`
}
