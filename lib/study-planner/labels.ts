import type { StudySessionQuality, StudySessionType } from "./types";

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
