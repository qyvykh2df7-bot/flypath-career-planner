import type { PlannedStudySession } from "../types";
import { createPlannerId } from "../calculations";
import type { WeeklyStudyPlan } from "./planning-types";

/** Convierte bloques del plan semanal en sesiones planificadas del calendario. */
export function weeklyPlanToPlannedSessions(plan: WeeklyStudyPlan): PlannedStudySession[] {
  return plan.blocks.map((block) => ({
    id: block.id || createPlannerId(),
    date: block.date,
    startTime: block.suggestedStartTime,
    subjectId: block.subjectId,
    type: block.sessionType,
    plannedDurationMinutes: block.plannedMinutes,
    goal: block.reasonLabel,
    status: "planned" as const,
  }));
}
