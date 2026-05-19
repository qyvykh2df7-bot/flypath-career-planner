"use client";

import { useMemo, useState } from "react";
import type {
  ErrorLogItem,
  ExamDate,
  InitialSubjectState,
  MockResult,
  PlannedStudySession,
  ReviewItem,
  StudySession,
  StudySubject,
} from "@/lib/study-planner/types";
import { formatMockScore } from "@/lib/study-planner/calculations";
import { getInitialStateForSubject } from "@/lib/study-planner/initial-subject-state";
import {
  calculatePendingErrorsForSubject,
  calculateReadinessForSubjects,
  getDaysSinceDate,
  getLatestSessionDateForSubject,
  getTodayDateString,
  sortReadinessForDisplay,
} from "@/lib/study-planner/calculations";
import {
  buildSubjectsPageSummary,
  displayStatusStyles,
  filterReadinessByChip,
  formatSubjectsSummaryLine,
  getExamForSubject,
  getSubjectDisplayLabel,
  resolveSubjectDisplayStatus,
  SUBJECT_FILTER_LABELS,
  type SubjectFilterId,
  type SubjectDisplayStatus,
} from "@/lib/study-planner/subjects-page-logic";
import { formatDaysRemaining, getDaysUntilDate } from "@/lib/study-planner/calculations";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { ExamDatesPanel } from "./ExamDatesPanel";
import { SubjectDetailDrawer } from "./SubjectDetailDrawer";

type SubjectsPageProps = {
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems: ErrorLogItem[];
  reviewItems?: ReviewItem[];
  examDates: ExamDate[];
  plannedSessions: PlannedStudySession[];
  initialSubjectStates?: InitialSubjectState[];
  onAddExamDate: (exam: ExamDate) => void;
  onDeleteExamDate: (id: string) => void;
  examDatesFormRequestKey?: number;
};

function formatLastSessionLine(sessions: StudySession[], subjectId: string): string {
  const last = getLatestSessionDateForSubject(sessions, subjectId);
  if (!last) return "Sin sesiones registradas";
  const days = getDaysSinceDate(last);
  if (days === 0) return "Última sesión: hoy";
  if (days === 1) return "Última sesión: hace 1 día";
  return `Última sesión: hace ${days} días`;
}

function readinessBarClass(status: SubjectDisplayStatus): string {
  switch (status) {
    case "no_data":
      return "bg-slate-300";
    case "at_risk":
      return "bg-amber-400/90";
    case "in_progress":
      return "bg-gradient-to-r from-[#c9a454] to-[#ddb75c]";
    case "prepared":
      return "bg-emerald-500/85";
    case "passed":
      return "bg-sky-400/85";
  }
}

export function SubjectsPage({
  subjects,
  sessions,
  mockResults,
  errorLogItems,
  reviewItems = [],
  examDates,
  plannedSessions,
  initialSubjectStates,
  onAddExamDate,
  onDeleteExamDate,
  examDatesFormRequestKey = 0,
}: SubjectsPageProps) {
  const today = getTodayDateString();
  const [filter, setFilter] = useState<SubjectFilterId>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const readinessList = useMemo(
    () =>
      sortReadinessForDisplay(
        calculateReadinessForSubjects({
          subjectIds: subjects.map((s) => s.id),
          sessions,
          mockResults,
          errorLogItems,
          reviewItems,
        }),
      ),
    [subjects, sessions, mockResults, errorLogItems, reviewItems],
  );

  const pendingErrorsBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of subjects) {
      map[s.id] = calculatePendingErrorsForSubject(errorLogItems, s.id);
    }
    return map;
  }, [subjects, errorLogItems]);

  const summary = useMemo(
    () =>
      buildSubjectsPageSummary(
        readinessList,
        examDates,
        pendingErrorsBySubject,
        today,
        initialSubjectStates,
      ),
    [readinessList, examDates, pendingErrorsBySubject, today, initialSubjectStates],
  );

  const filtered = useMemo(
    () =>
      filterReadinessByChip(
        readinessList,
        filter,
        examDates,
        pendingErrorsBySubject,
        today,
        initialSubjectStates,
      ),
    [readinessList, filter, examDates, pendingErrorsBySubject, today, initialSubjectStates],
  );

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const selectedReadiness =
    readinessList.find((r) => r.subjectId === selectedSubjectId) ?? null;

  return (
    <div className="space-y-4 pb-2">
      <header className="space-y-1">
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">Asignaturas</h2>
        <p className="max-w-xl text-[14px] leading-relaxed text-slate-600">
          Controla el avance por materia y prioriza lo que más necesita atención.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200/90 bg-[#fffdf8] px-4 py-3 shadow-sm ring-1 ring-[#c9a454]/12">
        <p className="text-[13px] leading-relaxed text-slate-700">
          <span className="font-semibold text-[#0f1a33]">Resumen · </span>
          {formatSubjectsSummaryLine(summary)}
        </p>
      </section>

      <ExamDatesPanel
        subjects={subjects}
        examDates={examDates}
        onAddExamDate={onAddExamDate}
        onDeleteExamDate={onDeleteExamDate}
        openFormRequestKey={examDatesFormRequestKey}
      />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filtrar asignaturas"
      >
        {(Object.keys(SUBJECT_FILTER_LABELS) as SubjectFilterId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
              filter === id
                ? "border-[#c9a454]/45 bg-[#fff8e8] text-[#7a5a16]"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {SUBJECT_FILTER_LABELS[id]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-[14px] text-slate-600">
          Ninguna asignatura coincide con este filtro.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((readiness) => {
            const subject = subjects.find((s) => s.id === readiness.subjectId);
            if (!subject) return null;

            const pendingErrors = pendingErrorsBySubject[subject.id] ?? 0;
            const initialState = getInitialStateForSubject(
              subject.id,
              initialSubjectStates,
            );
            const displayStatus = resolveSubjectDisplayStatus(
              readiness,
              examDates,
              pendingErrors,
              today,
              initialState,
            );
            const displayLabel = getSubjectDisplayLabel(
              displayStatus,
              readiness,
              initialState,
            );
            const barPct =
              displayStatus === "no_data"
                ? 0
                : displayStatus === "passed"
                  ? 100
                  : readiness.score;
            const exam = getExamForSubject(subject.id, examDates, today);

            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSelectedSubjectId(subject.id)}
                aria-label={`Ver detalle de ${subject.name}`}
                className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-sm ring-1 ring-slate-100/80 transition hover:border-slate-300/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold leading-snug text-[#0f1a33]">
                    {subject.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${displayStatusStyles(displayStatus)}`}
                  >
                    {displayLabel}
                  </span>
                </div>

                {displayStatus !== "no_data" && displayStatus !== "passed" ? (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[12px] text-slate-500">
                      Nivel de preparación:{" "}
                      <span className="font-semibold tabular-nums text-[#0f1a33]">
                        {readiness.score}%
                      </span>
                      <span className="text-slate-400"> · </span>
                      <span className="font-medium text-slate-700">{displayLabel}</span>
                    </p>
                    {readiness.factors.latestMockScore !== null ? (
                      <p className="text-[11px] text-slate-500">
                        Último simulacro de examen: {formatMockScore(readiness.factors.latestMockScore)}
                      </p>
                    ) : null}
                    {readiness.isProvisional ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
                        Dato provisional
                      </span>
                    ) : null}
                  </div>
                ) : displayStatus === "passed" ? (
                  <p className="mt-2 text-[12px] text-slate-500">
                    Marcada como aprobada. No se prioriza en el plan habitual.
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-slate-500">
                    Empieza registrando una sesión o generando tu plan.
                  </p>
                )}

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${readinessBarClass(displayStatus)}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                <p className="mt-3 text-[12px] text-slate-500">
                  {formatLastSessionLine(sessions, subject.id)}
                </p>

                {exam ? (
                  <p className="mt-1 text-[12px] font-medium text-[#7a5a16]">
                    Examen: {formatDaysRemaining(getDaysUntilDate(exam.date, today))}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <SubjectDetailDrawer
        subject={selectedSubject}
        readiness={selectedReadiness}
        sessions={sessions}
        mockResults={mockResults}
        errorLogItems={errorLogItems}
        examDates={examDates}
        plannedSessions={plannedSessions}
        onClose={() => setSelectedSubjectId(null)}
      />
    </div>
  );
}
