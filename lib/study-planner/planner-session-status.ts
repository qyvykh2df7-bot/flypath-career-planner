/** Estados oficiales de una sesión planificada. */
export type PlannedStudySessionStatus = "pending" | "in_progress" | "completed" | "skipped";

const LEGACY_PLANNED = "planned";

export const PLANNED_STATUS_LABELS: Record<PlannedStudySessionStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  skipped: "Saltada",
};

/** Normaliza datos antiguos (`planned` → `pending`). */
export function normalizePlannedSessionStatus(raw: unknown): PlannedStudySessionStatus | null {
  if (raw === LEGACY_PLANNED || raw === "pending") return "pending";
  if (raw === "in_progress") return "in_progress";
  if (raw === "completed") return "completed";
  if (raw === "skipped") return "skipped";
  return null;
}

export function isPendingLikeStatus(status: PlannedStudySessionStatus): boolean {
  return status === "pending" || status === "in_progress";
}

/** Etiqueta de estado para UI (legacy `skipped` se muestra como pendiente). */
export function getPlannedStatusDisplayLabel(status: PlannedStudySessionStatus): string {
  if (status === "skipped") return PLANNED_STATUS_LABELS.pending;
  return PLANNED_STATUS_LABELS[status];
}

export function isCountableAsCompleted(status: PlannedStudySessionStatus): boolean {
  return status === "completed";
}

export function sessionMinutes(session: { plannedDurationMinutes: number }): number {
  return Number.isFinite(session.plannedDurationMinutes) ? session.plannedDurationMinutes : 0;
}
