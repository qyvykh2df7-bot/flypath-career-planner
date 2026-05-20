import type {
  ErrorLogItem,
  MockResult,
  ReviewItem,
  StudySession,
  SubjectReadiness,
  SubjectReadinessLevel,
} from "./types";
import {
  calculateAverageMockScore,
  formatDateLocal,
  getDaysSinceDate,
  getLatestMockForSubject,
  getLatestSessionDateForSubject,
} from "./calculations";

export type ReadinessConfidence = "low" | "medium" | "high";

export type ReadinessBreakdown = {
  theoryMinutes: number;
  bankMinutes: number;
  reviewMinutes: number;
  otherSessionMinutes: number;
  theorySessions: number;
  bankSessions: number;
  mockCount: number;
  sessionCount: number;
  pendingErrors: number;
  pendingReviews: number;
  daysSinceLastSession: number | null;
  latestMockScore: number | null;
  averageMockScore: number | null;
};

export const READINESS_CONFIDENCE_LABELS: Record<ReadinessConfidence, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const PEDAGOGICAL_TIERS = [
  { max: 25, label: "Inicio" },
  { max: 45, label: "Construyendo base" },
  { max: 65, label: "Primeras señales positivas" },
  { max: 80, label: "Progresando bien" },
  { max: 90, label: "Preparación sólida" },
  { max: 100, label: "Muy preparado" },
] as const;

export const LOW_DATA_LABEL_CAP = "Primeras señales positivas";

export function scoreToPedagogicalLabel(score: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  for (const tier of PEDAGOGICAL_TIERS) {
    if (clamped <= tier.max) return tier.label;
  }
  return "Muy preparado";
}

export function capPedagogicalLabel(label: string, confidence: ReadinessConfidence): string {
  const tierLabels = PEDAGOGICAL_TIERS.map((t) => t.label);
  const labelIndex = tierLabels.indexOf(label as (typeof tierLabels)[number]);
  const capIndex = tierLabels.indexOf(LOW_DATA_LABEL_CAP);
  if (labelIndex === -1) return label;

  if (confidence === "low" && labelIndex > capIndex) {
    return LOW_DATA_LABEL_CAP;
  }
  if (confidence === "medium") {
    const progressIndex = tierLabels.indexOf("Progresando bien");
    if (labelIndex > progressIndex) return "Progresando bien";
  }
  return label;
}

export function buildReadinessBreakdown(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems?: ErrorLogItem[];
  reviewItems?: ReviewItem[];
}): ReadinessBreakdown {
  const subjectSessions = params.sessions.filter((s) => s.subjectId === params.subjectId);
  const subjectMocks = params.mockResults.filter((m) => m.subjectId === params.subjectId);

  let theoryMinutes = 0;
  let bankMinutes = 0;
  let reviewMinutes = 0;
  let otherSessionMinutes = 0;
  let theorySessions = 0;
  let bankSessions = 0;

  for (const s of subjectSessions) {
    const mins = Number.isFinite(s.durationMinutes) ? s.durationMinutes : 0;
    switch (s.type) {
      case "theory":
      case "class":
        theoryMinutes += mins;
        theorySessions += 1;
        break;
      case "question_bank":
        bankMinutes += mins;
        bankSessions += 1;
        break;
      case "review":
      case "error_correction":
        reviewMinutes += mins;
        break;
      default:
        otherSessionMinutes += mins;
        break;
    }
  }

  const lastDate = getLatestSessionDateForSubject(params.sessions, params.subjectId);
  const latestMock = getLatestMockForSubject(params.mockResults, params.subjectId);

  const pendingErrors =
    params.errorLogItems?.filter(
      (e) => e.subjectId === params.subjectId && e.status === "pending",
    ).length ?? 0;

  const pendingReviews =
    params.reviewItems?.filter(
      (r) => r.subjectId === params.subjectId && r.status !== "completed",
    ).length ?? 0;

  return {
    theoryMinutes,
    bankMinutes,
    reviewMinutes,
    otherSessionMinutes,
    theorySessions,
    bankSessions,
    mockCount: subjectMocks.length,
    sessionCount: subjectSessions.length,
    pendingErrors,
    pendingReviews,
    daysSinceLastSession: lastDate !== null ? getDaysSinceDate(lastDate) : null,
    latestMockScore: latestMock?.score ?? null,
    averageMockScore: calculateAverageMockScore(subjectMocks, 3),
  };
}

export function computeReadinessConfidence(b: ReadinessBreakdown): ReadinessConfidence {
  if (b.sessionCount === 0 && b.mockCount === 0) return "low";

  let points = 0;

  if (b.sessionCount >= 6) points += 2;
  else if (b.sessionCount >= 3) points += 1;

  if (b.bankSessions >= 3) points += 2;
  else if (b.bankSessions >= 1) points += 1;

  if (b.theorySessions >= 1 && b.bankSessions >= 1) points += 1;

  if (b.mockCount >= 3) points += 3;
  else if (b.mockCount >= 2) points += 2;
  else if (b.mockCount === 1) points += 0;

  const totalMinutes = b.theoryMinutes + b.bankMinutes + b.reviewMinutes + b.otherSessionMinutes;
  if (totalMinutes >= 600) points += 1;
  else if (totalMinutes >= 180) points += 0.5;

  if (b.daysSinceLastSession !== null && b.daysSinceLastSession <= 7) points += 1;
  else if (b.daysSinceLastSession !== null && b.daysSinceLastSession <= 14) points += 0.5;

  if (points <= 2.5) return "low";
  if (points <= 5.5) return "medium";
  return "high";
}

function mockEvidenceScore(avg: number | null, count: number): number {
  if (avg === null || count === 0) return 0;
  const reliability = count >= 3 ? 1 : count === 2 ? 0.78 : 0.42;
  return avg * reliability;
}

function studyFoundationScore(b: ReadinessBreakdown): number {
  let score = 0;
  if (b.theoryMinutes > 0) {
    score += Math.min(38, (b.theoryMinutes / 60) * 9);
  }
  if (b.bankMinutes > 0) {
    score += Math.min(42, (b.bankMinutes / 60) * 11);
  }
  if (b.reviewMinutes > 0) {
    score += Math.min(12, (b.reviewMinutes / 60) * 4);
  }
  if (b.theorySessions >= 1 && b.bankSessions >= 1) {
    score += 8;
  }
  return Math.min(100, score);
}

function recencyScore(daysSince: number | null): number {
  if (daysSince === null) return 0;
  if (daysSince === 0) return 100;
  if (daysSince <= 7) return 85;
  if (daysSince <= 14) return 65;
  if (daysSince <= 21) return 40;
  return 15;
}

export function computeReadinessScore(
  b: ReadinessBreakdown,
  confidence: ReadinessConfidence,
): number {
  if (b.sessionCount === 0 && b.mockCount === 0) return 0;

  const foundation = studyFoundationScore(b);
  const mocks = mockEvidenceScore(b.averageMockScore, b.mockCount);
  const recency = recencyScore(b.daysSinceLastSession);

  let raw =
    foundation * 0.42 + mocks * 0.33 + recency * 0.15 + Math.min(10, b.mockCount * 3.5);

  if (b.pendingErrors > 0) {
    raw -= Math.min(18, 6 + b.pendingErrors * 3);
  }
  if (b.pendingReviews > 0) {
    raw -= Math.min(10, 3 + b.pendingReviews * 2);
  }

  if (b.latestMockScore !== null && b.latestMockScore < 70) {
    raw -= Math.min(12, 70 - b.latestMockScore) * 0.25;
  }

  if (confidence === "low") {
    raw = Math.min(raw, 64);
  } else if (confidence === "medium") {
    raw = Math.min(raw, 82);
  }

  if (b.mockCount === 1 && b.sessionCount <= 2) {
    raw = Math.min(raw, 62);
  }

  if (b.mockCount === 1 && b.bankSessions === 0 && b.bankMinutes < 60) {
    raw = Math.min(raw, 58);
  }

  if (
    b.mockCount === 1 &&
    b.latestMockScore !== null &&
    b.latestMockScore >= 80 &&
    b.theorySessions >= 1 &&
    confidence === "low"
  ) {
    raw = Math.max(raw, 52);
    raw = Math.min(raw, 62);
  }

  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function buildReadinessMessage(
  score: number,
  pedagogicalLabel: string,
  confidence: ReadinessConfidence,
  b: ReadinessBreakdown,
): string {
  if (b.sessionCount === 0 && b.mockCount === 0) {
    return "Registra sesiones o simulacros de examen para calcular el nivel de preparación.";
  }

  if (
    confidence === "low" &&
    b.mockCount >= 1 &&
    b.latestMockScore !== null &&
    b.latestMockScore >= 75
  ) {
    return "Buen resultado en simulacro de examen, pero aún hay pocos datos para confirmar preparación sólida.";
  }

  if (b.pendingErrors > 0) {
    return "Corrige errores pendientes antes de confiar en un simulacro de examen aislado.";
  }

  if (pedagogicalLabel === "Inicio" || pedagogicalLabel === "Construyendo base") {
    return "Estás empezando. Alterna teoría, banco y simulacros de examen para afinar el nivel.";
  }

  if (pedagogicalLabel === "Primeras señales positivas") {
    return "Hay señales alentadoras; sigue acumulando banco y más simulacros de examen.";
  }

  if (pedagogicalLabel === "Progresando bien") {
    return "Buen ritmo. Mantén repasos y simulacros de examen antes del examen.";
  }

  if (score >= 90) {
    return "Muy buen nivel orientativo. Mantén consistencia hasta el examen.";
  }

  return "Nivel orientativo basado en tu actividad reciente. Sigue registrando datos.";
}

function resolveInternalLevel(
  score: number,
  hasActivity: boolean,
): SubjectReadinessLevel {
  if (!hasActivity) return "no_data";
  if (score <= 35) return "low";
  if (score <= 55) return "medium";
  if (score <= 78) return "high";
  return "solid";
}

export function qualifiesAsPrepared(readiness: SubjectReadiness): boolean {
  if (readiness.confidence !== "high") return false;
  if (readiness.score < 80) return false;
  if (readiness.factors.mockCount < 2) return false;
  if (readiness.breakdown.bankSessions < 2 && readiness.breakdown.bankMinutes < 120) {
    return false;
  }
  if (readiness.breakdown.pendingErrors > 0) return false;
  const label = readiness.pedagogicalLabel;
  return label === "Progresando bien" || label === "Preparación sólida" || label === "Muy preparado";
}

export function computeSubjectReadinessMetrics(params: {
  subjectId: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems?: ErrorLogItem[];
  reviewItems?: ReviewItem[];
}): Pick<
  SubjectReadiness,
  | "score"
  | "level"
  | "label"
  | "message"
  | "pedagogicalLabel"
  | "confidence"
  | "confidenceLabel"
  | "isProvisional"
  | "breakdown"
  | "factors"
> {
  const breakdown = buildReadinessBreakdown(params);
  const confidence = computeReadinessConfidence(breakdown);
  const score = computeReadinessScore(breakdown, confidence);
  const rawLabel = scoreToPedagogicalLabel(score);
  const pedagogicalLabel = capPedagogicalLabel(rawLabel, confidence);
  const hasActivity = breakdown.sessionCount > 0 || breakdown.mockCount > 0;
  const level = resolveInternalLevel(score, hasActivity);

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = formatDateLocal(cutoff);
  const recentStudyMinutes = params.sessions
    .filter((s) => s.subjectId === params.subjectId && s.date >= cutoffStr)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const totalStudyMinutes =
    breakdown.theoryMinutes +
    breakdown.bankMinutes +
    breakdown.reviewMinutes +
    breakdown.otherSessionMinutes;

  return {
    score,
    level,
    label: pedagogicalLabel,
    pedagogicalLabel,
    confidence,
    confidenceLabel: READINESS_CONFIDENCE_LABELS[confidence],
    isProvisional: confidence === "low",
    message: buildReadinessMessage(score, pedagogicalLabel, confidence, breakdown),
    breakdown,
    factors: {
      totalStudyMinutes,
      recentStudyMinutes,
      latestMockScore: breakdown.latestMockScore,
      averageMockScore: breakdown.averageMockScore,
      mockCount: breakdown.mockCount,
      daysSinceLastSession: breakdown.daysSinceLastSession,
    },
  };
}
