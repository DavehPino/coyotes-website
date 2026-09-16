// Asistente de flyers: pide a un modelo de OpenRouter una nueva versión del flyer a partir del actual,
// el pedido del usuario y las próximas actividades del equipo. El modelo solo devuelve textos y
// opciones de diseño (plantilla, paleta, formato); el dibujo se hace en el navegador.
import { shortTime } from '../../shared/dates.js'
import { ACTIVITY_CATEGORY_LABELS } from '../../shared/domain.js'
import {
  FLYER_AGENDA_LIMITS,
  FLYER_CAPTION_HASHTAGS_MAX,
  FLYER_CAPTION_MAX,
  FLYER_FORMATS,
  FLYER_MAX_AGENDA_ITEMS,
  FLYER_MAX_LOGOS,
  FLYER_PALETTES,
  FLYER_PALETTE_LABELS,
  FLYER_TEMPLATES,
  FLYER_TEMPLATE_LABELS,
  FLYER_TEXT_FIELDS,
  FLYER_TEXT_LIMITS,
  type FlyerAgendaField,
  type FlyerAgendaItem,
  type FlyerAssetRef,
  type FlyerCaptionInput,
  type FlyerCaptionResult,
  type FlyerContent,
  type FlyerSuggestInput,
  type FlyerSuggestion,
} from '../../shared/flyers.js'
import type { Activity } from '../../shared/schemas.js'
import { listUpcomingActivities } from './activities.js'
import { env } from './env.js'
import { HttpError } from './http.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
/** Los modelos gratuitos pueden tardar: margen amplio, por debajo del maxDuration de la función (vercel.json). */
const TIMEOUT_MS = 50_000
const CONTEXT_ACTIVITIES = 8

const FIELD_GUIDE: Record<(typeof FLYER_TEXT_FIELDS)[number], string> = {
  eyebrow: 'etiqueta pequeña sobre el título (competencia, fecha de liga, tipo de evento)',
  title: 'título principal, muy corto y con fuerza (2-4 palabras)',
  subtitle: 'línea secundaria (p.ej. "Coyotes vs Onas")',
  highlight: 'dato gigante: marcador ("3-1"), "VS", un número o una palabra',
  date: 'fecha legible (p.ej. "Sábado 20/09")',
  time: 'hora (p.ej. "18:00 hs")',
  location: 'lugar (club, dirección o barrio)',
  details: 'texto breve de apoyo, 1-2 frases',
  cta: 'llamada a la acción corta (p.ej. "¡Vení a alentar!")',
}

const TEMPLATE_GUIDE: Record<(typeof FLYER_TEMPLATES)[number], string> = {
  partido: 'anuncio de un partido: title, subtitle (rival), highlight ("VS"), opponentLogo, date, time, location, cta',
  entrenamiento: 'entrenamiento o práctica: title, subtitle, date, time, location, details, cta',
  resultado: 'resultado de un partido jugado: eyebrow, title ("¡Victoria!"), highlight (marcador), opponentLogo, subtitle, details (parciales), cta',
  anuncio: 'anuncio general, convocatoria o evento: eyebrow, title, subtitle, details, date, location, cta',
  agenda: 'varias actividades en una imagen: eyebrow, title, subtitle (rango de fechas), cta y el array agenda',
}

function systemPrompt(): string {
  const fields = FLYER_TEXT_FIELDS.map((f) => `- ${f} (máx. ${FLYER_TEXT_LIMITS[f]} caracteres): ${FIELD_GUIDE[f]}`)
  const templates = FLYER_TEMPLATES.map((t) => `- ${t} (${FLYER_TEMPLATE_LABELS[t]}): ${TEMPLATE_GUIDE[t]}`)
  const palettes = FLYER_PALETTES.map((p) => `- ${p} (${FLYER_PALETTE_LABELS[p]})`)
  return [
    'Eres el diseñador de redes sociales de Coyotes, una comunidad de vóley de Buenos Aires (Argentina).',
    'Su mascota es un coyote y sus colores son negro, dorado y naranja fuego. El logo va en los flyers.',
    'Tu trabajo es redactar y ajustar flyers para Instagram según lo que pida el usuario.',
    '',
    'Reglas:',
    '- Escribe en español rioplatense (voseo: "vení", "sumate"), con energía deportiva y sin exagerar.',
    '- Textos cortos: un flyer se lee en 2 segundos. Respeta los límites de caracteres.',
    '- Parte del flyer actual y cambia solo lo que pida el usuario o lo que haga falta para que sea coherente.',
    '- Si el pedido menciona una actividad del equipo, usa sus datos reales (fecha, hora, lugar, rival).',
    '- No inventes datos concretos (fechas, horas, lugares, marcadores) que no estén en el pedido, el flyer o las actividades: deja el campo vacío.',
    '- Campos que la plantilla no usa: déjalos vacíos.',
    '- Usa emojis como mucho uno por campo y solo en cta o details.',
    '',
    'Campos de texto:',
    ...fields,
    '',
    'Plantillas (template):',
    ...templates,
    '',
    'Paletas (palette): "podio" solo para actividades de Liga Podio; "brasa" es la paleta por defecto.',
    ...palettes,
    '',
    `Formatos (format): ${FLYER_FORMATS.join(', ')} (post 4:5, cuadrado, historia 9:16). No lo cambies salvo que te lo pidan.`,
    'showLogo: true salvo que pidan quitar el logo.',
    '',
    `Agenda (solo en la plantilla agenda): lista de hasta ${FLYER_MAX_AGENDA_ITEMS} actividades, cada una con when, what, where y highlight.`,
    `- when (máx. ${FLYER_AGENDA_LIMITS.when}): cuándo, p.ej. "Sáb 20/09 · 18:00".`,
    `- what (máx. ${FLYER_AGENDA_LIMITS.what}): qué, p.ej. "vs Onas Vóley" o "Entrenamiento".`,
    `- where (máx. ${FLYER_AGENDA_LIMITS.where}): dónde. highlight: true solo para Liga Podio o lo más importante.`,
    '- Usa únicamente actividades de la lista de próximas actividades; no inventes ninguna.',
    '- En el resto de plantillas, agenda debe ser una lista vacía.',
    '',
    'Imágenes: el usuario puede subir imágenes (logos de rivales, auspiciantes, ligas). Recibes su id y el nombre que les puso.',
    '- opponentLogo: id de la imagen del rival en partido y resultado (se dibuja junto al logo de Coyotes). Usa una solo si su nombre corresponde al rival; si no, "".',
    `- logos: lista de ids (máx. ${FLYER_MAX_LOGOS}) que se muestran en una fila (auspiciantes, liga, organizadores). Solo si el pedido lo sugiere o encajan claramente.`,
    '- Usa únicamente ids de la lista de imágenes disponibles. No repitas en logos la imagen de opponentLogo.',
    '',
    'Responde SOLO con un objeto JSON, sin texto alrededor ni bloques de código:',
    '{"message": "qué cambiaste, en una frase", "flyer": { ...todos los campos del flyer... }}',
  ].join('\n')
}

function describeActivity(activity: Activity): string {
  const parts = [activity.activity_date, shortTime(activity.start_time), activity.title]
  if (activity.opponent) parts.push(`vs ${activity.opponent.name}`)
  if (activity.location) parts.push(`en ${activity.location}`)
  parts.push(ACTIVITY_CATEGORY_LABELS[activity.category])
  if (activity.description) parts.push(activity.description)
  return `- ${parts.filter(Boolean).join(' · ')}`
}

async function upcomingContext(today: string): Promise<string> {
  try {
    const activities = await listUpcomingActivities(today, CONTEXT_ACTIVITIES)
    return activities.length > 0 ? activities.map(describeActivity).join('\n') : '(no hay actividades cargadas)'
  } catch (err) {
    // Sin base de datos el asistente sigue funcionando, solo que sin contexto.
    console.error(err)
    return '(no se pudieron consultar)'
  }
}

function describeAssets(assets: FlyerAssetRef[]): string {
  return assets.length > 0 ? assets.map((asset) => `- ${asset.id}: ${JSON.stringify(asset.name)}`).join('\n') : '(ninguna)'
}

function userPrompt(input: FlyerSuggestInput, activities: string): string {
  return [
    `Hoy es ${input.today}.`,
    '',
    'Próximas actividades del equipo:',
    activities,
    '',
    'Imágenes disponibles:',
    describeAssets(input.assets),
    '',
    'Flyer actual (JSON):',
    JSON.stringify(input.flyer),
    '',
    'Pedido del usuario:',
    input.prompt,
  ].join('\n')
}

/** Extrae el primer objeto JSON de la respuesta: algunos modelos lo envuelven en texto o en ```json. */
function extractJson(content: string): unknown {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(content.slice(start, end + 1))
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function pick<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : fallback
}

const agendaText = (value: unknown, field: FlyerAgendaField) =>
  typeof value === 'string' ? value.trim().slice(0, FLYER_AGENDA_LIMITS[field]) : ''

/** Filas de la agenda: se descartan las que no dicen qué pasa, que en el flyer serían un hueco. */
function normalizeAgenda(raw: unknown[]): FlyerAgendaItem[] {
  const rows: FlyerAgendaItem[] = []
  for (const value of raw) {
    if (!isRecord(value)) continue
    const what = agendaText(value.what, 'what')
    if (!what) continue
    rows.push({
      when: agendaText(value.when, 'when'),
      what,
      where: agendaText(value.where, 'where'),
      highlight: value.highlight === true,
    })
    if (rows.length === FLYER_MAX_AGENDA_ITEMS) break
  }
  return rows
}

/**
 * Los modelos gratuitos no siempre respetan el formato: cada campo válido se toma, los textos se
 * recortan a su límite y lo que falte o no encaje conserva el valor del flyer actual.
 */
function normalizeFlyer(raw: unknown, current: FlyerContent, assets: FlyerAssetRef[]): FlyerContent {
  const source = isRecord(raw) ? raw : {}
  const known = new Set(assets.map((asset) => asset.id))
  const flyer: FlyerContent = {
    ...current,
    template: pick(FLYER_TEMPLATES, source.template, current.template),
    palette: pick(FLYER_PALETTES, source.palette, current.palette),
    format: pick(FLYER_FORMATS, source.format, current.format),
    showLogo: typeof source.showLogo === 'boolean' ? source.showLogo : current.showLogo,
  }
  for (const field of FLYER_TEXT_FIELDS) {
    const value = source[field]
    if (typeof value === 'string') flyer[field] = value.trim().slice(0, FLYER_TEXT_LIMITS[field])
  }
  // Solo ids de imágenes que el usuario tiene: un id inventado dejaría un hueco vacío en el flyer.
  if (source.opponentLogo === '' || source.opponentLogo === null) flyer.opponentLogo = ''
  else if (typeof source.opponentLogo === 'string' && known.has(source.opponentLogo)) flyer.opponentLogo = source.opponentLogo
  if (Array.isArray(source.agenda)) flyer.agenda = normalizeAgenda(source.agenda)
  if (Array.isArray(source.logos)) {
    const ids = source.logos.filter((id): id is string => typeof id === 'string' && known.has(id) && id !== flyer.opponentLogo)
    flyer.logos = [...new Set(ids)].slice(0, FLYER_MAX_LOGOS)
  }
  return flyer
}

type ChatCompletion = {
  model?: string
  choices?: { message?: { content?: string | null } }[]
  error?: { message?: string; code?: number }
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  maxTokens?: number,
): Promise<ChatCompletion> {
  let res: Response
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Coyotes Dashboard',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        // Respuesta corta: menos latencia y menos timeouts con los modelos gratuitos.
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new HttpError(504, 'ai_timeout', 'El asistente tardó demasiado en responder. Inténtalo de nuevo.')
    }
    throw new HttpError(502, 'ai_unavailable', 'No se pudo contactar con el asistente de IA.')
  }

  const data = (await res.json().catch(() => null)) as ChatCompletion | null
  if (res.status === 429) {
    throw new HttpError(429, 'ai_rate_limited', 'Se alcanzó el límite gratuito del asistente. Espera un momento y reintenta.')
  }
  if (res.status === 401 || res.status === 403) {
    console.error('OpenRouter rechazó la clave', data?.error)
    throw new HttpError(503, 'ai_disabled', 'La clave de OpenRouter no es válida (OPENROUTER_API_KEY).')
  }
  if (!res.ok || !data) {
    console.error('OpenRouter', res.status, data?.error)
    throw new HttpError(502, 'ai_error', data?.error?.message ?? 'El asistente de IA devolvió un error.')
  }
  return data
}

export async function suggestFlyer(input: FlyerSuggestInput): Promise<FlyerSuggestion> {
  const { apiKey, model } = env.openrouter
  if (!apiKey) {
    throw new HttpError(503, 'ai_disabled', 'El asistente no está configurado en el servidor (falta OPENROUTER_API_KEY).')
  }

  const activities = await upcomingContext(input.today)
  const completion = await callOpenRouter(apiKey, model, systemPrompt(), userPrompt(input, activities))
  const parsed = extractJson(completion.choices?.[0]?.message?.content ?? '')
  if (!isRecord(parsed)) {
    throw new HttpError(502, 'ai_invalid', 'El asistente respondió en un formato inesperado. Prueba de nuevo o reformula el pedido.')
  }

  const message = typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : 'Listo, actualicé el flyer.'
  return {
    flyer: normalizeFlyer(isRecord(parsed.flyer) ? parsed.flyer : parsed, input.flyer, input.assets),
    message: message.slice(0, 300),
    model: completion.model ?? model,
  }
}

// ─── Pie de foto del posteo ───────────────────────────────────────────────────
// El navegador manda el texto ya armado con datos reales; el modelo solo lo reescribe.

/** Respuesta corta: el pie de foto son unas pocas líneas. */
const CAPTION_MAX_TOKENS = 400

const TONE_GUIDE: Record<FlyerCaptionInput['tone'], string> = {
  festejo: 'celebración: orgullo por el equipo, energía alta',
  convocatoria: 'invitación: que la gente se acerque a la cancha o se sume al equipo',
  sobrio: 'informativo y directo, sin signos de exclamación',
  divertido: 'distendido, con un guiño de humor, sin payasadas',
}

function captionSystemPrompt(): string {
  return [
    'Eres quien escribe los posteos de Instagram de Coyotes, una comunidad de vóley de Buenos Aires (Argentina).',
    'Su mascota es un coyote. Recibes el flyer que acompaña al posteo y un borrador del texto.',
    '',
    'Reglas:',
    '- Escribe en español rioplatense (voseo: "vení", "sumate"), con energía deportiva y sin exagerar.',
    '- Reescribe el borrador para que suene natural. No inventes datos (marcadores, fechas, horas, lugares,',
    '  nombres) que no estén en el borrador ni en el flyer: si no están, no los menciones.',
    '- De 2 a 5 líneas cortas. Nada de paréntesis explicativos ni de firmar el texto.',
    '- Como mucho dos emojis en todo el pie de foto.',
    '- Los hashtags van aparte, en "hashtags", nunca dentro de "caption".',
    `- Entre 3 y ${FLYER_CAPTION_HASHTAGS_MAX} hashtags, sin tildes ni espacios, empezando por "#".`,
    '',
    'Responde SOLO con un objeto JSON, sin texto alrededor ni bloques de código:',
    '{"caption": "el texto del posteo", "hashtags": ["#Coyotes", "#Voley"]}',
  ].join('\n')
}

function captionUserPrompt(input: FlyerCaptionInput): string {
  return [
    `Hoy es ${input.today}.`,
    `Tono pedido: ${input.tone} (${TONE_GUIDE[input.tone]}).`,
    '',
    'Flyer que acompaña al posteo (JSON):',
    JSON.stringify(input.flyer),
    '',
    'Borrador del pie de foto:',
    input.draft || '(vacío: escríbelo a partir del flyer)',
  ].join('\n')
}

const HASHTAG = /^#[\p{L}\p{N}_]{2,30}$/u

function normalizeHashtags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const tags: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string') continue
    const tag = `#${value.trim().replace(/^#+/, '')}`
    const key = tag.toLowerCase()
    if (!HASHTAG.test(tag) || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length === FLYER_CAPTION_HASHTAGS_MAX) break
  }
  return tags
}

/**
 * Si el modelo no devuelve un pie de foto utilizable se conserva el borrador: el texto local ya es
 * correcto, así que fallar aquí empeoraría lo que el usuario ya tenía.
 */
function normalizeCaption(raw: unknown, draft: string): { caption: string; hashtags: string[] } {
  const source = isRecord(raw) ? raw : {}
  const text = typeof source.caption === 'string' ? source.caption.trim() : ''
  if (!text) return { caption: draft, hashtags: [] }
  const hashtags = normalizeHashtags(source.hashtags)
  const full = hashtags.length > 0 ? `${text}\n\n${hashtags.join(' ')}` : text
  return { caption: full.slice(0, FLYER_CAPTION_MAX), hashtags }
}

export async function suggestCaption(input: FlyerCaptionInput): Promise<FlyerCaptionResult> {
  const { apiKey, model } = env.openrouter
  if (!apiKey) {
    throw new HttpError(503, 'ai_disabled', 'El asistente no está configurado en el servidor (falta OPENROUTER_API_KEY).')
  }

  const completion = await callOpenRouter(
    apiKey,
    model,
    captionSystemPrompt(),
    captionUserPrompt(input),
    CAPTION_MAX_TOKENS,
  )
  const parsed = extractJson(completion.choices?.[0]?.message?.content ?? '')
  return {
    ...normalizeCaption(parsed, input.draft),
    model: completion.model ?? model,
  }
}
