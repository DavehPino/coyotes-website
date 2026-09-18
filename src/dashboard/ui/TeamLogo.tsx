import { useState } from 'react'
import { LOGO_SRC, TEAM_NAME } from '@/config'
import type { TeamSummary } from '@shared/schemas'

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'cover'

const SIZES: Record<Size, string> = {
  sm: 'size-6 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-14 text-xl',
  xl: 'size-16 text-2xl sm:size-20 sm:text-3xl md:size-28 md:text-4xl',
  cover: 'size-12 text-lg sm:size-14 sm:text-xl md:size-16 md:text-2xl',
}

type TeamLogoProps = {
  /** Sin equipo → escudo propio. */
  team?: TeamSummary | null
  size?: Size
  className?: string
  loading?: 'lazy' | 'eager'
}

function initials(team: TeamSummary): string {
  const short = team.short_name?.trim()
  if (short) return short.slice(0, 3).toUpperCase()
  return team.name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

/** Escudo circular; si el rival no tiene logo, o no carga, se muestran sus iniciales en vinilo negro. */
export function TeamLogo({ team, size = 'md', className = '', loading = 'lazy' }: TeamLogoProps) {
  const name = team?.name ?? TEAM_NAME
  const src = team ? team.logo_url : LOGO_SRC
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const classes = ['shrink-0 rounded-full', SIZES[size], className].join(' ')

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={`Escudo de ${name}`}
        loading={loading}
        onError={() => setFailedSrc(src)}
        className={`${classes} bg-ink object-cover`}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={`Escudo de ${name}`}
      className={`${classes} inline-flex items-center justify-center bg-ink font-extrabold text-club`}
    >
      {team ? initials(team) : 'COY'}
    </span>
  )
}
