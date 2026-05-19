import type { StudyMode } from "./types";
import type { WeeklyPlanCompletion } from "./calculations";

const GRACE_MS = 24 * 60 * 60 * 1000;

function storageKey(mode: StudyMode): string {
  return `flypath_planner_plan_activated_${mode}`;
}

/** Marca el momento en que se activó un plan semanal (local). */
export function markPlanActivated(mode: StudyMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(mode), String(Date.now()));
}

export function getPlanActivatedAt(mode: StudyMode): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey(mode));
  if (!raw) return null;
  const ts = Number(raw);
  return Number.isFinite(ts) ? ts : null;
}

/** Primeras horas tras activar: sin alertas de carga/retraso artificial. */
export function isInPlanGracePeriod(mode: StudyMode, completion?: WeeklyPlanCompletion): boolean {
  const activatedAt = getPlanActivatedAt(mode);
  if (!activatedAt) return false;

  const withinWindow = Date.now() - activatedAt < GRACE_MS;
  if (!withinWindow) return false;

  if (completion && completion.completedCount > 0 && completion.progressDelta >= -5) {
    return false;
  }

  return true;
}
