"use client";

import type { ErrorLogItem, MockResult, StudyMode, StudySession, StudySubject } from "@/lib/study-planner/types";
import {
  calculatePendingErrorsForSubject,
  calculateReadinessForSubjects,
  getReadinessSummary,
  sortReadinessForDisplay,
} from "@/lib/study-planner/calculations";
import { SubjectReadinessCard } from "./SubjectReadinessCard";

type SubjectReadinessOverviewProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems?: ErrorLogItem[];
};

export function SubjectReadinessOverview({
  mode,
  subjects,
  sessions,
  mockResults,
  errorLogItems = [],
}: SubjectReadinessOverviewProps) {
  const readinessList = sortReadinessForDisplay(
    calculateReadinessForSubjects({
      subjectIds: subjects.map((s) => s.id),
      sessions,
      mockResults,
    }),
  );
  const summary = getReadinessSummary(readinessList);
  const hasAnyData = summary.withDataCount > 0;

  if (!hasAnyData) {
    return (
      <section className="space-y-4">
        <div>
          <h4 className="text-[15px] font-semibold text-[#0f1a33]">Readiness por asignatura</h4>
          <p className="mt-1 text-[14px] leading-relaxed text-slate-600">
            Una estimación orientativa basada en horas registradas, estudio reciente y mocks. No sustituye tu
            criterio ni el de tu instructor.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
          <p className="text-[15px] font-medium text-slate-700">
            Registra horas de estudio o mocks para empezar a calcular tu readiness.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-[15px] font-semibold text-[#0f1a33]">Readiness por asignatura</h4>
        <p className="mt-1 text-[14px] leading-relaxed text-slate-600">
          Una estimación orientativa basada en horas registradas, estudio reciente y mocks. No sustituye tu criterio
          ni el de tu instructor.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200/90 bg-[#fffdf8] px-4 py-3 ring-1 ring-[#c9a454]/15 sm:px-5">
        <p className="text-[14px] text-slate-700">
          <span className="font-semibold text-[#0f1a33]">Resumen ({mode.toUpperCase()}):</span>{" "}
          {summary.averageScore !== null ? (
            <>Readiness medio orientativo: {summary.averageScore}/100 · </>
          ) : null}
          Sólidas: {summary.solidCount} · Riesgo alto: {summary.lowCount} · Ajustadas: {summary.mediumCount} · Sin
          datos: {summary.noDataCount}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {readinessList.map((readiness) => {
          const subject = subjects.find((s) => s.id === readiness.subjectId);
          if (!subject) return null;
          return (
            <SubjectReadinessCard
              key={readiness.subjectId}
              subject={subject}
              readiness={readiness}
              pendingErrorsCount={calculatePendingErrorsForSubject(errorLogItems, readiness.subjectId)}
            />
          );
        })}
      </div>
    </section>
  );
}
