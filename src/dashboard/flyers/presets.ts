// Flyers precargados con datos reales: un partido o una actividad ya cargados se convierten en el borrador
// del generador. Solo transforma datos; el dibujo sigue en render.ts.
import { formatFlyerDate, shortTime } from '@/lib/dates'
import { FLYER_TEXT_LIMITS, type FlyerContent, type FlyerImage, type FlyerTextField } from '@shared/flyers'
import { slugify } from '@shared/matches'
import type { Activity, MatchDetail, TeamSummary } from '@shared/schemas'
import { matchTitle, scoreParts, setScoreParts } from '../matches/matchLabels'

/** Lo que el flyer conserva del borrador anterior: el formato elegido y si se muestra el escudo. */
export type FlyerBase = Pick<FlyerContent, 'format' | 'showLogo'>

/** Recorta al límite del campo: los nombres de rival largos se pasan de `subtitle`. */
const clamp = (field: FlyerTextField, value: string) => value.trim().slice(0, FLYER_TEXT_LIMITS[field])

/**
 * Imagen de la biblioteca que corresponde al rival, comparando por nombre normalizado (el equipo las nombra
 * como el rival: lo pide el texto del asistente). Cadena vacía si no hay ninguna.
 */
export function opponentAssetFor(opponent: TeamSummary | null, images: FlyerImage[]): string {
  if (!opponent) return ''
  const full = slugify(opponent.name)
  // La abreviatura son tres letras: exige coincidencia exacta o "ona" encontraría "Corona".
  const short = opponent.short_name ? slugify(opponent.short_name) : ''
  const named = images.map((image) => ({ id: image.id, slug: slugify(image.name) })).filter((image) => image.slug !== '')
  const exact = named.find((image) => image.slug === full || (short !== '' && image.slug === short))
  if (exact) return exact.id
  // "Onas Vóley" contra una imagen llamada "Onas" (o al revés), solo con el nombre completo.
  const partial = full === '' ? undefined : named.find((image) => image.slug.includes(full) || full.includes(image.slug))
  return partial?.id ?? ''
}

const RESULT_TITLES = {
  win: '¡Victoria!',
  loss: 'Se nos escapó',
  pending: 'Jugamos',
} as const

/** Partido jugado con su marcador: plantilla "resultado". */
export function flyerFromMatch(match: MatchDetail, base: FlyerBase, images: FlyerImage[]): FlyerContent {
  const parciales = match.set_scores.map((set) => setScoreParts(match, set).join('-')).join(' · ')
  return {
    ...base,
    template: 'resultado',
    palette: match.competition === 'Liga Podio' ? 'podio' : match.outcome === 'win' ? 'dorado' : 'brasa',
    eyebrow: clamp('eyebrow', [match.competition, match.phase].filter(Boolean).join(' · ')),
    title: RESULT_TITLES[match.outcome],
    subtitle: clamp('subtitle', matchTitle(match, true)),
    highlight: clamp('highlight', scoreParts(match).join('-')),
    // La plantilla "resultado" no dibuja fecha, hora ni lugar.
    date: '',
    time: '',
    location: '',
    details: clamp('details', parciales),
    cta: 'Gracias por el aguante',
    opponentLogo: opponentAssetFor(match.opponent, images),
    logos: [],
  }
}

/** Actividad próxima: "partido" si hay rival, "entrenamiento" para las prácticas y "anuncio" para el resto. */
export function flyerFromActivity(activity: Activity, base: FlyerBase, images: FlyerImage[]): FlyerContent {
  const rival = activity.opponent
  const isPractice = activity.activity_type === 'entrenamiento' || activity.activity_type === 'fisico'
  const time = shortTime(activity.start_time)
  return {
    ...base,
    template: rival ? 'partido' : isPractice ? 'entrenamiento' : 'anuncio',
    palette: activity.category === 'podio' ? 'podio' : 'brasa',
    eyebrow: clamp('eyebrow', activity.category === 'podio' ? 'Liga Podio' : 'Coyotes'),
    title: clamp('title', rival ? 'Día de partido' : activity.title),
    subtitle: clamp('subtitle', rival ? rival.name : activity.title),
    highlight: rival ? 'VS' : '',
    date: formatFlyerDate(activity.activity_date),
    time: time ? `${time} hs` : '',
    location: clamp('location', activity.location ?? ''),
    details: clamp('details', activity.description ?? ''),
    cta: rival ? '¡Vení a alentar a la manada!' : 'La manada no falta',
    opponentLogo: opponentAssetFor(rival, images),
    logos: [],
  }
}
