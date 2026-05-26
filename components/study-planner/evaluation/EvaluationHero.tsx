"use client";

import { useMemo, useState } from "react";
import type {
  ErrorLogItem,
  ExamDate,
  MockResult,
  PlannedStudySession,
  ReviewItem,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import {
  calculateReadinessForSubjects,
  formatMockScore,
  getTodayDateString,
} from "@/lib/study-planner/calculations";
import type { EvaluationCoachRecommendation, EvaluationSummary } from "@/lib/study-planner/evaluation-page-logic";
import {
  buildEvaluationPriorityGroups,
  formatPriorityContextLine,
  getEvaluationReadinessChip,
} from "@/lib/study-planner/evaluation-presentation";
import { hasSubjectChartDataSource } from "@/lib/study-planner/subject-chart-data-sources";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";

const CHIP_CLASS = {
  ready: "bg-emerald-50/90 text-emerald-800 ring-emerald-200/45",
  refine: "bg-[#fff8e8]/90 text-[#7a5a16] ring-[#c9a454]/25",
  critical: "bg-amber-50/90 text-amber-900 ring-amber-200/50",
} as const;

type EvaluationHeroProps = {
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
  errorLogItems: ErrorLogItem[];
  reviewItems: ReviewItem[];
  examDates: ExamDate[];
  summary: EvaluationSummary;
  coach: EvaluationCoachRecommendation;
  onClearEvaluationData?: () => void;
};

export function EvaluationHero({
  subjects,
  sessions,
  mockResults,
  plannedSessions,
  errorLogItems,
  reviewItems: _reviewItems,
  examDates,
  summary,
  coach,
  onClearEvaluationData,
}: EvaluationHeroProps) {
  const today = getTodayDateString();
  const [confirmClear, setConfirmClear] = useState(false);

  const readiness = useMemo(
    () =>
      calculateReadinessForSubjects({
        subjectIds: subjects.map((s) => s.id),
        sessions,
        mockResults,
        errorLogItems,
        reviewItems: _reviewItems,
      }),
    [subjects, sessions, mockResults, errorLogItems, _reviewItems],
  );

  const avgReadiness = useMemo(() => {
    const scored = readiness.filter((r) =>
      hasSubjectChartDataSource({
        subjectId: r.subjectId,
        sessions,
        mockResults,
        plannedSessions,
        examDates,
      }),
    );
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((sum, r) => sum + r.score, 0) / scored.length);
  }, [readiness, sessions, mockResults, plannedSessions, examDates]);

  const chip = getEvaluationReadinessChip(summary);

  const priorityGroups = useMemo(
    () =>
      buildEvaluationPriorityGroups({
        subjects,
        readiness,
        sessions,
        mockResults,
        errorLogItems,
        examDates,
        plannedSessions,
        today,
      }),
    [subjects, readiness, sessions, mockResults, errorLogItems, examDates, plannedSessions, today],
  );

  const contextLine = summary.hasMeaningfulStudyData
    ? formatPriorityContextLine(priorityGroups, true) ?? coach.message
    : "Sin datos suficientes todavía. Registra sesiones en bitácora o simulacros para ver un diagnóstico fiable.";

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    onClearEvaluationData?.();
    setConfirmClear(false);
  };

  if (!summary.hasEnoughData) {
    return (
      <section className="rounded-xl bg-gradient-to-br from-[#fff9ee]/80 via-white to-white px-4 py-3.5 ring-1 ring-[#c9a454]/15">
        <p className="text-[12px] font-medium text-[#7a5a16]">Preparación general</p>
        <p className="mt-1 text-[14px] font-medium text-[#0f1a33]">
          Sin datos suficientes todavía
        </p>
        <p className="mt-1 text-[13px] text-slate-600">
          Registra un simulacro o sesiones en bitácora para ver preparación, riesgos y prioridades.
        </p>
        <p className="mt-2 text-[12px] leading-snug text-slate-500">{summary.dataSourceLine}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-gradient-to-br from-[#0f1a33]/[0.03] via-[#fffdf8] to-white px-4 py-3 ring-1 ring-[#c9a454]/15">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
            Preparación general
          </p>
          <p className="mt-0.5 flex items-baseline gap-1 tabular-nums">
            <span className="text-[32px] font-semibold leading-none text-[#0f1a33]">
              {summary.hasMeaningfulStudyData ? (avgReadiness ?? "—") : "—"}
            </span>
            {summary.hasMeaningfulStudyData && avgReadiness !== null ? (
              <span className="text-[16px] font-medium text-slate-400">%</span>
            ) : null}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1 ${CHIP_CLASS[chip.tone]}`}
        >
          {chip.label}
        </span>
      </div>

      <p className="mt-2 max-w-xl text-[13px] leading-snug text-slate-600">{contextLine}</p>

      <p className="mt-2 rounded-md bg-slate-50/80 px-2.5 py-1.5 text-[12px] leading-snug text-slate-600 ring-1 ring-slate-200/30">
        <span className="font-medium text-slate-500">Fuente de datos: </span>
        {summary.dataSourceLine.replace(/^Calculado con: /, "")}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <div className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-200/35">
          <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
            Simulacros
          </p>
          <p className="text-[12px] font-semibold tabular-nums text-[#0f1a33]">
            {summary.mockCount > 0 && summary.avgMockScore !== null
              ? formatMockScore(summary.avgMockScore)
              : "Sin datos"}
            <span className="ml-1 font-normal text-slate-500">media</span>
          </p>
        </div>
        <div className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-200/35">
          <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
            En riesgo
          </p>
          <p className="text-[12px] font-semibold tabular-nums text-[#0f1a33]">
            {summary.atRiskCount}
            <span className="ml-0.5 font-normal text-slate-500">asig.</span>
          </p>
        </div>
        <div className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-200/35">
          <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
            Repasos pend.
          </p>
          <p className="text-[12px] font-semibold tabular-nums text-[#0f1a33]">
            {summary.pendingReviews}
          </p>
        </div>
      </div>

      {onClearEvaluationData ? (
        <div className="mt-3 border-t border-slate-100/80 pt-2.5">
          <button
            type="button"
            onClick={handleClear}
            className={`${plannerBtnGhost} text-[12px] text-slate-500 hover:text-[#7a2e2e]`}
          >
            {confirmClear ? "Confirmar: limpiar bitácora y simulacros" : "Limpiar datos de evaluación"}
          </button>
          {confirmClear ? (
            <p className="mt-1 text-[11px] text-slate-500">
              Se borrarán sesiones de bitácora, simulacros, repasos y errores. El calendario y las
              fechas de examen no se modifican.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
