// Iconos de trazo con `currentColor`: el color y la opacidad los da el CSS del contexto.
// El grosor se ajusta al peso del texto que acompañan: 1.5 junto a texto normal, 2 junto a semibold.
import type { SVGProps } from 'react'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'strokeWidth'> & {
  strokeWidth?: 1.5 | 2
  /** Variante rellena: solo para el estado activo. */
  filled?: boolean
}

function base({ strokeWidth = 1.5, filled: _filled, className = 'size-5', ...rest }: IconProps) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className,
    ...rest,
  }
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="16" rx="2" fill={props.filled ? 'currentColor' : 'none'} fillOpacity={0.2} />
      <path d="M16 3v4M8 3v4M3 10h18" />
      {props.filled && <rect x="3" y="5" width="18" height="5" rx="2" fill="currentColor" stroke="none" />}
    </svg>
  )
}

export function BallIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" fill={props.filled ? 'currentColor' : 'none'} fillOpacity={0.2} />
      <path d="M12 3a9 9 0 0 0 0 18M3.5 9.5c5 .5 10.5 3 14 9M20.5 9.5c-5-1-10 0-15 4" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.25" />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      {/* Triángulo desplazado 1px a la derecha: centrado óptico, no geométrico. */}
      <path d="M8.5 5.5v13l11-6.5z" fill={props.filled ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function FilmIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4" />
    </svg>
  )
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6v4H9z" />
    </svg>
  )
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l10 18H2L12 3zM12 10v4M12 17.5v.5" />
    </svg>
  )
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 13l2.5-8h11L20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6zM4 13h5l1.5 2h3L15 13h5" />
    </svg>
  )
}
