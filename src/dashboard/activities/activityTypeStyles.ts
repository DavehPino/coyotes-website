// Único mapa tipo de actividad → color de la paleta (tono del Chip).
import type { ActivityType } from '@shared/domain'
import type { ChipTone } from '../ui/Chip'

export const ACTIVITY_TYPE_TONES: Record<ActivityType, ChipTone> = {
  partido: 'gold-solid',
  torneo: 'yellow',
  amistoso: 'gold',
  entrenamiento: 'silver',
  fisico: 'rust',
  video_analisis: 'steel',
  reunion: 'ash',
  otro: 'ash',
}
