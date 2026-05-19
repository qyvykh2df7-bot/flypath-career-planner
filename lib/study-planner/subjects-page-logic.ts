import type { ExamDate, SubjectReadiness } from "./types";
import { getDaysUntilDate, getNextUpcomingExam, getTodayDateString } from "./calculations";
import { getSubjectById } from "./subjects";

export type SubjectDisplayStatus = "no_data" | "in_progress" | "at_risk" | "prepared";

export type SubjectFilterId = "all" | "at_risk" | "in_progress" | "no_data" | "with_exam";

export const SUBJECT_DISPLAY_STATUS_LABELS: Record<SubjectDisplayStatus, string> = {
  no_data: "Sin datos",
  in_progress: "En progreso",
  at_risk: "En riesgo",
  prepared: "Preparada",
};

export const SUBJECT_FILTER_LABELS: Record<SubjectFilterId, string> = {
  all: "Todas",
  at_risk: "En riesgo",
  in_progress: "En progreso",
  no_data: "Sin datos",
  with_exam: "Con examen",
};

const MOCK_RISK_THRESHOLD = 70;
const IDLE_DAYS_RISK = 21;
const INITIAL_BASE_SCORE_MAX = 39;

/** Asignatura con actividad registrada (sesiones, mocks o progreso > 0). */
export function isSubjectInCourse(readiness: SubjectReadiness): boolean {
  const { factors, score, level } = readiness;
  if (factors.totalStudyMinutes > 0) return true;
  if (factors.mockCount > 0) return true;
  if (factors.daysSinceLastSession !== null) return true;
  if (score > 0) return true;
  return level !== "no_data";
}

export function hasRealRiskSignals(
  readiness: SubjectReadiness,
  exam: ExamDate | null,
  pendingErrorsCount: number,
  today: string = getTodayDateString(),
): boolean {
  if (!isSubjectInCourse(readiness)) return false;

  const { factors, score } = readiness;

  if (pendingErrorsCount > 0) return true;

  if (factors.mockCount > 0) {
    if (factors.latestMockScore !== null && factors.latestMockScore < MOCK_RISK_THRESHOLD) {
      return true;
    }
    if (factors.averageMockScore !== null && factors.averageMockScore < MOCK_RISK_THRESHOLD) {
      return true;
    }
  }

  if (
    factors.daysSinceLastSession !== null &&
    factors.daysSinceLastSession >= IDLE_DAYS_RISK &&
    factors.totalStudyMinutes > 0
  ) {
    return true;
  }

  if (exam) {
    const daysUntil = getDaysUntilDate(exam.date, today);
    if (daysUntil <= 7 && score < 80) return true;
    if (daysUntil <= 14 && score < 65) return true;
    if (daysUntil <= 30 && score < 50) return true;
    if (daysUntil <= 45 && score < 40) return true;
  }

  // Progreso bajo sostenido (no confundir con arranque reciente).
  if (
    readiness.level === "low" &&
    score <= 39 &&
    factors.totalStudyMinutes >= 360 &&
    (factors.daysSinceLastSession ?? 0) <= 14
  ) {
    return true;
  }

  if (
    readiness.level === "low" &&
    factors.totalStudyMinutes >= 600 &&
    (factors.daysSinceLastSession ?? 0) > 14
  ) {
    return true;
  }

  return false;
}

export function resolveSubjectDisplayStatus(
  readiness: SubjectReadiness,
  examDates: ExamDate[],
  pendingErrorsCount: number,
  today: string = getTodayDateString(),
): SubjectDisplayStatus {
  if (!isSubjectInCourse(readiness)) return "no_data";

  if (readiness.level === "high" || readiness.level === "solid") return "prepared";

  const exam = getExamForSubject(readiness.subjectId, examDates, today);
  if (hasRealRiskSignals(readiness, exam, pendingErrorsCount, today)) {
    return "at_risk";
  }

  return "in_progress";
}

/** Etiqueta visible en badge (p. ej. “Base inicial” para arranque reciente). */
export function getSubjectDisplayLabel(
  status: SubjectDisplayStatus,
  readiness: SubjectReadiness,
): string {
  if (
    status === "in_progress" &&
    readiness.score <= INITIAL_BASE_SCORE_MAX &&
    readiness.factors.totalStudyMinutes < 360
  ) {
    return "Base inicial";
  }
  return SUBJECT_DISPLAY_STATUS_LABELS[status];
}

/** @deprecated Usar resolveSubjectDisplayStatus */
export function mapReadinessToDisplayStatus(level: SubjectReadiness["level"]): SubjectDisplayStatus {
  switch (level) {
    case "no_data":
      return "no_data";
    case "low":
      return "at_risk";
    case "medium":
      return "in_progress";
    case "high":
    case "solid":
      return "prepared";
  }
}

export function subjectHasExamDate(subjectId: string, examDates: ExamDate[]): boolean {
  return examDates.some((e) => e.subjectId === subjectId);
}

export function getExamForSubject(
  subjectId: string,
  examDates: ExamDate[],
  today: string = getTodayDateString(),
): ExamDate | null {
  const upcoming = examDates
    .filter((e) => e.subjectId === subjectId && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? null;
}

export type SubjectDisplayContext = {
  examDates: ExamDate[];
  pendingErrorsBySubject: Record<string, number>;
  today?: string;
};

export function resolveDisplayStatusWithContext(
  readiness: SubjectReadiness,
  ctx: SubjectDisplayContext,
): SubjectDisplayStatus {
  const today = ctx.today ?? getTodayDateString();
  const pending = ctx.pendingErrorsBySubject[readiness.subjectId] ?? 0;
  return resolveSubjectDisplayStatus(readiness, ctx.examDates, pending, today);
}

export function filterReadinessByChip(
  readinessList: SubjectReadiness[],
  filter: SubjectFilterId,
  examDates: ExamDate[],
  pendingErrorsBySubject: Record<string, number> = {},
  today: string = getTodayDateString(),
): SubjectReadiness[] {
  if (filter === "all") return readinessList;

  return readinessList.filter((r) => {
    const status = resolveSubjectDisplayStatus(
      r,
      examDates,
      pendingErrorsBySubject[r.subjectId] ?? 0,
      today,
    );
    if (filter === "at_risk") return status === "at_risk";
    if (filter === "in_progress") return status === "in_progress";
    if (filter === "no_data") return status === "no_data";
    if (filter === "with_exam") return subjectHasExamDate(r.subjectId, examDates);
    return true;
  });
}

export type SubjectsPageSummary = {
  activeCount: number;
  inProgressCount: number;
  atRiskCount: number;
  noDataCount: number;
  nextExamLine: string | null;
};

export function buildSubjectsPageSummary(
  readinessList: SubjectReadiness[],
  examDates: ExamDate[],
  pendingErrorsBySubject: Record<string, number> = {},
  today: string = getTodayDateString(),
): SubjectsPageSummary {
  let inProgressCount = 0;
  let atRiskCount = 0;
  let noDataCount = 0;

  for (const r of readinessList) {
    const pending = pendingErrorsBySubject[r.subjectId] ?? 0;
    const status = resolveSubjectDisplayStatus(r, examDates, pending, today);

    if (isSubjectInCourse(r)) inProgressCount += 1;
    if (status === "at_risk") atRiskCount += 1;
    if (status === "no_data") noDataCount += 1;
  }

  const next = getNextUpcomingExam(examDates, today);
  let nextExamLine: string | null = null;
  if (next) {
    const name = getSubjectById(next.subjectId)?.name ?? next.subjectId;
    const days = getDaysUntilDate(next.date, today);
    const daysLabel = days === 1 ? "1 día" : `${days} días`;
    nextExamLine = `${name} en ${daysLabel}`;
  }

  return {
    activeCount: readinessList.length,
    inProgressCount,
    atRiskCount,
    noDataCount,
    nextExamLine,
  };
}

export type NextExamHighlight = {
  subjectName: string;
  daysLabel: string;
};

export function formatNextExamHighlight(
  examDates: ExamDate[],
  today: string = getTodayDateString(),
): NextExamHighlight | null {
  const next = getNextUpcomingExam(examDates, today);
  if (!next) return null;

  const subjectName = getSubjectById(next.subjectId)?.name ?? next.subjectId;
  const days = getDaysUntilDate(next.date, today);
  const daysLabel =
    days === 0 ? "hoy" : days === 1 ? "en 1 día" : `en ${days} días`;

  return { subjectName, daysLabel };
}

export function formatSubjectsSummaryLine(summary: SubjectsPageSummary): string {
  const parts = [
    `${summary.activeCount} activa${summary.activeCount === 1 ? "" : "s"}`,
    `${summary.inProgressCount} en curso`,
    `${summary.atRiskCount} en riesgo`,
    `${summary.noDataCount} sin datos`,
  ];
  if (summary.nextExamLine) {
    parts.push(`Próximo examen: ${summary.nextExamLine}`);
  }
  return parts.join(" · ");
}

export function displayStatusStyles(status: SubjectDisplayStatus): string {
  switch (status) {
    case "no_data":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "in_progress":
      return "border-[#c9a454]/35 bg-[#fff8e8] text-[#7a5a16]";
    case "at_risk":
      return "border-amber-200/80 bg-amber-50 text-amber-900";
    case "prepared":
      return "border-emerald-200/70 bg-emerald-50 text-emerald-800";
  }
}
