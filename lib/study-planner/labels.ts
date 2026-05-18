import type { ErrorLogStatus, ErrorLogType, StudySessionQuality, StudySessionType } from "./types";

export const SESSION_TYPE_OPTIONS: { value: StudySessionType; label: string }[] = [
  { value: "theory", label: "Teoría" },
  { value: "question_bank", label: "Banco de preguntas" },
  { value: "mock", label: "Mock" },
  { value: "review", label: "Repaso" },
  { value: "error_correction", label: "Corrección de errores" },
  { value: "class", label: "Clase" },
];

export const SESSION_QUALITY_OPTIONS: { value: StudySessionQuality; label: string }[] = [
  { value: "good", label: "Buena" },
  { value: "medium", label: "Media" },
  { value: "bad", label: "Mala" },
];

export function getSessionTypeLabel(type: StudySessionType): string {
  return SESSION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function getSessionQualityLabel(quality?: StudySessionQuality): string {
  if (!quality) return "—";
  return SESSION_QUALITY_OPTIONS.find((o) => o.value === quality)?.label ?? quality;
}

export const ERROR_LOG_TYPE_OPTIONS: { value: ErrorLogType; label: string }[] = [
  { value: "concept", label: "Concepto no entendido" },
  { value: "formula", label: "Fórmula" },
  { value: "unit_conversion", label: "Unidad / conversión" },
  { value: "fast_reading", label: "Lectura rápida" },
  { value: "procedure", label: "Procedimiento" },
  { value: "english_comprehension", label: "Inglés / comprensión" },
  { value: "memory", label: "Memorización" },
  { value: "distraction", label: "Despiste" },
  { value: "other", label: "Otro" },
];

export const ERROR_LOG_STATUS_LABELS: Record<ErrorLogStatus, string> = {
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
};

export function getErrorLogTypeLabel(type: ErrorLogType): string {
  return ERROR_LOG_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
