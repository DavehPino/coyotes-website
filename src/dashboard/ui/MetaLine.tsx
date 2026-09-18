type MetaLineProps = {
  /** Segmentos de la línea (fecha, competición, fase…); los vacíos se descartan. */
  parts: (string | null | undefined | false)[]
  className?: string
}

/**
 * Línea de datos separados por «·». El punto va pegado al INICIO de cada segmento con un espacio irrompible,
 * así una línea nunca termina en un separador huérfano: si hay salto, cae antes del punto.
 */
export function MetaLine({ parts, className = '' }: MetaLineProps) {
  const segments = parts.filter((part): part is string => Boolean(part))
  if (segments.length === 0) return null
  return (
    <span className={className}>
      {segments.map((segment, index) => (
        <span key={index}>
          {index > 0 && ' · '}
          {segment}
        </span>
      ))}
    </span>
  )
}
