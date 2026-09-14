// Plantillas preseleccionables: textos de ejemplo y campos que muestra el editor para cada una.
import {
  FLYER_TEMPLATE_LABELS,
  flyerContentSchema,
  type FlyerContent,
  type FlyerTemplate,
  type FlyerTextField,
} from '@shared/flyers'

type TemplateInfo = {
  label: string
  description: string
  fields: FlyerTextField[]
  sample: Omit<FlyerContent, 'format' | 'showLogo' | 'opponentLogo' | 'logos'>
}

export const TEMPLATES: Record<FlyerTemplate, TemplateInfo> = {
  partido: {
    label: FLYER_TEMPLATE_LABELS.partido,
    description: 'Rival, fecha, hora y lugar',
    fields: ['eyebrow', 'title', 'highlight', 'subtitle', 'date', 'time', 'location', 'cta'],
    sample: {
      template: 'partido',
      palette: 'brasa',
      eyebrow: 'Liga Podio · Fecha 5',
      title: 'Día de partido',
      highlight: 'VS',
      subtitle: 'Onas Vóley',
      date: 'Sáb 20/09',
      time: '18:00 hs',
      location: 'Club Ciudad, Palermo',
      details: '',
      cta: '¡Vení a alentar a la manada!',
    },
  },
  entrenamiento: {
    label: FLYER_TEMPLATE_LABELS.entrenamiento,
    description: 'Práctica, horario y detalles',
    fields: ['eyebrow', 'title', 'subtitle', 'details', 'date', 'time', 'location', 'cta'],
    sample: {
      template: 'entrenamiento',
      palette: 'atardecer',
      eyebrow: 'Coyotes',
      title: 'A entrenar',
      subtitle: 'Recepción y ataque',
      highlight: '',
      date: 'Jueves',
      time: '20:00 hs',
      location: 'Polideportivo Parque Chas',
      details: 'Traé rodilleras, agua y muchas ganas. Se arranca puntual.',
      cta: 'La manada no falta',
    },
  },
  resultado: {
    label: FLYER_TEMPLATE_LABELS.resultado,
    description: 'Marcador y parciales',
    fields: ['eyebrow', 'title', 'highlight', 'subtitle', 'details', 'cta'],
    sample: {
      template: 'resultado',
      palette: 'dorado',
      eyebrow: 'Liga Podio · Fecha 4',
      title: '¡Victoria!',
      highlight: '3-1',
      subtitle: 'Coyotes vs Onas',
      date: '',
      time: '',
      location: '',
      details: '25-20 · 22-25 · 25-18 · 25-21',
      cta: 'Gracias por el aguante',
    },
  },
  anuncio: {
    label: FLYER_TEMPLATE_LABELS.anuncio,
    description: 'Convocatorias y eventos',
    fields: ['eyebrow', 'title', 'subtitle', 'details', 'date', 'time', 'location', 'cta'],
    sample: {
      template: 'anuncio',
      palette: 'brasa',
      eyebrow: 'Convocatoria abierta',
      title: 'Sumate a la manada',
      subtitle: 'Vóley mixto en Buenos Aires',
      highlight: '',
      date: 'Todos los niveles',
      time: '',
      location: 'CABA',
      details: 'Buscamos jugadoras y jugadores con ganas de entrenar, competir y pasarla bien.',
      cta: 'Escribinos por DM',
    },
  },
}

export const FIELD_LABELS: Record<FlyerTextField, { label: string; placeholder: string }> = {
  eyebrow: { label: 'Etiqueta', placeholder: 'Liga Podio · Fecha 5' },
  title: { label: 'Título', placeholder: 'Día de partido' },
  subtitle: { label: 'Subtítulo', placeholder: 'Coyotes vs Onas' },
  highlight: { label: 'Destacado', placeholder: 'VS · 3-1' },
  date: { label: 'Fecha', placeholder: 'Sáb 20/09' },
  time: { label: 'Hora', placeholder: '18:00 hs' },
  location: { label: 'Lugar', placeholder: 'Club, barrio o dirección' },
  details: { label: 'Detalles', placeholder: 'Texto breve de apoyo' },
  cta: { label: 'Llamada a la acción', placeholder: '¡Vení a alentar!' },
}

export const INITIAL_FLYER: FlyerContent = {
  ...TEMPLATES.partido.sample,
  format: 'post',
  showLogo: true,
  opponentLogo: '',
  logos: [],
}

/** Aplica una plantilla con sus textos de ejemplo (sin imágenes propias), conservando formato y logo. */
export function applyTemplate(current: Pick<FlyerContent, 'format' | 'showLogo'>, template: FlyerTemplate): FlyerContent {
  return { ...TEMPLATES[template].sample, format: current.format, showLogo: current.showLogo, opponentLogo: '', logos: [] }
}

const STORAGE_KEY = 'coyotes:flyer-draft'

/** El borrador se recuerda en este navegador para no perderlo al cambiar de sección. */
export const draftStore = {
  get(): FlyerContent {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? flyerContentSchema.safeParse(JSON.parse(raw)) : null
      return parsed?.success ? parsed.data : INITIAL_FLYER
    } catch {
      return INITIAL_FLYER
    }
  },
  set(flyer: FlyerContent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flyer))
    } catch {
      // Navegación privada o almacenamiento lleno: el borrador dura lo que la pestaña.
    }
  },
}
