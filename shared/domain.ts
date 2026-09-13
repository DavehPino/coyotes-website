// Vocabulario compartido entre frontend y backend.
// Debe coincidir con los CHECK constraints de supabase/migrations.

export const ACTIVITY_TYPES = [
  "entrenamiento",
  "partido",
  "amistoso",
  "torneo",
  "fisico",
  "video_analisis",
  "reunion",
  "otro",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  entrenamiento: "Entrenamiento",
  partido: "Partido",
  amistoso: "Amistoso",
  torneo: "Torneo",
  fisico: "Preparación física",
  video_analisis: "Análisis de video",
  reunion: "Reunión",
  otro: "Otro",
};

/** Categoría de la actividad: las de Liga Podio se destacan y van primero en el carrusel. */
export const ACTIVITY_CATEGORIES = ["general", "podio"] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  general: "General",
  podio: "Liga Podio",
};

export const VIDEO_CATEGORIES = [
  "partido",
  "entrenamiento",
  "scouting",
  "highlights",
  "tecnica",
  "tactica",
  "sin_clasificar",
] as const;
export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, string> = {
  partido: "Partido",
  entrenamiento: "Entrenamiento",
  scouting: "Scouting rival",
  highlights: "Highlights",
  tecnica: "Técnica",
  tactica: "Táctica",
  sin_clasificar: "Sin clasificar",
};

export const VIDEO_SOURCES = ["bucket", "external"] as const;
export type VideoSource = (typeof VIDEO_SOURCES)[number];

export const VIDEO_STATUSES = ["pending", "ready", "archived"] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export type MatchOutcome = "win" | "loss" | "pending";

/** Carpeta del bucket cuyos subdirectorios son slugs de partido: games/<slug>/archivo.mp4 */
export const MATCH_VIDEOS_FOLDER = "games";

export const VIDEO_FILE_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".m4v",
  ".webm",
  ".mkv",
] as const;

/** Competiciones que se pueden elegir al cargar un partido desde el dashboard. */
export const MATCH_COMPETITIONS = ["Liga Podio", "Amistoso"] as const;
export type MatchCompetition = (typeof MATCH_COMPETITIONS)[number];

/** Un partido de vóley tiene como máximo 5 sets (igual que `videos.set_number`). */
export const MAX_SETS = 5;

/** Tamaño máximo de un video subido desde el dashboard (10 GiB, el plan gratuito de R2). */
export const MAX_VIDEO_BYTES = 10 * 1024 ** 3;

/** Cabecera con la palabra clave de carga, codificada con encodeURIComponent (admite tildes y ñ). */
export const ADMIN_SAFEWORD_HEADER = "x-admin-safeword";
