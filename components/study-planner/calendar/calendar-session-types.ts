import type { StudySessionType } from "@/lib/study-planner/types";
import { getSessionTypeShortLabel } from "@/lib/study-planner/labels";

/** Tipos disponibles al crear/editar desde calendario (manual). */
export const CALENDAR_MANUAL_SESSION_TYPES: StudySessionType[] = [
  "theory",
  "question_bank",
  "review",
  "mock",
  "class",
];

/** Etiqueta visible para tipo interno `class`. */
export const CLASS_SESSION_USER_LABEL = "Clase particular";

/** Ayuda breve en drawer al elegir clase particular. */
export const CLASS_SESSION_FLYPATH_HINT = "Clase PPL/ATPL con FlyPath.";

export function getCalendarSessionTypeLabel(type: StudySessionType): string {
  if (type === "class") return CLASS_SESSION_USER_LABEL;
  return getSessionTypeShortLabel(type);
}

export const CLASSES_BOOKING_PATH = "/clases-ppl-atpl";
