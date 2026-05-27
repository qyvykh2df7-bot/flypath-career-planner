import type {
  ErrorLogItem,
  PlannedStudySession,
  RecoveryPlan,
  ReviewItem,
} from "./types";
import { getWeekRange } from "./date-utils";
import { getSessionTypeShortLabel } from "./labels";
import {
  buildBurnoutRelief,
  BURNOUT_MAIN_SUMMARY,
  BURNOUT_PLAN_EFFECTS,
  isBurnoutRecoveryPlan,
} from "./recovery-burnout-relief";
import {
  buildWeeklyStructureRecoverySummary,
  formatWeeklyStructureImpactLine,
  isWeeklyStructureRecoveryPlan,
} from "./recovery-weekly-structure";
import {
  isLowTimeRecoveryPlan,
  LOW_TIME_SUMMARY,
} from "./recovery-low-time";
import {
  isStartGuidanceRecoveryPlan,
  START_GUIDANCE_SUMMARY,
} from "./recovery-start-guidance";
import {
  isMockCorrectionRecoveryPlan,
  MOCK_CORRECTION_SUMMARY,
} from "./recovery-mock-correction";
import {
  isOverdueReviewsRecoveryPlan,
  OVERDUE_REVIEWS_SUMMARY,
} from "./recovery-overdue-reviews";
import {
  pickRecoveryFocusSubjects,
  recoveryPlanToPlannedSessions,
  shouldDescheduleRecoverySession,
} from "./recovery-apply";
import type { RecoveryApplyInput } from "./recovery-apply";
import { sumPendingPlannedMinutesForWeek } from "./recovery-load";

export type RecoveryCalendarPreviewInput = {
  activeSubjectIds: string[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  plannedSessions: PlannedStudySession[];
  weekStartDate: string;
  today: string;
  weeklyGoalMinutes: number;
};

function summarizeSessionTypes(sessions: PlannedStudySession[]): string {
  const labels = new Set<string>();
  for (const session of sessions) {
    labels.add(getSessionTypeShortLabel(session.type));
  }
  const ordered = [...labels];
  if (ordered.length === 0) return "repaso ligero";
  if (ordered.length === 1) return ordered[0]!.toLowerCase();
  if (ordered.length === 2) return `${ordered[0]!.toLowerCase()} y ${ordered[1]!.toLowerCase()}`;
  return `${ordered.slice(0, -1).join(", ").toLowerCase()} y ${ordered.at(-1)!.toLowerCase()}`;
}

function effectivePlanForPreview(plan: RecoveryPlan): RecoveryPlan {
  if (isBurnoutRecoveryPlan(plan.problems)) {
    return { ...plan, variant: "lighter" };
  }
  return plan;
}

export function countRecoveryReplaceableSessions(
  plan: RecoveryPlan,
  plannedSessions: PlannedStudySession[],
  weekStartDate: string,
  today: string,
  activeSubjectIds: string[],
): number {
  const { start, end } = getWeekRange(weekStartDate);
  return plannedSessions.filter(
    (p) =>
      shouldDescheduleRecoverySession(plan, p, weekStartDate, activeSubjectIds) &&
      p.date >= start &&
      p.date <= end &&
      p.date >= today,
  ).length;
}

export function buildRecoveryPlanCalendarImpact(
  plan: RecoveryPlan,
  input: RecoveryCalendarPreviewInput,
): RecoveryPlan["calendarImpact"] {
  const currentPlannedMinutes = sumPendingPlannedMinutesForWeek(
    input.plannedSessions,
    input.weekStartDate,
  );

  const previewPlan = effectivePlanForPreview(plan);

  const applyInput: RecoveryApplyInput = {
    plan: previewPlan,
    activeSubjectIds: input.activeSubjectIds,
    reviewItems: input.reviewItems,
    errorLogItems: input.errorLogItems,
    weekStartDate: input.weekStartDate,
    today: input.today,
    weeklyGoalMinutes: input.weeklyGoalMinutes,
    currentPlannedMinutes: currentPlannedMinutes,
  };

  const sessions = recoveryPlanToPlannedSessions(applyInput);
  const replaceable = countRecoveryReplaceableSessions(
    previewPlan,
    input.plannedSessions,
    input.weekStartDate,
    input.today,
    input.activeSubjectIds,
  );

  return {
    days: 7,
    estimatedSessions: sessions.length,
    sessionTypesSummary: summarizeSessionTypes(sessions),
    willModifyExistingSessions: replaceable > 0 || sessions.length > 0,
  };
}

export function buildPracticalRecoverySummary(
  plan: RecoveryPlan,
  input: RecoveryCalendarPreviewInput,
): string {
  if (isBurnoutRecoveryPlan(plan.problems)) {
    return BURNOUT_MAIN_SUMMARY;
  }

  if (plan.focusReduction) {
    if (!plan.focusReduction.appliesThisWeek) {
      return "No tienes demasiadas asignaturas abiertas esta semana. Mantén el foco actual.";
    }
    return `Esta semana conviene reducir foco: tienes ${plan.focusReduction.activeSubjectsCount} asignaturas abiertas. Te propongo dejar fuera ${plan.focusReduction.subjectIdsToRemove.length} asignatura${plan.focusReduction.subjectIdsToRemove.length === 1 ? "" : "s"} del calendario semanal para concentrarte mejor.`;
  }

  if (isWeeklyStructureRecoveryPlan(plan)) {
    return buildWeeklyStructureRecoverySummary();
  }
  if (isMockCorrectionRecoveryPlan(plan)) {
    return MOCK_CORRECTION_SUMMARY;
  }
  if (isLowTimeRecoveryPlan(plan)) {
    return LOW_TIME_SUMMARY;
  }
  if (isStartGuidanceRecoveryPlan(plan)) {
    return START_GUIDANCE_SUMMARY;
  }
  if (isOverdueReviewsRecoveryPlan(plan)) {
    return OVERDUE_REVIEWS_SUMMARY;
  }

  const impact =
    plan.calendarImpact ?? buildRecoveryPlanCalendarImpact(plan, input);
  if (!impact || impact.estimatedSessions === 0) {
    return "Tu semana se simplificará con bloques más cortos y menos presión. Puedes aplicar el plan cuando quieras.";
  }

  const focusCount = pickRecoveryFocusSubjects(
    input.activeSubjectIds,
    input.reviewItems,
    input.errorLogItems,
    input.today,
  ).length;

  const subjectPhrase =
    focusCount <= 1
      ? "1 asignatura"
      : `${Math.min(2, focusCount)} asignaturas`;

  const calendarVerb = impact.willModifyExistingSessions
    ? "modificará sesiones pendientes y añadirá"
    : "añadirá";

  return `Durante los próximos ${impact.days} días el plan ${calendarVerb} unas ${impact.estimatedSessions} sesiones en tu calendario, priorizará ${subjectPhrase} y sesiones de ${impact.sessionTypesSummary} para recuperar el control.`;
}

export function attachRecoveryCalendarPreview(
  plan: RecoveryPlan,
  input: RecoveryCalendarPreviewInput,
): RecoveryPlan {
  const previewPlan = effectivePlanForPreview(plan);
  const calendarImpact = buildRecoveryPlanCalendarImpact(previewPlan, input);
  const enriched: RecoveryPlan = {
    ...previewPlan,
    calendarImpact,
    summary: buildPracticalRecoverySummary({ ...previewPlan, calendarImpact }, input),
  };

  if (isBurnoutRecoveryPlan(enriched.problems)) {
    const proposedSessionCount = calendarImpact?.estimatedSessions ?? 0;
    return {
      ...enriched,
      burnoutRelief: buildBurnoutRelief(input, proposedSessionCount),
      summary: BURNOUT_MAIN_SUMMARY,
    };
  }

  return enriched;
}

export { BURNOUT_PLAN_EFFECTS };
export {
  formatWeeklyStructureImpactLine,
  isWeeklyStructureRecoveryPlan,
  WEEKLY_STRUCTURE_PLAN_EFFECTS,
} from "./recovery-weekly-structure";
export {
  isLowTimeRecoveryPlan,
  LOW_TIME_BUTTON_HINT,
  LOW_TIME_BUTTON_LABEL,
  LOW_TIME_IMPACT_LINE,
} from "./recovery-low-time";
export {
  isStartGuidanceRecoveryPlan,
  START_GUIDANCE_BUTTON_HINT,
  START_GUIDANCE_BUTTON_LABEL,
  START_GUIDANCE_IMPACT_LINE,
} from "./recovery-start-guidance";
export {
  isMockCorrectionRecoveryPlan,
  MOCK_CORRECTION_BUTTON_HINT,
  MOCK_CORRECTION_BUTTON_LABEL,
  MOCK_CORRECTION_IMPACT_LINE,
} from "./recovery-mock-correction";
export {
  isOverdueReviewsRecoveryPlan,
  OVERDUE_REVIEWS_BUTTON_HINT,
  OVERDUE_REVIEWS_BUTTON_LABEL,
  OVERDUE_REVIEWS_IMPACT_LINE,
} from "./recovery-overdue-reviews";
