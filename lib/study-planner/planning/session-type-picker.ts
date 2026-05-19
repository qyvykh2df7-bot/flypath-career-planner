import type { ErrorLogItem, ReviewItem, StudySession } from "../types";
import {
  buildSubjectStudyStats,
  getSubjectMaturityPhase,
  pickSessionTypeForMaturity,
  type SubjectMaturityPhase,
  type SubjectStudyStats,
} from "./subject-maturity";

export type SubjectPlanningMeta = SubjectStudyStats & {
  phase: SubjectMaturityPhase;
  hasRecordedSessions: boolean;
};

export type PickSessionTypeParams = {
  subjectId: string;
  subjectBlockIndex: number;
  progressPercent: number;
  latestMockScore: number | null;
  pendingReviewCount: number;
  pendingErrorCount: number;
  phase: SubjectMaturityPhase;
  stats: SubjectStudyStats;
  errorSlotUsedForSubject: boolean;
  reviewSlotUsedForSubject: boolean;
  mockSlotUsedForSubject: boolean;
};

export function buildSubjectPlanningMetaMap(
  input: {
    sessions: StudySession[];
    reviewItems?: ReviewItem[];
    errorLogItems?: ErrorLogItem[];
    referenceDate: string;
    examDaysLeft?: number | null;
    examDaysLeftBySubject?: Record<string, number | null>;
    progressBySubject?: Record<string, number>;
    mockScoreBySubject?: Record<string, number | null>;
  },
  subjectIds: string[],
): Map<string, SubjectPlanningMeta> {
  const map = new Map<string, SubjectPlanningMeta>();

  for (const subjectId of subjectIds) {
    const perSubjectDays =
      input.examDaysLeftBySubject?.[subjectId] ??
      input.examDaysLeft ??
      null;
    const stats = buildSubjectStudyStats({
      subjectId,
      sessions: input.sessions,
      reviewItems: input.reviewItems,
      errorLogItems: input.errorLogItems,
      referenceDate: input.referenceDate,
      progressPercent: input.progressBySubject?.[subjectId] ?? 0,
      latestMockScore: input.mockScoreBySubject?.[subjectId] ?? null,
      examDaysLeft: perSubjectDays,
    });
    const phase = getSubjectMaturityPhase(stats);

    map.set(subjectId, {
      ...stats,
      phase,
      hasRecordedSessions: stats.sessionCount > 0,
    });
  }

  return map;
}

export function pickSessionTypeForBlock(
  params: PickSessionTypeParams,
): {
  type: import("../types").StudySessionType;
  usedErrorSlot: boolean;
  usedReviewSlot: boolean;
  usedMockSlot: boolean;
} {
  const picked = pickSessionTypeForMaturity({
    phase: params.phase,
    subjectBlockIndex: params.subjectBlockIndex,
    stats: params.stats,
    errorSlotUsed: params.errorSlotUsedForSubject,
    reviewSlotUsed: params.reviewSlotUsedForSubject,
    mockSlotUsed: params.mockSlotUsedForSubject,
  });

  return {
    type: picked.type,
    usedErrorSlot: picked.usedErrorSlot,
    usedReviewSlot: picked.usedReviewSlot,
    usedMockSlot: picked.usedMockSlot,
  };
}
