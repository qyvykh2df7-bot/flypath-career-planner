"use client";

import { useEffect, useMemo, useState } from "react";
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
  getExamForSubject,
  getSubjectDisplayLabel,
  resolveSubjectDisplayStatus,
  subjectCardBadgeLabel,
  subjectNoDataBadgeClass,
  SUBJECT_FILTER_LABELS,
  type SubjectFilterId,
  type SubjectDisplayStatus,
  type SubjectsPageSummary,
} from "@/lib/study-planner/subjects-page-logic";
import { formatDaysRemaining, getDaysUntilDate } from "@/lib/study-planner/calculations";
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
  initialFilter?: SubjectFilterId;
};

function formatLastSessionLine(sessions: StudySession[], subjectId: string): string {
  const last = getLatestSessionDateForSubject(sessions, subjectId);
  if (!last) return "Sin sesiones aún";
  const days = getDaysSinceDate(last);
  if (days === 0) return "Última sesión: hoy";
  if (days === 1) return "Última sesión: hace 1 día";
  return `Última sesión: hace ${days} días`;
}

function readinessBarClass(status: SubjectDisplayStatus): string {
  switch (status) {
    case "no_data":
      return "bg-slate-200/70";
    case "at_risk":
      return "bg-gradient-to-r from-amber-400/90 to-amber-300/80";
    case "in_progress":
      return "bg-gradient-to-r from-[#c9a454] to-[#ddb75c]";
    case "prepared":
      return "bg-gradient-to-r from-emerald-500/85 to-emerald-400/75";
    case "passed":
      return "bg-sky-400/75";
  }
}

function subjectCardShellClass(status: SubjectDisplayStatus): string {
  const base =
    "flex flex-col rounded-xl p-3.5 text-left transition-[box-shadow,ring-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/35";
  switch (status) {
    case "no_data":
      return `${base} bg-slate-50/70 ring-1 ring-slate-200/25 hover:bg-slate-50/90`;
    case "at_risk":
      return `${base} bg-white p-3 ring-1 ring-amber-200/35 hover:ring-amber-200/55 shadow-[0_2px_14px_-10px_rgba(180,120,0,0.12)]`;
    case "passed":
      return `${base} bg-white p-3 ring-1 ring-sky-200/30 hover:ring-sky-200/45 opacity-95`;
    default:
      return `${base} bg-white p-3 ring-1 ring-slate-200/30 hover:ring-[#c9a454]/25 shadow-[0_2px_14px_-10px_rgba(15,26,51,0.07)]`;
  }
}

function SummaryChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "gold" | "amber" | "slate" | "exam";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-[#fff8e8]/90 text-[#7a5a16] ring-[#c9a454]/18"
      : tone === "amber"
        ? "bg-amber-50/80 text-amber-900 ring-amber-200/40"
        : tone === "slate"
          ? "bg-slate-100/80 text-slate-600 ring-slate-200/40"
          : tone === "exam"
            ? "bg-[#e8f0fa]/80 text-[#1e4a7a] ring-[#3b6ea8]/15"
            : "bg-white/90 text-slate-700 ring-slate-200/35";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ${toneClass}`}
    >
      {label}
    </span>
  );
}

function SubjectsSummaryChips({ summary }: { summary: SubjectsPageSummary }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="Resumen de asignaturas">
      <SummaryChip label={`${summary.activeCount} activas`} />
      <SummaryChip label={`${summary.inProgressCount} en curso`} tone="gold" />
      <SummaryChip label={`${summary.atRiskCount} en riesgo`} tone="amber" />
      <SummaryChip label={`${summary.noDataCount} sin datos`} tone="slate" />
      {summary.nextExamLine ? (
        <SummaryChip label={`Próximo: ${summary.nextExamLine}`} tone="exam" />
      ) : null}
    </div>
  );
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
  initialFilter = "all",
}: SubjectsPageProps) {
  const today = getTodayDateString();
  const [filter, setFilter] = useState<SubjectFilterId>(initialFilter);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

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

  const filterIds = Object.keys(SUBJECT_FILTER_LABELS) as SubjectFilterId[];

  return (
    <div className="space-y-3 pb-2">
      <header className="space-y-0.5">
        <h2 className="text-[17px] font-medium tracking-tight text-[#0f1a33]">Asignaturas</h2>
        <p className="max-w-xl text-[13px] leading-relaxed text-slate-600">
          Avance por materia y prioridad de estudio.
        </p>
      </header>

      <SubjectsSummaryChips summary={summary} />

      <ExamDatesPanel
        subjects={subjects}
        examDates={examDates}
        onAddExamDate={onAddExamDate}
        onDeleteExamDate={onDeleteExamDate}
        openFormRequestKey={examDatesFormRequestKey}
      />

      <div
        className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-slate-100/55 p-0.5 ring-1 ring-slate-200/25"
        role="tablist"
        aria-label="Filtrar asignaturas"
      >
        {filterIds.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30 ${
              filter === id
                ? "bg-white text-[#0f1a33] shadow-[0_1px_4px_-1px_rgba(15,26,51,0.1)]"
                : "text-slate-600 hover:bg-white/60 hover:text-[#0f1a33]"
            }`}
          >
            {SUBJECT_FILTER_LABELS[id]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-slate-50/60 px-4 py-5 text-center text-[13px] text-slate-600 ring-1 ring-slate-200/25">
          Ninguna asignatura coincide con este filtro.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
            const badgeLabel = subjectCardBadgeLabel(displayStatus, displayLabel);
            const barPct =
              displayStatus === "no_data"
                ? 0
                : displayStatus === "passed"
                  ? 100
                  : readiness.score;
            const exam = getExamForSubject(subject.id, examDates, today);
            const isNoData = displayStatus === "no_data";

            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSelectedSubjectId(subject.id)}
                aria-label={`Ver detalle de ${subject.name}`}
                className={subjectCardShellClass(displayStatus)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`font-semibold leading-snug ${
                      isNoData ? "text-[12px] text-slate-500" : "text-[13px] text-[#0f1a33]"
                    }`}
                  >
                    {subject.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full font-medium ${
                      isNoData
                        ? `px-1.5 py-0 text-[9px] ${subjectNoDataBadgeClass()}`
                        : `px-2 py-0.5 text-[10px] font-semibold ring-1 ${displayStatusStyles(displayStatus)}`
                    }`}
                  >
                    {badgeLabel}
                  </span>
                </div>

                {isNoData ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[10px] font-medium text-slate-400">Sin datos aún</p>
                    <p className="text-[10px] leading-snug text-slate-400/90">
                      Registra una sesión para calcular preparación
                    </p>
                  </div>
                ) : null}

                {!isNoData && displayStatus !== "passed" ? (
                  <div className="mt-2">
                    <p className="flex items-baseline gap-0.5 tabular-nums">
                      <span className="text-[22px] font-semibold leading-none text-[#0f1a33]">
                        {readiness.score}
                      </span>
                      <span className="text-[13px] font-medium text-slate-400">%</span>
                    </p>
                    <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-slate-100/80">
                      <div
                        className={`h-full rounded-full transition-all ${readinessBarClass(displayStatus)}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {displayStatus === "passed" ? (
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Aprobada · fuera del plan habitual
                  </p>
                ) : null}

                {!isNoData ? (
                  <div className="mt-2 space-y-0.5 text-[10px] text-slate-500">
                    {readiness.isProvisional ? (
                      <span className="inline-flex rounded bg-slate-100/70 px-1 py-px text-[9px] font-medium text-slate-500">
                        Dato provisional
                      </span>
                    ) : null}
                    {readiness.factors.latestMockScore !== null ? (
                      <p>Simulacro {formatMockScore(readiness.factors.latestMockScore)}</p>
                    ) : null}
                    <p>{formatLastSessionLine(sessions, subject.id)}</p>
                    {exam ? (
                      <p className="font-medium text-[#7a5a16]/85">
                        Examen {formatDaysRemaining(getDaysUntilDate(exam.date, today))}
                      </p>
                    ) : null}
                  </div>
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
