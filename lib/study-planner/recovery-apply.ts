import type {
  ErrorLogItem,
  PlannedStudySession,
  RecoveryPlan,
  RecoveryPlanStep,
  ReviewItem,
  StudySessionType,
} from "./types";
import { createPlannerId, getReviewStatus, minutesToHoursLabel } from "./calculations";
import { getWeekDates } from "./date-utils";
import { getWeekRange } from "./date-utils";
import { isBurnoutRecoveryPlan } from "./recovery-burnout-relief";
import { computeRecoveryTargetMinutes } from "./recovery-load";
import { isPendingLikeStatus } from "./planner-session-status";

export type RecoveryApplyInput = {
  plan: RecoveryPlan;
  activeSubjectIds: string[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  weekStartDate: string;
  today: string;
  weeklyGoalMinutes: number;
  currentPlannedMinutes: number;
};

export type RecoveryApplyResult = {
  applied: boolean;
  sessionCount: number;
  sessions: PlannedStudySession[];
  previousPlannedMinutes: number;
  newPlannedMinutes: number;
  adjustmentLabel?: string;
};

const SLOT_TIMES = ["09:00", "14:00", "17:00", "19:00", "11:00", "16:00"];

const SKIPPED_ACTIONS = new Set(["rest", "reduce_subjects", "class_cta"]);

const ACTION_PRIORITY: Record<string, number> = {
  error_log: 4,
  review: 3,
  plan_session: 2,
  mock: 1,
};

function mapActionToSessionType(
  actionType: NonNullable<RecoveryPlanStep["actionType"]>,
  lighter: boolean,
  slotIndex: number,
): StudySessionType {
  if (lighter) {
    switch (actionType) {
      case "review":
        return "review";
      case "error_log":
        return "error_correction";
      case "mock":
        return "review";
      case "plan_session":
        return slotIndex % 2 === 0 ? "review" : "error_correction";
      default:
        return "review";
    }
  }
  switch (actionType) {
    case "review":
      return "review";
    case "error_log":
      return "error_correction";
    case "mock":
      return slotIndex < 2 ? "mock" : "review";
    case "plan_session":
      return slotIndex % 2 === 0 ? "theory" : "question_bank";
    default:
      return "theory";
  }
}

/** Asignaturas con repasos/errores pendientes primero; máximo 2 de foco. */
export function pickRecoveryFocusSubjects(
  activeSubjectIds: string[],
  reviewItems: ReviewItem[],
  errorLogItems: ErrorLogItem[],
  today: string,
): string[] {
  const active = new Set(activeSubjectIds);
  const priority: string[] = [];

  for (const item of reviewItems) {
    if (!active.has(item.subjectId)) continue;
    if (getReviewStatus(item, today) === "completed") continue;
    if (!priority.includes(item.subjectId)) priority.push(item.subjectId);
  }
  for (const item of errorLogItems) {
    if (!active.has(item.subjectId)) continue;
    if (item.status === "resolved") continue;
    if (!priority.includes(item.subjectId)) priority.push(item.subjectId);
  }
  for (const id of activeSubjectIds) {
    if (!priority.includes(id)) priority.push(id);
  }
  return priority.slice(0, 2);
}

/** Hasta 3 asignaturas prioritarias en semana ligera por burnout. */
export function pickBurnoutPrioritySubjects(
  activeSubjectIds: string[],
  reviewItems: ReviewItem[],
  errorLogItems: ErrorLogItem[],
  today: string,
): string[] {
  return pickRecoveryFocusSubjects(activeSubjectIds, reviewItems, errorLogItems, today).slice(
    0,
    3,
  );
}

export function getRecoverySubjectsToDeschedule(
  plan: RecoveryPlan,
  activeSubjectIds: string[],
): string[] {
  const fromPlan = plan.focusReduction?.subjectIdsToRemove ?? [];
  if (fromPlan.length > 0) return fromPlan;
  return activeSubjectIds;
}

export function shouldDescheduleRecoverySession(
  plan: RecoveryPlan,
  session: PlannedStudySession,
  weekStartDate: string,
  activeSubjectIds: string[],
): boolean {
  const { start, end } = getWeekRange(weekStartDate);
  if (session.date < start || session.date > end) return false;
  if (!isPendingLikeStatus(session.status)) return false;
  const targetSubjectSet = new Set(getRecoverySubjectsToDeschedule(plan, activeSubjectIds));
  if (!targetSubjectSet.has(session.subjectId)) return false;
  if (plan.focusReduction?.appliesThisWeek) return true;
  if (isBurnoutRecoveryPlan(plan.problems) && plan.variant === "lighter") return true;
  return session.source === "auto";
}

function actionableSteps(plan: RecoveryPlan): RecoveryPlanStep[] {
  return plan.steps.filter(
    (s) => s.actionType && !SKIPPED_ACTIONS.has(s.actionType),
  );
}

function orderStepsForRecovery(steps: RecoveryPlanStep[]): RecoveryPlanStep[] {
  return [...steps].sort((a, b) => {
    const pa = ACTION_PRIORITY[a.actionType ?? ""] ?? 0;
    const pb = ACTION_PRIORITY[b.actionType ?? ""] ?? 0;
    return pb - pa;
  });
}

function expandStepCycle(steps: RecoveryPlanStep[], count: number): RecoveryPlanStep[] {
  if (steps.length === 0 || count <= 0) return [];
  const ordered = orderStepsForRecovery(steps);
  const cycle: RecoveryPlanStep[] = [];
  for (let i = 0; i < count; i++) {
    cycle.push(ordered[i % ordered.length]!);
  }
  return cycle;
}

function distributeDurations(
  totalMinutes: number,
  blockCount: number,
  minDuration: number,
  maxDuration: number,
): number[] {
  if (blockCount <= 0) return [];
  const base = Math.min(maxDuration, Math.max(minDuration, Math.floor(totalMinutes / blockCount)));
  const durations = Array.from({ length: blockCount }, () => base);
  let sum = durations.reduce((acc, d) => acc + d, 0);
  let guard = 0;
  while (sum < totalMinutes && guard < blockCount * 300) {
    const idx = guard % blockCount;
    if (durations[idx]! < maxDuration) {
      durations[idx]! += 1;
      sum += 1;
    }
    guard += 1;
  }
  guard = 0;
  while (sum > totalMinutes && guard < blockCount * 300) {
    const idx = guard % blockCount;
    if (durations[idx]! > minDuration) {
      durations[idx]! -= 1;
      sum -= 1;
    }
    guard += 1;
  }
  return durations;
}

export function formatRecoveryAdjustmentLabel(
  previousMinutes: number,
  newMinutes: number,
): string {
  return `Plan ajustado: ${minutesToHoursLabel(previousMinutes)} → ${minutesToHoursLabel(newMinutes)}`;
}

/**
 * Convierte un plan de recuperación en bloques reales del calendario (sesiones planificadas).
 */
export function recoveryPlanToPlannedSessions(input: RecoveryApplyInput): PlannedStudySession[] {
  const {
    plan,
    activeSubjectIds,
    reviewItems,
    errorLogItems,
    weekStartDate,
    today,
    weeklyGoalMinutes,
    currentPlannedMinutes,
  } = input;

  if (activeSubjectIds.length === 0) return [];

  const lighter = plan.variant === "lighter";
  const burnout = isBurnoutRecoveryPlan(plan.problems);
  const steps = actionableSteps(plan);
  if (steps.length === 0) return [];

  const targetMinutes = computeRecoveryTargetMinutes({
    variant: lighter ? "lighter" : "standard",
    selectedProblems: plan.problems,
    currentPlannedMinutes,
    weeklyGoalMinutes,
  });

  const minDuration = burnout ? 45 : lighter ? 35 : 40;
  const maxDuration = burnout ? 60 : lighter ? 50 : 55;
  const avgDuration = burnout ? 52 : lighter ? 42 : 48;
  const maxBlocks = burnout ? 7 : lighter ? 8 : 10;
  const minBlocks = burnout ? 3 : Math.max(steps.length, 3);

  let blockCount = Math.ceil(targetMinutes / avgDuration);
  blockCount = Math.min(maxBlocks, Math.max(minBlocks, blockCount));

  const stepCycle = expandStepCycle(steps, blockCount);
  const durations = distributeDurations(targetMinutes, blockCount, minDuration, maxDuration);

  const focusSubjects =
    plan.focusReduction?.subjectIdsToKeep && plan.focusReduction.subjectIdsToKeep.length > 0
      ? plan.focusReduction.subjectIdsToKeep.slice(0, 3)
      : burnout
        ? pickBurnoutPrioritySubjects(activeSubjectIds, reviewItems, errorLogItems, today)
        : pickRecoveryFocusSubjects(activeSubjectIds, reviewItems, errorLogItems, today);
  const weekDates = getWeekDates(weekStartDate).filter((d) => d >= today);
  const dates = weekDates.length > 0 ? weekDates : [today];

  const sessions: PlannedStudySession[] = [];
  const sessionsPerDate: Record<string, number> = {};
  let dateCursor = 0;

  const pickDate = (): string => {
    for (let attempt = 0; attempt < dates.length * 2; attempt++) {
      const date = dates[dateCursor % dates.length]!;
      dateCursor += 1;
      const count = sessionsPerDate[date] ?? 0;
      if (!burnout || count < 2) {
        sessionsPerDate[date] = count + 1;
        return date;
      }
    }
    const fallback = dates[dateCursor % dates.length]!;
    dateCursor += 1;
    sessionsPerDate[fallback] = (sessionsPerDate[fallback] ?? 0) + 1;
    return fallback;
  };

  stepCycle.forEach((step, index) => {
    const actionType = step.actionType!;
    const subjectId = focusSubjects[index % focusSubjects.length] ?? activeSubjectIds[0]!;
    const date = pickDate();
    const type = mapActionToSessionType(actionType, lighter, index);

    sessions.push({
      id: createPlannerId(),
      date,
      startTime: SLOT_TIMES[index % SLOT_TIMES.length],
      subjectId,
      type,
      plannedDurationMinutes: durations[index] ?? minDuration,
      goal: burnout ? `Semana ligera: ${step.title}` : `Recuperación: ${step.title}`,
      status: "pending",
      source: "auto",
    });
  });

  return sessions;
}

export function buildRecoveryApplyResult(
  sessions: PlannedStudySession[],
  previousPlannedMinutes: number,
  newPlannedMinutes: number,
): RecoveryApplyResult {
  return {
    applied: sessions.length > 0,
    sessionCount: sessions.length,
    sessions,
    previousPlannedMinutes,
    newPlannedMinutes,
    adjustmentLabel:
      sessions.length > 0
        ? formatRecoveryAdjustmentLabel(previousPlannedMinutes, newPlannedMinutes)
        : undefined,
  };
}
