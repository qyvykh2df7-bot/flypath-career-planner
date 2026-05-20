"use client";

import { useMemo } from "react";
import type {
  ErrorLogItem,
  ExamDate,
  MockResult,
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

const CHIP_CLASS = {
  ready: "bg-emerald-50/90 text-emerald-800 ring-emerald-200/45",
  refine: "bg-[#fff8e8]/90 text-[#7a5a16] ring-[#c9a454]/25",
  critical: "bg-amber-50/90 text-amber-900 ring-amber-200/50",
} as const;

type EvaluationHeroProps = {
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems: ErrorLogItem[];
  reviewItems: ReviewItem[];
  examDates: ExamDate[];
  summary: EvaluationSummary;
  coach: EvaluationCoachRecommendation;
};

export function EvaluationHero({
  subjects,
  sessions,
  mockResults,
  errorLogItems,
  reviewItems: _reviewItems,
  examDates,
  summary,
  coach,
}: EvaluationHeroProps) {
  const today = getTodayDateString();

  const readiness = useMemo(
    () =>
      calculateReadinessForSubjects({
        subjectIds: subjects.map((s) => s.id),
        sessions,
        mockResults,
      }),
    [subjects, sessions, mockResults],
  );

  const avgReadiness = useMemo(() => {
    const withData = readiness.filter((r) => r.level !== "no_data");
    if (withData.length === 0) return null;
    return Math.round(withData.reduce((sum, r) => sum + r.score, 0) / withData.length);
  }, [readiness]);

  const chip = getEvaluationReadinessChip(summary);

  const priorityGroups = useMemo(
    () =>
      buildEvaluationPriorityGroups({
        subjects,
        readiness,
        mockResults,
        errorLogItems,
        examDates,
        today,
      }),
    [subjects, readiness, mockResults, errorLogItems, examDates, today],
  );

  const contextLine =
    formatPriorityContextLine(priorityGroups) ?? coach.message;

  if (!summary.hasEnoughData) {
    return (
      <section className="rounded-xl bg-gradient-to-br from-[#fff9ee]/80 via-white to-white px-4 py-3.5 ring-1 ring-[#c9a454]/15">
        <p className="text-[11px] font-medium text-[#7a5a16]">Centro de control ATPL</p>
        <p className="mt-1 text-[14px] font-medium text-[#0f1a33]">
          Empieza con un simulacro para detectar puntos débiles
        </p>
        <p className="mt-1 text-[12px] text-slate-600">
          Registra resultados y errores para ver preparación, riesgos y prioridades.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-gradient-to-br from-[#0f1a33]/[0.03] via-[#fffdf8] to-white px-4 py-3 ring-1 ring-[#c9a454]/15">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Preparación general
          </p>
          <p className="mt-0.5 flex items-baseline gap-1 tabular-nums">
            <span className="text-[32px] font-semibold leading-none text-[#0f1a33]">
              {avgReadiness ?? "—"}
            </span>
            {avgReadiness !== null ? (
              <span className="text-[16px] font-medium text-slate-400">%</span>
            ) : null}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${CHIP_CLASS[chip.tone]}`}
        >
          {chip.label}
        </span>
      </div>

      <p className="mt-2 max-w-xl text-[12px] leading-snug text-slate-600">{contextLine}</p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <div className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-200/35">
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
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
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
            En riesgo
          </p>
          <p className="text-[12px] font-semibold tabular-nums text-[#0f1a33]">
            {summary.atRiskCount}
            <span className="ml-0.5 font-normal text-slate-500">asig.</span>
          </p>
        </div>
        <div className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-200/35">
          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
            Pendientes
          </p>
          <p className="text-[12px] font-semibold tabular-nums text-[#0f1a33]">
            {summary.pendingErrors}
            <span className="font-normal text-slate-500"> err. · </span>
            {summary.pendingReviews}
            <span className="font-normal text-slate-500"> rep.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
