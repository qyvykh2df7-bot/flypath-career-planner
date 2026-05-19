import type { ErrorLogItem, ReviewItem, StudySession, StudySessionType } from "../types";
import { getReviewStatus } from "../calculations";

/** Fase pedagógica de una asignatura (heurística local, sin IA). */
export type SubjectMaturityPhase =
  | "initial"
  | "building"
  | "consolidation"
  | "review"
  | "exam";

export const SUBJECT_MATURITY_LABELS: Record<SubjectMaturityPhase, string> = {
  initial: "Inicial",
  building: "Construcción",
  consolidation: "Consolidación",
  review: "Revisión",
  exam: "Examen",
};

export type SubjectStudyStats = {
  subjectId: string;
  sessionCount: number;
  totalMinutes: number;
  theoryCount: number;
  bankCount: number;
  reviewCount: number;
  mockCount: number;
  errorCorrectionCount: number;
  pendingReviewCount: number;
  pendingErrorCount: number;
  latestMockScore: number | null;
  progressPercent: number;
  examDaysLeft: number | null;
};

export function countSessionsByType(
  sessions: StudySession[],
  subjectId: string,
): Pick<SubjectStudyStats, "theoryCount" | "bankCount" | "reviewCount" | "mockCount" | "errorCorrectionCount"> {
  const subjectSessions = sessions.filter((s) => s.subjectId === subjectId);
  return {
    theoryCount: subjectSessions.filter((s) => s.type === "theory").length,
    bankCount: subjectSessions.filter((s) => s.type === "question_bank").length,
    reviewCount: subjectSessions.filter((s) => s.type === "review").length,
    mockCount: subjectSessions.filter((s) => s.type === "mock").length,
    errorCorrectionCount: subjectSessions.filter((s) => s.type === "error_correction").length,
  };
}

export function buildSubjectStudyStats(params: {
  subjectId: string;
  sessions: StudySession[];
  reviewItems?: ReviewItem[];
  errorLogItems?: ErrorLogItem[];
  referenceDate: string;
  progressPercent: number;
  latestMockScore: number | null;
  examDaysLeft: number | null;
}): SubjectStudyStats {
  const subjectSessions = params.sessions.filter((s) => s.subjectId === params.subjectId);
  const typeCounts = countSessionsByType(params.sessions, params.subjectId);
  const reviews = params.reviewItems ?? [];
  const errors = params.errorLogItems ?? [];

  return {
    subjectId: params.subjectId,
    sessionCount: subjectSessions.length,
    totalMinutes: subjectSessions.reduce((s, x) => s + x.durationMinutes, 0),
    ...typeCounts,
    pendingReviewCount: reviews.filter(
      (r) =>
        r.subjectId === params.subjectId &&
        getReviewStatus(r, params.referenceDate) !== "completed",
    ).length,
    pendingErrorCount: errors.filter(
      (e) => e.subjectId === params.subjectId && e.status === "pending",
    ).length,
    latestMockScore: params.latestMockScore,
    progressPercent: params.progressPercent,
    examDaysLeft: params.examDaysLeft,
  };
}

/**
 * Determina la fase de madurez (prioridad: examen > revisión > consolidación > construcción > inicial).
 */
export function getSubjectMaturityPhase(stats: SubjectStudyStats): SubjectMaturityPhase {
  const examSoon = stats.examDaysLeft !== null && stats.examDaysLeft <= 28;
  const mockLow = stats.latestMockScore !== null && stats.latestMockScore < 78;
  const hasExamPressure =
    examSoon && (stats.progressPercent >= 35 || stats.sessionCount >= 2);
  const readyForMock =
    stats.progressPercent >= 40 &&
    (mockLow || (examSoon && stats.examDaysLeft !== null && stats.examDaysLeft <= 14));

  if (readyForMock || (hasExamPressure && stats.sessionCount >= 3)) {
    return "exam";
  }

  if (stats.pendingErrorCount > 0 || stats.pendingReviewCount > 0) {
    return "review";
  }

  const hasSolidTheoryBase =
    stats.theoryCount >= 3 ||
    (stats.theoryCount >= 2 && stats.totalMinutes >= 150);

  if (hasSolidTheoryBase) {
    return "consolidation";
  }

  if (stats.theoryCount >= 1 || stats.sessionCount >= 1) {
    if (stats.bankCount < 2 && stats.theoryCount <= 2) {
      return "building";
    }
    if (stats.bankCount >= 1 && stats.theoryCount >= 2) {
      return "consolidation";
    }
    return "building";
  }

  if (stats.sessionCount === 0 || stats.totalMinutes < 90) {
    return "initial";
  }

  return "building";
}

/** Secuencia pedagógica por fase e índice de bloque dentro de la semana (por asignatura). */
export function pickSessionTypeForMaturity(params: {
  phase: SubjectMaturityPhase;
  subjectBlockIndex: number;
  stats: SubjectStudyStats;
  errorSlotUsed: boolean;
  reviewSlotUsed: boolean;
  mockSlotUsed: boolean;
}): {
  type: StudySessionType;
  usedErrorSlot: boolean;
  usedReviewSlot: boolean;
  usedMockSlot: boolean;
} {
  const { phase, subjectBlockIndex: idx, stats } = params;
  let { errorSlotUsed, reviewSlotUsed, mockSlotUsed } = params;

  const finish = (type: StudySessionType) => ({
    type,
    usedErrorSlot: errorSlotUsed,
    usedReviewSlot: reviewSlotUsed,
    usedMockSlot: mockSlotUsed,
  });

  if (stats.pendingErrorCount > 0 && !errorSlotUsed && (phase === "review" || phase === "exam" || idx >= 2)) {
    errorSlotUsed = true;
    return finish("error_correction");
  }

  if (phase === "exam" && !mockSlotUsed && (idx === 0 || idx % 4 === 0 || (stats.latestMockScore !== null && stats.latestMockScore < 75))) {
    mockSlotUsed = true;
    return finish("mock");
  }

  if (stats.pendingReviewCount > 0 && !reviewSlotUsed && (phase === "review" || idx >= 3)) {
    reviewSlotUsed = true;
    return finish("review");
  }

  if (phase === "initial") {
    if (idx === 0 || idx === 1) return finish("theory");
    if (idx === 2) return finish("question_bank");
    if (idx === 3) return finish("theory");
    return finish(idx % 2 === 0 ? "theory" : "question_bank");
  }

  if (phase === "building") {
    if (idx === 0 || idx === 1) return finish("theory");
    if (idx === 2) return finish("question_bank");
    if (idx === 3) return finish(stats.pendingReviewCount > 0 ? "review" : "question_bank");
    return finish(idx % 2 === 0 ? "question_bank" : "theory");
  }

  if (phase === "consolidation") {
    if (idx === 0 || idx === 1) return finish("question_bank");
    if (idx === 2) return finish("review");
    if (idx === 3) return finish("question_bank");
    return finish(idx % 3 === 0 ? "review" : "question_bank");
  }

  if (phase === "review") {
    if (idx === 0 && stats.pendingErrorCount > 0) {
      errorSlotUsed = true;
      return finish("error_correction");
    }
    if (idx === 1 || idx === 3) return finish("review");
    return finish("question_bank");
  }

  // exam
  if (idx === 1 || idx === 4) return finish("question_bank");
  if (idx === 2 && stats.pendingErrorCount > 0) {
    errorSlotUsed = true;
    return finish("error_correction");
  }
  if (idx === 3) return finish("review");
  return finish("mock");
}
