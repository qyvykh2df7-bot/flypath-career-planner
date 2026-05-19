import type { StudySessionType } from "../types";
import {
  calculateEstimatedMinutesPerSubject,
  calculateSubjectProgressPercent,
  createPlannerId,
  getDaysUntilDate,
  getLatestSessionDateForSubject,
} from "../calculations";
import {
  getWeekDates,
  getWeekKind,
  getWeekRange,
} from "../date-utils";
import { getSessionTypeReasonLabel } from "./planning-labels";
import {
  buildSubjectPlanningMetaMap,
  pickSessionTypeForBlock,
} from "./session-type-picker";
import type { SubjectMaturityPhase } from "./subject-maturity";
import type {
  PlannedStudyBlock,
  PlanningEngineInput,
  PlanningEngineResult,
  PlanningGenerationWarning,
  PlanningPriorityReason,
  SubjectPriorityScore,
  WeeklyPlanPriority,
  WeeklyStudyPlan,
} from "./planning-types";

const BLOCK_SIZES = [90, 60, 45] as const;
const MIN_BLOCK_MINUTES = 30;
const MAX_BLOCKS_PER_DAY = 2;
const SUGGESTED_TIMES = ["09:00", "14:00", "17:00", "19:00"] as const;

function scoreToPriority(score: number): WeeklyPlanPriority {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function decomposeMinutes(total: number): number[] {
  const blocks: number[] = [];
  let remaining = total;

  while (remaining >= MIN_BLOCK_MINUTES) {
    let placed = false;
    for (const size of BLOCK_SIZES) {
      if (remaining >= size) {
        blocks.push(size);
        remaining -= size;
        placed = true;
        break;
      }
    }
    if (!placed) {
      blocks.push(remaining);
      remaining = 0;
    }
  }

  return blocks;
}

function reasonForSessionType(
  sessionType: StudySessionType,
  fallback: PlanningPriorityReason,
): PlanningPriorityReason {
  switch (sessionType) {
    case "mock":
      return "mock_recommended";
    case "question_bank":
      return "question_bank_focus";
    case "review":
      return "review_recommended";
    case "error_correction":
      return "review_recommended";
    default:
      return fallback;
  }
}

function dominantReasonForSubject(params: {
  progressPercent: number;
  daysSinceLastSession: number | null;
  latestMockScore: number | null;
  examDaysLeft: number | null;
}): PlanningPriorityReason {
  const { progressPercent, daysSinceLastSession, latestMockScore, examDaysLeft } = params;

  if (examDaysLeft !== null && examDaysLeft <= 21) return "exam_soon";
  if (daysSinceLastSession === null || daysSinceLastSession > 10) return "no_recent_study";
  if (progressPercent < 35) return "low_progress";
  if (latestMockScore !== null && latestMockScore < 70) return "low_mock_score";
  return "maintain_rhythm";
}

export function rankSubjectsByPriority(input: PlanningEngineInput): SubjectPriorityScore[] {
  const { activeSubjectIds, referenceDate, sessions, mockResults, mode, weeklyGoalMinutes, targetExamDate, studyStartDate } =
    input;

  if (activeSubjectIds.length === 0) return [];

  const estimatedPerSubject = calculateEstimatedMinutesPerSubject({
    mode,
    activeSubjectCount: activeSubjectIds.length,
    weeklyGoalMinutes,
    targetExamDate,
    studyStartDate,
  });

  const examDaysLeft = targetExamDate
    ? getDaysUntilDate(targetExamDate, referenceDate)
    : null;

  return activeSubjectIds
    .map((subjectId) => {
      const progressPercent = calculateSubjectProgressPercent({
        subjectId,
        sessions,
        mockResults,
        estimatedTargetMinutes: estimatedPerSubject,
      });

      const subjectMocks = mockResults
        .filter((m) => m.subjectId === subjectId)
        .sort((a, b) => b.date.localeCompare(a.date));
      const latestMockScore = subjectMocks[0]?.score ?? null;

      const lastSession = getLatestSessionDateForSubject(sessions, subjectId);
      let daysSinceLast = 999;
      if (lastSession) {
        const diff = getDaysUntilDate(referenceDate, lastSession);
        daysSinceLast = diff <= 0 ? Math.abs(diff) : 0;
      }

      const progressScore = 100 - progressPercent;
      const mockScore =
        latestMockScore === null ? 45 : Math.max(0, 100 - latestMockScore);
      const recencyScore = Math.min(35, daysSinceLast * 2.5);
      const examScore =
        examDaysLeft !== null && examDaysLeft >= 0
          ? Math.min(25, Math.max(0, 25 - examDaysLeft / 4))
          : 0;

      const score = progressScore * 0.38 + mockScore * 0.22 + recencyScore * 0.25 + examScore * 0.15;

      const dominantReason = dominantReasonForSubject({
        progressPercent,
        daysSinceLastSession: lastSession === null ? null : daysSinceLast,
        latestMockScore,
        examDaysLeft,
      });

      return {
        subjectId,
        score,
        progressPercent,
        latestMockScore,
        daysSinceLastSession: lastSession === null ? null : daysSinceLast,
        dominantReason,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function distributeWeeklyMinutes(
  input: PlanningEngineInput,
  ranked: SubjectPriorityScore[],
): Record<string, number> {
  const total = Math.max(0, input.weeklyGoalMinutes);
  if (ranked.length === 0 || total === 0) return {};

  const weightSum = ranked.reduce((s, r) => s + Math.max(r.score, 1), 0);
  const shares = ranked.map((r) => ({
    subjectId: r.subjectId,
    minutes: Math.floor((total * Math.max(r.score, 1)) / weightSum),
  }));

  let allocated = shares.reduce((s, x) => s + x.minutes, 0);
  let idx = 0;
  while (allocated < total && shares.length > 0) {
    shares[idx % shares.length]!.minutes += 1;
    allocated += 1;
    idx += 1;
    if (idx > total + shares.length) break;
  }

  const result: Record<string, number> = {};
  for (const s of shares) {
    if (s.minutes >= MIN_BLOCK_MINUTES) {
      result[s.subjectId] = s.minutes;
    }
  }

  if (Object.keys(result).length === 0 && ranked[0]) {
    result[ranked[0].subjectId] = total;
  }

  return result;
}

type BlockDraft = {
  subjectId: string;
  plannedMinutes: number;
  priority: WeeklyPlanPriority;
  dominantReason: PlanningPriorityReason;
  progressPercent: number;
  latestMockScore: number | null;
  blockIndex: number;
};

function assignBlocksToDays(
  drafts: BlockDraft[],
  eligibleDates: string[],
  input: PlanningEngineInput,
  subjectMetaBase: ReturnType<typeof buildSubjectPlanningMetaMap>,
): PlannedStudyBlock[] {
  if (eligibleDates.length === 0) return [];

  const dayCounts = new Map<string, number>();
  for (const d of eligibleDates) dayCounts.set(d, 0);

  const sortedDrafts = [...drafts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  const blocks: PlannedStudyBlock[] = [];
  let dayCursor = 0;
  const errorSlotUsed = new Set<string>();
  const reviewSlotUsed = new Set<string>();
  const mockSlotUsed = new Set<string>();

  for (const draft of sortedDrafts) {
    let assignedDate: string | null = null;
    for (let attempt = 0; attempt < eligibleDates.length; attempt++) {
      const date = eligibleDates[(dayCursor + attempt) % eligibleDates.length]!;
      if ((dayCounts.get(date) ?? 0) < MAX_BLOCKS_PER_DAY) {
        assignedDate = date;
        dayCursor = (dayCursor + attempt + 1) % eligibleDates.length;
        break;
      }
    }

    if (!assignedDate) {
      // Todos los días llenos: permitir un tercer bloque el día con menos carga
      assignedDate = [...eligibleDates].sort(
        (a, b) => (dayCounts.get(a) ?? 0) - (dayCounts.get(b) ?? 0),
      )[0]!;
    }

    dayCounts.set(assignedDate, (dayCounts.get(assignedDate) ?? 0) + 1);
    const timeIndex = (dayCounts.get(assignedDate) ?? 1) - 1;
    const suggestedStartTime = SUGGESTED_TIMES[timeIndex % SUGGESTED_TIMES.length]!;

    const baseMeta = subjectMetaBase.get(draft.subjectId);
    const stats = baseMeta ?? {
      subjectId: draft.subjectId,
      sessionCount: 0,
      totalMinutes: 0,
      theoryCount: 0,
      bankCount: 0,
      reviewCount: 0,
      mockCount: 0,
      errorCorrectionCount: 0,
      pendingReviewCount: 0,
      pendingErrorCount: 0,
      latestMockScore: draft.latestMockScore,
      progressPercent: draft.progressPercent,
      examDaysLeft: null,
      phase: "initial" as const,
      hasRecordedSessions: false,
    };
    const picked = pickSessionTypeForBlock({
      subjectId: draft.subjectId,
      progressPercent: draft.progressPercent,
      latestMockScore: draft.latestMockScore,
      pendingReviewCount: stats.pendingReviewCount,
      pendingErrorCount: stats.pendingErrorCount,
      subjectBlockIndex: draft.blockIndex,
      phase: "phase" in stats ? stats.phase : "initial",
      stats,
      errorSlotUsedForSubject: errorSlotUsed.has(draft.subjectId),
      reviewSlotUsedForSubject: reviewSlotUsed.has(draft.subjectId),
      mockSlotUsedForSubject: mockSlotUsed.has(draft.subjectId),
    });
    const sessionType = picked.type;
    if (picked.usedErrorSlot) errorSlotUsed.add(draft.subjectId);
    if (picked.usedReviewSlot) reviewSlotUsed.add(draft.subjectId);
    if (picked.usedMockSlot) mockSlotUsed.add(draft.subjectId);

    const reason = reasonForSessionType(sessionType, draft.dominantReason);

    blocks.push({
      id: createPlannerId(),
      date: assignedDate,
      suggestedStartTime,
      subjectId: draft.subjectId,
      sessionType,
      plannedMinutes: draft.plannedMinutes,
      priority: draft.priority,
      reason,
      reasonLabel: getSessionTypeReasonLabel(sessionType, draft.dominantReason),
    });
  }

  return blocks.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.suggestedStartTime.localeCompare(b.suggestedStartTime);
  });
}

export function generateWeeklyPlan(input: PlanningEngineInput): PlanningEngineResult {
  const warnings: PlanningGenerationWarning[] = [];

  if (input.activeSubjectIds.length === 0) {
    return {
      plan: null,
      warnings: [
        {
          code: "no_active_subjects",
          message: "No hay asignaturas activas. Actívalas en la configuración del plan.",
        },
      ],
    };
  }

  const weekStart = input.weekStartDate;
  const { start, end } = getWeekRange(weekStart);
  const weekDates = getWeekDates(weekStart);
  const weekKind = getWeekKind(weekStart, input.referenceDate);

  if (weekKind === "past") {
    return {
      plan: null,
      warnings: [
        {
          code: "past_week",
          message: "No puedes generar planes para semanas pasadas.",
        },
      ],
    };
  }

  const eligibleDates =
    weekKind === "future"
      ? [...weekDates]
      : weekDates.filter((d) => d >= input.referenceDate);

  if (eligibleDates.length === 0) {
    return {
      plan: null,
      warnings: [
        {
          code: "no_eligible_days",
          message: "No quedan días disponibles en esta semana para planificar.",
        },
      ],
    };
  }

  if (input.weeklyGoalMinutes < MIN_BLOCK_MINUTES) {
    warnings.push({
      code: "low_weekly_minutes",
      message: "El objetivo semanal es muy bajo para generar bloques útiles.",
    });
  }

  const ranked = rankSubjectsByPriority(input);
  const minutesBySubject = distributeWeeklyMinutes(input, ranked);

  const drafts: BlockDraft[] = [];
  const subjectBlockIndex = new Map<string, number>();

  for (const r of ranked) {
    const minutes = minutesBySubject[r.subjectId] ?? 0;
    const sizes = decomposeMinutes(minutes);
    const priority = scoreToPriority(r.score);

    for (const size of sizes) {
      const blockIndex = subjectBlockIndex.get(r.subjectId) ?? 0;
      subjectBlockIndex.set(r.subjectId, blockIndex + 1);

      drafts.push({
        subjectId: r.subjectId,
        plannedMinutes: size,
        priority,
        dominantReason: r.dominantReason,
        progressPercent: r.progressPercent,
        latestMockScore: r.latestMockScore,
        blockIndex,
      });
    }
  }

  const examDaysLeft = input.targetExamDate
    ? getDaysUntilDate(input.targetExamDate, input.referenceDate)
    : null;

  const progressBySubject: Record<string, number> = {};
  const mockScoreBySubject: Record<string, number | null> = {};
  for (const r of ranked) {
    progressBySubject[r.subjectId] = r.progressPercent;
    mockScoreBySubject[r.subjectId] = r.latestMockScore;
  }

  const subjectMetaBase = buildSubjectPlanningMetaMap(
    {
      sessions: input.sessions,
      reviewItems: input.reviewItems,
      errorLogItems: input.errorLogItems,
      referenceDate: input.referenceDate,
      examDaysLeft: examDaysLeft !== null && examDaysLeft >= 0 ? examDaysLeft : null,
      progressBySubject,
      mockScoreBySubject,
    },
    input.activeSubjectIds,
  );

  const blocks = assignBlocksToDays(drafts, eligibleDates, input, subjectMetaBase);
  const totalPlannedMinutes = blocks.reduce((s, b) => s + b.plannedMinutes, 0);
  const focusSubjectIds = ranked.slice(0, 3).map((r) => r.subjectId);

  const subjectPhases: Record<string, SubjectMaturityPhase> = {};
  for (const [id, meta] of subjectMetaBase) {
    subjectPhases[id] = meta.phase;
  }

  const summaryHints: string[] = [];
  if (input.targetExamDate) {
    const days = getDaysUntilDate(input.targetExamDate, input.referenceDate);
    if (days >= 0 && days <= 30) {
      summaryHints.push(`Objetivo en ${days} días — priorizando asignaturas con menos avance.`);
    }
  }
  if (focusSubjectIds.length > 0) {
    summaryHints.push(`${focusSubjectIds.length} asignaturas con más foco esta semana.`);
  }
  summaryHints.push(
    `Reparto en ${eligibleDates.length} día${eligibleDates.length === 1 ? "" : "s"} (máx. ${MAX_BLOCKS_PER_DAY} bloques/día).`,
  );

  return {
    plan: {
      weekStartDate: start,
      weekEndDate: end,
      mode: input.mode,
      totalPlannedMinutes,
      blocks,
      focusSubjectIds,
      summaryHints,
      subjectPhases,
    },
    warnings,
  };
}
