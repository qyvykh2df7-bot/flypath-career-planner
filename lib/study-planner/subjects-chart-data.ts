import type { MockResult, PlannedStudySession, StudySession } from "./types";
import {
  formatDaysRemaining,
  getDaysSinceDate,
  getDaysUntilDate,
  getLatestSessionDateForSubject,
  getTodayDateString,
} from "./calculations";
import type { ExamDate, InitialSubjectState, SubjectReadiness } from "./types";
import {
  getInitialStateForSubject,
  isSubjectDeclaredPassed,
} from "./initial-subject-state";
import {
  formatSubjectChartDataSourceLine,
  hasSubjectChartDataSource,
} from "./subject-chart-data-sources";
import { getSubjectById } from "./subjects";
import {
  getExamForSubject,
  getSubjectDisplayLabel,
  resolveSubjectDisplayStatus,
  type SubjectDisplayStatus,
} from "./subjects-page-logic";

export const SUBJECT_CHART_BAR_COLORS = [
  "#3b6ea8",
  "#c9a454",
  "#2d8a6b",
  "#8b6bb8",
  "#d4923a",
  "#5b8fc9",
  "#7a5a16",
  "#4a9b7f",
  "#a67bc4",
  "#e07b54",
  "#6b8cae",
  "#9a7a2e",
  "#3d9a86",
  "#b088c8",
] as const;

export type SubjectChartItem = {
  subjectId: string;
  name: string;
  shortLabel: string;
  percent: number;
  color: string;
  tooltipTitle: string;
  tooltipLines: string[];
};

export function abbreviateSubjectName(name: string, maxLen = 10): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words.map((word) => word[0]?.toUpperCase() ?? "").join("");
    if (initials.length >= 2 && initials.length <= maxLen) return initials;
  }

  return `${trimmed.slice(0, Math.max(1, maxLen - 1))}…`;
}

export function resolveSubjectChartDisplayStatus(
  readiness: SubjectReadiness,
  examDates: ExamDate[],
  pendingErrorsCount: number,
  today: string,
  initialState: InitialSubjectState | null,
  hasChartData: boolean,
): SubjectDisplayStatus {
  if (isSubjectDeclaredPassed(readiness.subjectId, initialState ? [initialState] : [])) {
    return "passed";
  }
  if (!hasChartData) return "no_data";
  return resolveSubjectDisplayStatus(
    readiness,
    examDates,
    pendingErrorsCount,
    today,
    initialState,
  );
}

export function resolveSubjectChartPercent(
  readiness: SubjectReadiness,
  displayStatus: SubjectDisplayStatus,
  hasChartData: boolean,
): number {
  if (!hasChartData || displayStatus === "no_data") return 0;
  if (displayStatus === "passed") return 100;
  return Math.min(100, Math.max(0, Math.round(readiness.score)));
}

function formatLastSessionTooltipLine(
  sessions: StudySession[],
  subjectId: string,
): string | null {
  const last = getLatestSessionDateForSubject(sessions, subjectId);
  if (!last) return null;
  const days = getDaysSinceDate(last);
  if (days === 0) return "Última sesión: hoy";
  if (days === 1) return "Última sesión: hace 1 día";
  return `Última sesión: hace ${days} días`;
}

export function buildSubjectChartTooltipLines(params: {
  subjectName: string;
  percent: number;
  statusLabel: string;
  displayStatus: SubjectDisplayStatus;
  readiness: SubjectReadiness;
  lastSessionLine: string | null;
  examLine: string | null;
  dataSourceLine: string | null;
}): string[] {
  const {
    subjectName,
    percent,
    statusLabel,
    displayStatus,
    readiness,
    lastSessionLine,
    examLine,
    dataSourceLine,
  } = params;

  if (displayStatus === "no_data") {
    const lines = [subjectName, "Sin datos de preparación", statusLabel];
    if (examLine) lines.push(examLine);
    lines.push("Registra sesiones en bitácora o simulacros para estimar el nivel.");
    return lines;
  }

  const lines = [subjectName, `${percent}% de preparación estimada`, statusLabel];
  if (dataSourceLine) lines.push(`Fuente: ${dataSourceLine}`);
  if (lastSessionLine) lines.push(lastSessionLine);
  if (examLine) lines.push(examLine);
  if (readiness.isProvisional) lines.push("Dato provisional");
  else if (readiness.message.trim()) lines.push(readiness.message.trim());
  return lines;
}

export function buildSubjectChartItems(params: {
  readinessList: SubjectReadiness[];
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
  examDates: ExamDate[];
  pendingErrorsBySubject: Record<string, number>;
  initialSubjectStates?: InitialSubjectState[];
  today?: string;
}): SubjectChartItem[] {
  const today = params.today ?? getTodayDateString();

  return params.readinessList.map((readiness, index) => {
    const subject = getSubjectById(readiness.subjectId);
    const name = subject?.name ?? readiness.subjectId;
    const pending = params.pendingErrorsBySubject?.[readiness.subjectId] ?? 0;
    const initial = getInitialStateForSubject(
      readiness.subjectId,
      params.initialSubjectStates,
    );
    const hasChartData = hasSubjectChartDataSource({
      subjectId: readiness.subjectId,
      sessions: params.sessions,
      mockResults: params.mockResults,
      plannedSessions: params.plannedSessions,
      examDates: params.examDates,
      initialSubjectStates: params.initialSubjectStates,
    });
    const displayStatus = resolveSubjectChartDisplayStatus(
      readiness,
      params.examDates,
      pending,
      today,
      initial,
      hasChartData,
    );
    const statusLabel =
      displayStatus === "no_data"
        ? "Sin datos"
        : getSubjectDisplayLabel(displayStatus, readiness, initial);
    const percent = resolveSubjectChartPercent(readiness, displayStatus, hasChartData);

    const exam = getExamForSubject(readiness.subjectId, params.examDates, today);
    const examLine = exam
      ? `Examen ${formatDaysRemaining(getDaysUntilDate(exam.date, today))}`
      : null;

    const tooltipLines = buildSubjectChartTooltipLines({
      subjectName: name,
      percent,
      statusLabel,
      displayStatus,
      readiness,
      lastSessionLine: formatLastSessionTooltipLine(params.sessions, readiness.subjectId),
      examLine,
      dataSourceLine: hasChartData
        ? formatSubjectChartDataSourceLine({
            subjectId: readiness.subjectId,
            sessions: params.sessions,
            mockResults: params.mockResults,
            plannedSessions: params.plannedSessions,
          })
        : null,
    });

    return {
      subjectId: readiness.subjectId,
      name,
      shortLabel: abbreviateSubjectName(name),
      percent,
      color: SUBJECT_CHART_BAR_COLORS[index % SUBJECT_CHART_BAR_COLORS.length]!,
      tooltipTitle: name,
      tooltipLines,
    };
  });
}
