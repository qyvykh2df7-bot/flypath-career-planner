import type {
  ErrorLogItem,
  ExamDate,
  MockResult,
  ReviewItem,
  StudySession,
  StudySubject,
} from "./types";
import {
  MOCK_TREND_LABELS,
  calculateAverageMockScore,
  calculatePendingErrorsForSubject,
  calculatePendingReviewCount,
  calculateReadinessForSubjects,
  getMockTrend,
  getTodayDateString,
  sortMocksByDateDesc,
} from "./calculations";
import {
  formatEvaluationDataSourceLine,
  hasEvaluationMeaningfulData,
  summarizeEvaluationDataSources,
} from "./evaluation-data-sources";
import {
  buildSubjectsPageSummary,
  resolveSubjectDisplayStatus,
} from "./subjects-page-logic";
import { getSubjectById } from "./subjects";
import type { PlannedStudySession } from "./types";

export type EvaluationView = "mocks" | "reviews";

/** Compatibilidad: vistas antiguas que apuntaban a errores. */
export function normalizeEvaluationView(view: string | undefined): EvaluationView {
  if (view === "reviews") return "reviews";
  return "mocks";
}

export type EvaluationSummary = {
  avgMockScore: number | null;
  mockCount: number;
  pendingErrors: number;
  pendingReviews: number;
  atRiskCount: number;
  hasEnoughData: boolean;
  hasMeaningfulStudyData: boolean;
  dataSourceLine: string;
};

export type EvaluationCoachAction =
  | { kind: "register_mock" }
  | { kind: "view_errors" }
  | { kind: "view_reviews" }
  | { kind: "view_calendar" }
  | { kind: "plan_review" }
  | { kind: "view_subjects" };

export type EvaluationCoachRecommendation = {
  title: string;
  message: string;
  action: EvaluationCoachAction;
  ctaLabel: string;
};

const COACH_TITLE = "Qué reforzar ahora";

const MOCK_HIGH_THRESHOLD = 80;
const MOCK_LOW_THRESHOLD = 70;

export function formatSubjectMockTrendLabel(
  mockCount: number,
  trend: ReturnType<typeof getMockTrend>,
): string | null {
  if (mockCount <= 1) return "Primer simulacro de examen";
  if (trend === "none") return null;
  return MOCK_TREND_LABELS[trend];
}

export function formatHistoryMockTrendLabel(sorted: MockResult[], index: number): string | null {
  const current = sorted[index];
  if (!current) return null;
  const olderSameSubject = sorted.slice(index + 1).find((m) => m.subjectId === current.subjectId);
  if (!olderSameSubject) return "Primer simulacro de examen";
  const trend = getMockTrend([current, olderSameSubject]);
  if (trend === "none") return null;
  return MOCK_TREND_LABELS[trend];
}

export function buildEvaluationSummary(params: {
  mockResults: MockResult[];
  errorLogItems: ErrorLogItem[];
  reviewItems: ReviewItem[];
  subjectIds: string[];
  examDates: ExamDate[];
  sessions: StudySession[];
  plannedSessions?: PlannedStudySession[];
  today?: string;
}): EvaluationSummary {
  const today = params.today ?? getTodayDateString();
  const mockCount = params.mockResults.length;
  const avgMockScore = calculateAverageMockScore(params.mockResults, 5);
  const pendingErrors = params.errorLogItems.filter((e) => e.status === "pending").length;
  const pendingReviews = calculatePendingReviewCount(params.reviewItems);

  const readiness = calculateReadinessForSubjects({
    subjectIds: params.subjectIds,
    sessions: params.sessions,
    mockResults: params.mockResults,
  });
  const pendingBySubject: Record<string, number> = {};
  for (const id of params.subjectIds) {
    pendingBySubject[id] = calculatePendingErrorsForSubject(params.errorLogItems, id);
  }
  const summary = buildSubjectsPageSummary(
    readiness,
    params.examDates,
    pendingBySubject,
    today,
  );

  const sourceCounts = summarizeEvaluationDataSources({
    sessions: params.sessions,
    mockResults: params.mockResults,
    plannedSessions: params.plannedSessions ?? [],
    errorLogItems: params.errorLogItems,
    reviewItems: params.reviewItems,
  });
  const hasMeaningfulStudyData = hasEvaluationMeaningfulData(sourceCounts);
  const hasEnoughData =
    hasMeaningfulStudyData || pendingErrors > 0 || pendingReviews > 0;

  return {
    avgMockScore,
    mockCount,
    pendingErrors,
    pendingReviews,
    atRiskCount: summary.atRiskCount,
    hasEnoughData,
    hasMeaningfulStudyData,
    dataSourceLine: formatEvaluationDataSourceLine(sourceCounts),
  };
}

export function buildEvaluationCoachRecommendation(
  summary: EvaluationSummary,
  _errorLogItems: ErrorLogItem[],
  reviewItems: ReviewItem[],
  mockResults: MockResult[],
): EvaluationCoachRecommendation {
  if (summary.mockCount === 0) {
    return {
      title: COACH_TITLE,
      message:
        "Empieza registrando tu primer simulacro de examen para detectar tu nivel real.",
      action: { kind: "register_mock" },
      ctaLabel: "Registrar simulacro de examen",
    };
  }

  if (summary.pendingReviews > 0) {
    return {
      title: COACH_TITLE,
      message: "Tienes repasos pendientes. Ciérralos para consolidar lo estudiado.",
      action: { kind: "view_reviews" },
      ctaLabel: "Ver repasos",
    };
  }

  if (summary.atRiskCount > 0) {
    return {
      title: COACH_TITLE,
      message: "Prioriza las asignaturas en riesgo esta semana.",
      action: { kind: "view_subjects" },
      ctaLabel: "Ver asignaturas",
    };
  }

  const recent = sortMocksByDateDesc(mockResults);
  const last = recent[0];

  if (last && last.score < MOCK_LOW_THRESHOLD) {
    const name = getSubjectById(last.subjectId)?.name ?? "esta asignatura";
    return {
      title: COACH_TITLE,
      message: `Refuerza ${name} antes de repetir simulacro de examen.`,
      action: { kind: "plan_review" },
      ctaLabel: "Planificar repaso",
    };
  }

  if (last && last.score >= MOCK_HIGH_THRESHOLD) {
    return {
      title: COACH_TITLE,
      message:
        "Buen resultado. Mantén el ritmo con banco y un repaso ligero antes de repetir simulacro de examen.",
      action: { kind: "view_calendar" },
      ctaLabel: "Ir al calendario",
    };
  }

  return {
    title: COACH_TITLE,
    message: "Mantén el ritmo: alterna banco, repaso y simulacros de examen según tu plan semanal.",
    action: { kind: "view_calendar" },
    ctaLabel: "Ir al calendario",
  };
}

export function countReviewsDueToday(reviewItems: ReviewItem[], today?: string): number {
  const day = today ?? getTodayDateString();
  return reviewItems.filter((r) => r.status !== "completed" && r.dueDate === day).length;
}

/** Línea compacta para Hoy cuando hay simulacros registrados. */
export function formatEvaluationDashboardLine(
  summary: EvaluationSummary,
  reviewItems: ReviewItem[] = [],
  today?: string,
): string | null {
  if (summary.mockCount === 0) return null;

  const avg = summary.avgMockScore !== null ? Math.round(summary.avgMockScore) : 0;
  const reviewsToday = countReviewsDueToday(reviewItems, today);
  const reviewLabel = reviewsToday === 1 ? "repaso hoy" : "repasos hoy";

  return [`Simulacros de examen ${avg}%`, `${reviewsToday} ${reviewLabel}`].join(" · ");
}

export type EvaluationDiagnostic = {
  attentionSubjects: { subjectId: string; name: string; reason: string }[];
  mockTrendLabel: string;
  repeatedErrorTopics: string[];
  nextActions: string[];
};

export function buildEvaluationDiagnostic(params: {
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems: ErrorLogItem[];
  reviewItems: ReviewItem[];
  examDates: ExamDate[];
}): EvaluationDiagnostic {
  const readiness = calculateReadinessForSubjects({
    subjectIds: params.subjects.map((s) => s.id),
    sessions: params.sessions,
    mockResults: params.mockResults,
  });

  const pendingBySubject: Record<string, number> = {};
  for (const s of params.subjects) {
    pendingBySubject[s.id] = calculatePendingErrorsForSubject(params.errorLogItems, s.id);
  }

  const attentionSubjects = readiness
    .map((r) => {
      const status = resolveSubjectDisplayStatus(
        r,
        params.examDates,
        pendingBySubject[r.subjectId] ?? 0,
      );
      if (status !== "at_risk" && status !== "no_data") return null;
      const name = getSubjectById(r.subjectId)?.name ?? r.subjectId;
      const reason =
        status === "at_risk"
          ? "Preparación baja o simulacro de examen reciente bajo"
          : "Sin actividad registrada";
      return { subjectId: r.subjectId, name, reason };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(0, 3);

  const sorted = sortMocksByDateDesc(params.mockResults);
  let mockTrendLabel = "Sin simulacros de examen registrados";
  if (sorted.length >= 2) {
    const diff = sorted[0]!.score - sorted[1]!.score;
    if (diff > 3) mockTrendLabel = "Tendencia de simulacros de examen: subiendo";
    else if (diff < -3) mockTrendLabel = "Tendencia de simulacros de examen: bajando";
    else mockTrendLabel = "Tendencia de simulacros de examen: estable";
  } else if (sorted.length === 1) {
    mockTrendLabel = "Primer simulacro de examen registrado";
  }

  const topicCounts = new Map<string, number>();
  for (const e of params.errorLogItems.filter((x) => x.status === "pending")) {
    const key = `${e.subjectId}::${e.topic.toLowerCase()}`;
    topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
  }
  const repeatedErrorTopics = [...topicCounts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([key]) => {
      const [subjectId, topic] = key.split("::");
      const name = getSubjectById(subjectId)?.name ?? subjectId;
      return `${name}: ${topic}`;
    })
    .slice(0, 3);

  const nextActions: string[] = [];
  if (params.mockResults.length === 0) nextActions.push("Registrar un simulacro de examen");
  if (calculatePendingReviewCount(params.reviewItems) > 0) {
    nextActions.push("Completar repasos vencidos");
  }
  if (nextActions.length === 0) nextActions.push("Mantener ritmo semanal en banco y repaso");

  return {
    attentionSubjects,
    mockTrendLabel,
    repeatedErrorTopics,
    nextActions,
  };
}
