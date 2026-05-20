import type { ExamDate, InitialSubjectState, SubjectReadiness } from "./types";
import { qualifiesAsPrepared } from "./subject-readiness";
import {
  DECLARED_STAGE_OPTIONS,
  getInitialStateForSubject,
  hasRealStudyDataFromReadiness,
} from "./initial-subject-state";
import { getDaysUntilDate, getNextUpcomingExam, getTodayDateString } from "./calculations";
import { getSubjectById } from "./subjects";

export type SubjectDisplayStatus =
  | "no_data"
  | "in_progress"
  | "at_risk"
  | "prepared"
  | "passed";

export type SubjectFilterId = "all" | "at_risk" | "in_progress" | "no_data" | "with_exam";

export const SUBJECT_DISPLAY_STATUS_LABELS: Record<SubjectDisplayStatus, string> = {
  no_data: "Sin datos",
  in_progress: "En progreso",
  at_risk: "En riesgo",
  prepared: "Preparada",
  passed: "Aprobada",
};

function declaredStageToDisplayStatus(
  stage: InitialSubjectState["declaredStage"],
): SubjectDisplayStatus {
  switch (stage) {
    case "not_started":
      return "no_data";
    case "base_initial":
    case "in_progress":
      return "in_progress";
    case "mostly_bank":
    case "exam_prep":
      return "in_progress";
    case "passed":
      return "passed";
  }
}

export function getDeclaredStageLabel(stage: InitialSubjectState["declaredStage"]): string {
  return DECLARED_STAGE_OPTIONS.find((o) => o.value === stage)?.label ?? stage;
}

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
  initialState?: InitialSubjectState | null,
): SubjectDisplayStatus {
  const hasReal = hasRealStudyDataFromReadiness(readiness);

  if (!hasReal && initialState) {
    if (initialState.declaredStage === "passed") return "passed";
    if (initialState.declaredStage !== "not_started") {
      return declaredStageToDisplayStatus(initialState.declaredStage);
    }
  }

  if (!isSubjectInCourse(readiness)) return "no_data";

  const exam = getExamForSubject(readiness.subjectId, examDates, today);
  if (hasRealRiskSignals(readiness, exam, pendingErrorsCount, today)) {
    return "at_risk";
  }

  if (qualifiesAsPrepared(readiness)) return "prepared";

  return "in_progress";
}

/** Etiqueta visible en badge (p. ej. “Base inicial” para arranque reciente). */
export function getSubjectDisplayLabel(
  status: SubjectDisplayStatus,
  readiness: SubjectReadiness,
  initialState?: InitialSubjectState | null,
): string {
  if (status === "passed") return "Aprobada";

  if (
    !hasRealStudyDataFromReadiness(readiness) &&
    initialState &&
    initialState.declaredStage !== "not_started"
  ) {
    return getDeclaredStageLabel(initialState.declaredStage);
  }

  if (status === "at_risk") return SUBJECT_DISPLAY_STATUS_LABELS.at_risk;

  if (hasRealStudyDataFromReadiness(readiness)) {
    return readiness.pedagogicalLabel;
  }

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
  initialSubjectStates?: InitialSubjectState[];
  today?: string;
};

export function resolveDisplayStatusWithContext(
  readiness: SubjectReadiness,
  ctx: SubjectDisplayContext,
): SubjectDisplayStatus {
  const today = ctx.today ?? getTodayDateString();
  const pending = ctx.pendingErrorsBySubject[readiness.subjectId] ?? 0;
  const initial = getInitialStateForSubject(
    readiness.subjectId,
    ctx.initialSubjectStates,
  );
  return resolveSubjectDisplayStatus(
    readiness,
    ctx.examDates,
    pending,
    today,
    initial,
  );
}

export function filterReadinessByChip(
  readinessList: SubjectReadiness[],
  filter: SubjectFilterId,
  examDates: ExamDate[],
  pendingErrorsBySubject: Record<string, number> = {},
  today: string = getTodayDateString(),
  initialSubjectStates?: InitialSubjectState[],
): SubjectReadiness[] {
  if (filter === "all") return readinessList;

  return readinessList.filter((r) => {
    const initial = getInitialStateForSubject(r.subjectId, initialSubjectStates);
    const status = resolveSubjectDisplayStatus(
      r,
      examDates,
      pendingErrorsBySubject[r.subjectId] ?? 0,
      today,
      initial,
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
  initialSubjectStates?: InitialSubjectState[],
): SubjectsPageSummary {
  let inProgressCount = 0;
  let atRiskCount = 0;
  let noDataCount = 0;

  for (const r of readinessList) {
    const pending = pendingErrorsBySubject[r.subjectId] ?? 0;
    const initial = getInitialStateForSubject(r.subjectId, initialSubjectStates);
    const status = resolveSubjectDisplayStatus(
      r,
      examDates,
      pending,
      today,
      initial,
    );

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
      return "bg-slate-100/80 text-slate-500 ring-slate-200/50";
    case "in_progress":
      return "bg-[#fff8e8]/90 text-[#7a5a16] ring-[#c9a454]/20";
    case "at_risk":
      return "bg-amber-50/90 text-amber-800 ring-amber-200/45";
    case "prepared":
      return "bg-emerald-50/90 text-emerald-800 ring-emerald-200/40";
    case "passed":
      return "bg-sky-50/90 text-sky-800 ring-sky-200/40";
  }
}

/** Etiqueta corta en cards (presentación; no altera resolveSubjectDisplayStatus). */
export function subjectCardBadgeLabel(
  status: SubjectDisplayStatus,
  displayLabel: string,
): string {
  if (status === "no_data") return "Por empezar";
  return displayLabel;
}

/** Badge más discreto en cards sin datos. */
export function subjectNoDataBadgeClass(): string {
  return "bg-transparent text-slate-400 ring-0";
}
