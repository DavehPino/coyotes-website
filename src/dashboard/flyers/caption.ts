// Pie de foto para el posteo de Instagram, armado con los datos del partido o la actividad.
// Sin IA: es instantáneo, funciona sin conexión y nunca falla. El asistente solo lo reescribe.
import { formatDateCompact, shortTime } from '@/lib/dates'
import { FLYER_CAPTION_MAX, type FlyerContent } from '@shared/flyers'
import type { Activity, MatchDetail } from '@shared/schemas'

/** Sin tildes a propósito: son los que se usan al buscar. */
const BASE_TAGS = ['#Coyotes', '#Voley', '#Volley', '#BuenosAires']

const join = (lines: (string | null)[]) => lines.filter(Boolean).join('\n').slice(0, FLYER_CAPTION_MAX)

function tagsFor(competition: string | null): string {
  const tags = [...BASE_TAGS]
  if (competition === 'Liga Podio') tags.splice(2, 0, '#LigaPodio')
  return tags.join(' ')
}

/** "el sáb 20 sep a las 18:00 hs" · "el sáb 20 sep" si no hay hora. */
function whenPhrase(isoDate: string, startTime: string | null): string {
  const time = shortTime(startTime)
  return `el ${formatDateCompact(isoDate)}${time ? ` a las ${time} hs` : ''}`
}

const HEADLINES = {
  win: '¡Victoria de la manada! 🐺',
  loss: 'Se nos escapó, pero la manada sigue.',
  pending: 'Jugamos.',
} as const

export function captionFromMatch(match: MatchDetail): string {
  const rival = match.opponent.name
  const competition = [match.competition, match.phase].filter(Boolean).join(' · ')
  const versus = competition ? `contra ${rival} por ${competition}` : `contra ${rival}`
  const score = match.sets_won !== null && match.sets_lost !== null ? `${match.sets_won}-${match.sets_lost}` : null
  const verb = match.outcome === 'win' ? 'Ganamos' : match.outcome === 'loss' ? 'Perdimos' : 'Jugamos'
  // Los parciales van desde nuestro punto de vista, igual que el marcador de la línea anterior.
  const sets = match.set_scores.map((set) => `${set.us}-${set.them}`).join(' · ')

  return join([
    HEADLINES[match.outcome],
    score ? `${verb} ${score} ${versus}.` : `${verb} ${versus}.`,
    sets ? `Parciales: ${sets}.` : null,
    '',
    tagsFor(match.competition),
  ])
}

export function captionFromActivity(activity: Activity): string {
  const rival = activity.opponent
  const when = whenPhrase(activity.activity_date, activity.start_time)
  const place = activity.location ? ` en ${activity.location}` : ''

  return join([
    rival ? '¡Día de partido! 🐺' : activity.title,
    rival ? `Jugamos contra ${rival.name} ${when}${place}.` : `Nos vemos ${when}${place}.`,
    activity.description,
    '',
    tagsFor(activity.category === 'podio' ? 'Liga Podio' : null),
  ])
}

/** Último recurso: el flyer no viene de un partido ni de una actividad, así que el texto sale de sus campos. */
export function captionFromFlyer(flyer: FlyerContent): string {
  const when = [flyer.date, flyer.time].filter(Boolean).join(' · ')
  return join([
    flyer.title,
    flyer.subtitle,
    when || null,
    flyer.location,
    flyer.details,
    flyer.cta,
    '',
    tagsFor(flyer.palette === 'podio' ? 'Liga Podio' : null),
  ])
}

/**
 * El mismo texto sin las líneas de hashtags del final: el resumen del partido se lee en el dashboard,
 * donde los hashtags no pintan nada.
 */
export function withoutHashtags(caption: string): string {
  const lines = caption.split('\n')
  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim()
    if (last !== '' && !/^#[^\s#]+(\s+#[^\s#]+)*$/u.test(last)) break
    lines.pop()
  }
  return lines.join('\n').trim()
}
