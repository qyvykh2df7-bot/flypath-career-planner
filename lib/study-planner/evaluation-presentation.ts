import type {
  ErrorLogItem,
  ExamDate,
  MockResult,
  SubjectReadiness,
  StudySubject,
} from "./types";
import {
  formatDaysRemaining,
  getDaysUntilDate,
  getLatestMockForSubject,
  getMockTrend,
  getMocksBySubject,
  getTodayDateString,
} from "./calculations";
import { getSubjectById } from "./subjects";
import {
  formatSubjectMockTrendLabel,
  type EvaluationSummary,
} from "./evaluation-page-logic";
import {
  getExamForSubject,
  resolveSubjectDisplayStatus,
} from "./subjects-page-logic";

export type EvaluationReadinessChip = {
  label: string;
  tone: "ready" | "refine" | "critical";
};

export type PriorityItem = {
  subjectId: string;
  title: string;
  detail: string;
};

export type EvaluationPriorityGroups = {
  immediate: PriorityItem[];
  improving: PriorityItem[];
  performing: PriorityItem[];
};

const MOCK_PASS_DISPLAY = 75;

/** Presentación: chip de estado global (no altera readiness). */
export function getEvaluationReadinessChip(summary: EvaluationSummary): EvaluationReadinessChip {
  if (summary.atRiskCount >= 2) {
    return { label: "Semana crítica", tone: "critical" };
  }
  if (summary.atRiskCount > 0 || (summary.avgMockScore !== null && summary.avgMockScore < 70)) {
    return { label: "Necesita refuerzo", tone: "refine" };
  }
  return { label: "Listo para seguir", tone: "ready" };
}

export function mockPassesDisplay(score: number): boolean {
  return score >= MOCK_PASS_DISPLAY;
}

export function buildEvaluationPriorityGroups(params: {
  subjects: StudySubject[];
  readiness: SubjectReadiness[];
  mockResults: MockResult[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  today?: string;
}): EvaluationPriorityGroups {
  const today = params.today ?? getTodayDateString();
  const immediate: PriorityItem[] = [];
  const improving: PriorityItem[] = [];
  const performing: PriorityItem[] = [];
  const bySubject = getMocksBySubject(params.mockResults);

  for (const r of params.readiness) {
    const name = getSubjectById(r.subjectId)?.name ?? r.subjectId;
    const pendingErrors = params.errorLogItems.filter(
      (e) => e.subjectId === r.subjectId && e.status === "pending",
    ).length;
    const exam = getExamForSubject(r.subjectId, params.examDates, today);
    const status = resolveSubjectDisplayStatus(r, params.examDates, pendingErrors, today);
    const mocks = bySubject[r.subjectId] ?? [];
    const latest = getLatestMockForSubject(params.mockResults, r.subjectId);
    const trend = getMockTrend(mocks);
    const trendLabel = formatSubjectMockTrendLabel(mocks.length, trend);

    if (status === "at_risk") {
      const examBit = exam
        ? ` · examen ${formatDaysRemaining(getDaysUntilDate(exam.date, today))}`
        : "";
      immediate.push({
        subjectId: r.subjectId,
        title: name,
        detail: `Preparación ${r.score}%${examBit}`.replace(/^ · /, ""),
      });
      continue;
    }

    if (status === "prepared" || (latest && latest.score >= MOCK_PASS_DISPLAY && r.score >= 70)) {
      performing.push({
        subjectId: r.subjectId,
        title: name,
        detail: latest
          ? `Último simulacro ${Math.round(latest.score)}% · preparación ${r.score}%`
          : `Preparación ${r.score}% estable`,
      });
      continue;
    }

    if (status === "in_progress" || status === "no_data") {
      if (latest && latest.score < MOCK_PASS_DISPLAY) {
        improving.push({
          subjectId: r.subjectId,
          title: name,
          detail: trendLabel
            ? `${trendLabel} · último ${Math.round(latest.score)}%`
            : `Último simulacro ${Math.round(latest.score)}% · reforzar`,
        });
      } else if (trend === "up" && latest) {
        improving.push({
          subjectId: r.subjectId,
          title: name,
          detail: `Subiendo · último ${Math.round(latest.score)}%`,
        });
      } else if (status === "in_progress" && r.score >= 40) {
        improving.push({
          subjectId: r.subjectId,
          title: name,
          detail: `Preparación ${r.score}% · sigue practicando`,
        });
      }
    }
  }

  const cap = (items: PriorityItem[]) => items.slice(0, 4);

  return {
    immediate: cap(immediate),
    improving: cap(improving),
    performing: cap(performing),
  };
}

export function formatPriorityContextLine(groups: EvaluationPriorityGroups): string | null {
  const names = groups.immediate.map((i) => i.title);
  if (names.length >= 2) {
    return `${names[0]} y ${names[1]} necesitan más consistencia.`;
  }
  if (names.length === 1) {
    return `${names[0]} necesita más consistencia antes del examen.`;
  }
  if (groups.improving.length > 0 && groups.performing.length === 0) {
    return "Varias asignaturas mejoran; mantén el ritmo de simulacros.";
  }
  if (groups.performing.length > 0) {
    return "Buen equilibrio general; refuerza lo que aún está en progreso.";
  }
  return null;
}
