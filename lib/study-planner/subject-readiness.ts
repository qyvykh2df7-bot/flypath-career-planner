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
  mockScores: number[];
  uniqueStudyDays: number;
};

export const READINESS_CONFIDENCE_LABELS: Record<ReadinessConfidence, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

/** Pesos del score compuesto de preparación estimada. */
export const READINESS_SCORE_WEIGHTS = {
  studyBase: 0.6,
  mocks: 0.3,
  consistency: 0.1,
} as const;

const PEDAGOGICAL_TIERS = [
  { max: 25, label: "Inicio" },
  { max: 45, label: "Construyendo base" },
  { max: 65, label: "Primeras señales positivas" },
  { max: 80, label: "Progresando bien" },
  { max: 90, label: "Preparación sólida" },
  { max: 100, label: "Muy preparado" },
] as const;

export const LOW_DATA_LABEL_CAP = "Primeras señales positivas";
export const PROVISIONAL_ESTIMATE_LABEL = "Estimación con pocos datos";

export function scoreToPedagogicalLabel(score: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  for (const tier of PEDAGOGICAL_TIERS) {
    if (clamped <= tier.max) return tier.label;
  }
  return "Muy preparado";
}

export function capPedagogicalLabel(
  label: string,
  confidence: ReadinessConfidence,
  options?: { score?: number; hasActivity?: boolean },
): string {
  const score = options?.score ?? 0;
  const hasActivity = options?.hasActivity ?? true;

  if (!hasActivity || score === 0) {
    return "Inicio";
  }

  if (confidence === "low") {
    return PROVISIONAL_ESTIMATE_LABEL;
  }

  const tierLabels = PEDAGOGICAL_TIERS.map((t) => t.label);
  const labelIndex = tierLabels.indexOf(label as (typeof tierLabels)[number]);
  if (labelIndex === -1) return label;

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
    averageMockScore: calculateAverageMockScore(subjectMocks, 6),
    mockScores: subjectMocks.map((m) => m.score),
    uniqueStudyDays: new Set(subjectSessions.map((s) => s.date)).size,
  };
}

function totalStudyMinutes(b: ReadinessBreakdown): number {
  return b.theoryMinutes + b.bankMinutes + b.reviewMinutes + b.otherSessionMinutes;
}

function sessionTypeVarietyCount(b: ReadinessBreakdown): number {
  let count = 0;
  if (b.theorySessions > 0) count += 1;
  if (b.bankSessions > 0) count += 1;
  if (b.reviewMinutes > 0) count += 1;
  if (b.otherSessionMinutes > 0) count += 1;
  return count;
}

/** Bloque 0–100: base de estudio (peso 60 % en el compuesto). */
export function studyBaseComponentScore(b: ReadinessBreakdown): number {
  const minutes = totalStudyMinutes(b);
  if (b.sessionCount === 0 && minutes === 0) return 0;

  const minutesRatio = Math.min(1, minutes / 720);
  const minutesScore =
    36 * Math.pow(minutesRatio, 0.92) +
    (minutes >= 300 ? 12 * Math.pow(Math.min(1, (minutes - 300) / 420), 0.85) : 0);
  const sessionCap = b.sessionCount >= 8 ? 22 : b.sessionCount >= 5 ? 18 : 14;
  const sessionScore = Math.min(
    sessionCap,
    Math.pow(Math.max(1, b.sessionCount), 1.2) * 4.5,
  );
  const variety = sessionTypeVarietyCount(b);
  const varietyScore = variety >= 3 ? 14 : variety === 2 ? 8 : variety === 1 ? 2 : 0;
  const crossTraining =
    b.sessionCount >= 4 && b.theorySessions >= 1 && b.bankSessions >= 1
      ? b.reviewMinutes > 0
        ? 8
        : 5
      : 0;

  return Math.min(100, minutesScore + sessionScore + varietyScore + crossTraining);
}

/** Bloque 0–100: simulacros (peso 30 %). */
export function mockComponentScore(b: ReadinessBreakdown): number {
  if (b.mockCount === 0 || b.averageMockScore === null) return 0;

  const avg = b.averageMockScore;
  let score = avg;

  const countFactor =
    b.mockCount >= 4 ? 1 : b.mockCount === 3 ? 0.92 : b.mockCount === 2 ? 0.78 : 0.58;
  score *= countFactor;

  if (b.mockScores.length >= 2) {
    const min = Math.min(...b.mockScores);
    const max = Math.max(...b.mockScores);
    const spread = max - min;
    const consistencyFactor = spread <= 8 ? 1 : spread <= 14 ? 0.88 : 0.68;
    score *= consistencyFactor;
  }

  if (avg < 70) {
    score *= 0.55 + (avg / 70) * 0.45;
  }

  return Math.min(100, Math.max(0, score));
}

/** Bloque 0–100: consistencia (peso 10 %; recencia muy suave al inicio). */
export function consistencyComponentScore(b: ReadinessBreakdown): number {
  if (b.sessionCount === 0) return 0;

  const minutes = totalStudyMinutes(b);
  const depthFactor = Math.min(1, b.sessionCount / 8);
  const dayFactor = Math.min(
    1,
    b.uniqueStudyDays / Math.max(2, Math.min(b.sessionCount, 10)),
  );
  const daySpread = 18 * dayFactor * depthFactor;
  const sessionDepth = 6 * depthFactor;

  let recency = 4;
  if (b.daysSinceLastSession !== null && b.sessionCount >= 4 && minutes >= 240) {
    if (b.daysSinceLastSession <= 14) recency = 10;
    else if (b.daysSinceLastSession <= 30) recency = 8;
    else recency = 6;
  }

  const raw = daySpread + sessionDepth + recency;
  const earlyCap = b.sessionCount <= 3 || minutes < 240 ? 32 : 72;
  return Math.min(earlyCap, raw);
}

export function applyReadinessScoreCaps(
  raw: number,
  b: ReadinessBreakdown,
  components: { studyBase: number; mocks: number; consistency: number },
): number {
  let score = raw;
  const minutes = totalStudyMinutes(b);
  const hasStudy = b.sessionCount > 0 || minutes > 0;
  const hasMocks = b.mockCount > 0;

  if (!hasStudy && !hasMocks) return 0;

  if (!hasStudy && hasMocks) {
    score = Math.min(score, 65);
  }

  if (b.sessionCount === 1) {
    score = Math.min(score, 12);
  } else if (b.sessionCount <= 3 && minutes < 360) {
    score = Math.min(score, 20);
  } else if (b.sessionCount <= 4 && minutes < 240) {
    score = Math.min(score, 28);
  }

  if (hasStudy && minutes < 180 && b.sessionCount <= 3) {
    score = Math.min(score, 22);
  }

  if (b.mockCount === 0) {
    score = Math.min(score, 72);
  } else if (b.mockCount === 1) {
    score = Math.min(score, 70);
  } else if (b.mockCount === 2) {
    score = Math.min(score, 78);
  }

  if (hasMocks && minutes < 90) {
    score = Math.min(score, 65);
  }

  if (b.mockCount === 1 && hasStudy && minutes < 240) {
    score = Math.min(score, 55);
  }

  if (b.mockCount === 1 && !hasStudy) {
    score = Math.min(score, 48);
  }

  if (score > 80) {
    const canExceed80 =
      minutes >= 300 &&
      b.sessionCount >= 4 &&
      b.mockCount >= 2 &&
      components.studyBase >= 48 &&
      components.mocks >= 58;
    if (!canExceed80) score = Math.min(score, 80);
  }

  if (score > 90) {
    const canExceed90 =
      minutes >= 540 &&
      b.sessionCount >= 6 &&
      b.mockCount >= 3 &&
      components.studyBase >= 65 &&
      components.mocks >= 75 &&
      components.consistency >= 50;
    if (!canExceed90) score = Math.min(score, 90);
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function computeReadinessConfidence(b: ReadinessBreakdown): ReadinessConfidence {
  if (b.sessionCount === 0 && b.mockCount === 0) return "low";

  let points = 0;
  const minutes = totalStudyMinutes(b);

  if (b.sessionCount >= 8) points += 2;
  else if (b.sessionCount >= 4) points += 1.5;
  else if (b.sessionCount >= 2) points += 0.5;

  if (minutes >= 600) points += 2;
  else if (minutes >= 300) points += 1;
  else if (minutes >= 120) points += 0.5;

  if (b.mockCount >= 4) points += 2.5;
  else if (b.mockCount >= 2) points += 1.5;
  else if (b.mockCount === 1) points += 0.25;

  if (sessionTypeVarietyCount(b) >= 2) points += 1;

  if (points <= 2.5) return "low";
  if (points <= 5) return "medium";
  return "high";
}

export function computeReadinessScore(
  b: ReadinessBreakdown,
  _confidence: ReadinessConfidence,
): number {
  if (b.sessionCount === 0 && b.mockCount === 0) return 0;

  const studyBase = studyBaseComponentScore(b);
  const mocks = mockComponentScore(b);
  const consistency = consistencyComponentScore(b);

  let raw =
    studyBase * READINESS_SCORE_WEIGHTS.studyBase +
    mocks * READINESS_SCORE_WEIGHTS.mocks +
    consistency * READINESS_SCORE_WEIGHTS.consistency;

  if (b.pendingErrors > 0) {
    raw -= Math.min(12, 4 + b.pendingErrors * 2);
  }
  if (b.pendingReviews > 0) {
    raw -= Math.min(6, 2 + b.pendingReviews);
  }

  return applyReadinessScoreCaps(raw, b, { studyBase, mocks, consistency });
}

export function buildReadinessMessage(
  score: number,
  pedagogicalLabel: string,
  confidence: ReadinessConfidence,
  b: ReadinessBreakdown,
): string {
  if (b.sessionCount === 0 && b.mockCount === 0) {
    return "Registra sesiones o simulacros de examen para calcular la preparación estimada.";
  }

  if (confidence === "low" || pedagogicalLabel === PROVISIONAL_ESTIMATE_LABEL) {
    return "Estimación con pocos datos. Suma teoría, banco y más simulacros para afinar el nivel.";
  }

  if (
    b.mockCount >= 1 &&
    b.latestMockScore !== null &&
    b.latestMockScore >= 75 &&
    totalStudyMinutes(b) < 300
  ) {
    return "Buen simulacro, pero la base de estudio aún es limitada para confirmar preparación alta.";
  }

  if (b.pendingErrors > 0) {
    return "Corrige errores pendientes antes de confiar solo en un simulacro aislado.";
  }

  if (pedagogicalLabel === "Inicio" || pedagogicalLabel === "Construyendo base") {
    return "Estás empezando. Alterna teoría, banco y simulacros de examen para consolidar la base.";
  }

  if (pedagogicalLabel === "Primeras señales positivas") {
    return "Hay señales alentadoras; sigue acumulando banco y simulacros consistentes.";
  }

  if (pedagogicalLabel === "Progresando bien") {
    return "Buen ritmo. Mantén variedad de sesiones y simulacros antes del examen.";
  }

  if (score >= 90) {
    return "Muy buena preparación estimada. Mantén consistencia hasta el examen.";
  }

  return "Preparación estimada según estudio registrado, simulacros y consistencia.";
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
  if (readiness.isProvisional) return false;
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
  const hasActivity = breakdown.sessionCount > 0 || breakdown.mockCount > 0;
  const rawLabel = scoreToPedagogicalLabel(score);
  const pedagogicalLabel = capPedagogicalLabel(rawLabel, confidence, {
    score,
    hasActivity,
  });
  const level = resolveInternalLevel(score, hasActivity);

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffStr = formatDateLocal(cutoff);
  const recentStudyMinutes = params.sessions
    .filter((s) => s.subjectId === params.subjectId && s.date >= cutoffStr)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const studyMinutes = totalStudyMinutes(breakdown);

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
      totalStudyMinutes: studyMinutes,
      recentStudyMinutes,
      latestMockScore: breakdown.latestMockScore,
      averageMockScore: breakdown.averageMockScore,
      mockCount: breakdown.mockCount,
      daysSinceLastSession: breakdown.daysSinceLastSession,
    },
  };
}
