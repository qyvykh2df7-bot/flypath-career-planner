import type { StudyMode } from "./types";
import type { WeeklyPlanCompletion } from "./calculations";
import { isInPlanGracePeriod } from "./plan-activation";
import type { WeeklyPlanAlert } from "./weekly-alerts";

const GRACE_SUPPRESSED_IDS = new Set([
  "many-pending-soon",
  "hours-remaining-real",
  "hours-remaining-blocks",
  "heavy-remaining-load",
  "critical-status",
  "no-study-log",
  "logged-not-completed",
]);

const POSITIVE_MESSAGE = "Tu semana está correctamente organizada.";

export type WeeklyAlertsDisplay = {
  alerts: WeeklyPlanAlert[];
  positiveMessage: string | null;
};

export function resolveWeeklyAlertsDisplay(params: {
  alerts: WeeklyPlanAlert[];
  mode: StudyMode;
  completion: WeeklyPlanCompletion;
}): WeeklyAlertsDisplay {
  const { alerts, mode, completion } = params;
  const inGrace = isInPlanGracePeriod(mode, completion);

  let filtered = alerts;

  if (inGrace) {
    filtered = alerts.filter((a) => !GRACE_SUPPRESSED_IDS.has(a.id));
  }

  filtered = filtered.filter((a) => {
    if (a.severity === "info") return false;
    if (a.id === "hours-remaining-real" && completion.weeklyStatus === "on_track") return false;
    if (a.id === "hours-remaining-real" && completion.weeklyStatus === "ahead") return false;
    return true;
  });

  const positiveMessage =
    completion.hasPlan && filtered.length === 0 ? POSITIVE_MESSAGE : null;

  return { alerts: filtered, positiveMessage };
}
