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
