"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ExamDate,
  StudyMode,
  StudySubject,
  MockResult,
  ReviewItem,
  ErrorLogItem,
  StudySession,
} from "@/lib/study-planner/types";
import {
  buildEvaluationCoachRecommendation,
  buildEvaluationDiagnostic,
  buildEvaluationSummary,
  type EvaluationCoachAction,
  type EvaluationView,
} from "@/lib/study-planner/evaluation-page-logic";
import { MockResultForm } from "./MockResultForm";
import { MockSubjectSummary } from "./MockSubjectSummary";
import { MockResultsTable } from "./MockResultsTable";
import { ReviewItemForm } from "./ReviewItemForm";
import { ReviewItemsList } from "./ReviewItemsList";
import { ErrorLogForm } from "./ErrorLogForm";
import { ErrorLogList } from "./ErrorLogList";
import { EvaluationSummaryBar } from "./evaluation/EvaluationSummaryBar";
import { EvaluationCoachCard, resolveCoachView } from "./evaluation/EvaluationCoachCard";
import { EvaluationProgressTab } from "./evaluation/EvaluationProgressTab";
import { createPlannerId, formatDateLocal } from "@/lib/study-planner/calculations";

export type { EvaluationView };

const SUB_TABS: { id: EvaluationView; label: string }[] = [
  { id: "mocks", label: "Simulacros" },
  { id: "errors", label: "Errores" },
  { id: "reviews", label: "Repasos" },
  { id: "progress", label: "Progreso" },
];

type EvaluationSectionProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  initialView?: EvaluationView;
  /** Incrementar desde navegación para abrir simulacros y enfocar el formulario. */
  focusMockFormRequestKey?: number;
  onAddMockResult: (mock: MockResult) => void;
  onDeleteMockResult: (id: string) => void;
  onAddReviewItem: (item: ReviewItem) => void;
  onCompleteReviewItem: (id: string) => void;
  onRescheduleReviewItem: (id: string, days: number) => void;
  onDeleteReviewItem: (id: string) => void;
  onAddErrorLogItem: (item: ErrorLogItem) => void;
  onSetErrorLogStatus: (id: string, status: ErrorLogItem["status"]) => void;
  onDeleteErrorLogItem: (id: string) => void;
  onGoToCalendar?: () => void;
  onGoToSubjects?: () => void;
};

export function EvaluationSection({
  subjects,
  sessions,
  mockResults,
  reviewItems,
  errorLogItems,
  examDates,
  onAddMockResult,
  onDeleteMockResult,
  onAddReviewItem,
  onCompleteReviewItem,
  onRescheduleReviewItem,
  onDeleteReviewItem,
  onAddErrorLogItem,
  onSetErrorLogStatus,
  onDeleteErrorLogItem,
  initialView = "mocks",
  focusMockFormRequestKey = 0,
  onGoToCalendar,
  onGoToSubjects,
}: EvaluationSectionProps) {
  const [view, setView] = useState<EvaluationView>(initialView);
  const mockFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (focusMockFormRequestKey <= 0) return;
    setView("mocks");
    const timer = window.setTimeout(() => {
      mockFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const focusable = mockFormRef.current?.querySelector<HTMLElement>(
        "select, input:not([type='hidden'])",
      );
      focusable?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusMockFormRequestKey]);

  const summary = useMemo(
    () =>
      buildEvaluationSummary({
        mockResults,
        errorLogItems,
        reviewItems,
        subjectIds: subjects.map((s) => s.id),
        examDates,
        sessions,
      }),
    [mockResults, errorLogItems, reviewItems, subjects, examDates, sessions],
  );

  const coach = useMemo(
    () => buildEvaluationCoachRecommendation(summary, errorLogItems, reviewItems, mockResults),
    [summary, errorLogItems, reviewItems, mockResults],
  );

  const diagnostic = useMemo(
    () =>
      buildEvaluationDiagnostic({
        subjects,
        sessions,
        mockResults,
        errorLogItems,
        reviewItems,
        examDates,
      }),
    [subjects, sessions, mockResults, errorLogItems, reviewItems, examDates],
  );

  const handleCoachAction = (action: EvaluationCoachAction) => {
    if (action.kind === "view_calendar") {
      onGoToCalendar?.();
      return;
    }
    if (action.kind === "view_subjects") {
      onGoToSubjects?.();
      return;
    }
    const nextView = resolveCoachView(action);
    if (nextView) setView(nextView);
    if (action.kind === "register_mock") {
      window.setTimeout(() => mockFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const handleCreateReviewFromError = (error: ErrorLogItem) => {
    const today = formatDateLocal(new Date());
    onAddReviewItem({
      id: createPlannerId(),
      subjectId: error.subjectId,
      topic: error.topic,
      createdAt: today,
      dueDate: today,
      intervalDays: 3,
      status: "pending",
      notes: `Repaso desde error: ${error.description.slice(0, 120)}`,
    });
    setView("reviews");
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-[18px] font-semibold tracking-tight text-[#0f1a33]">Evaluación</h2>
        <p className="max-w-2xl text-[13px] leading-relaxed text-slate-600">
          Controla tus simulacros, errores y repasos para saber qué reforzar antes del examen.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm ring-1 ring-slate-100/80 sm:p-4">
        <EvaluationSummaryBar summary={summary} />
      </section>

      <EvaluationCoachCard recommendation={coach} onAction={handleCoachAction} />

      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200/90 bg-slate-50/80 p-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 ${
              view === tab.id
                ? "bg-white text-[#0f1a33] shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-[#0f1a33]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "mocks" ? (
        <div className="space-y-4">
          <div ref={mockFormRef}>
            <p className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Registro rápido de simulacro</p>
            <MockResultForm subjects={subjects} onAddMockResult={onAddMockResult} />
          </div>
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Resumen por asignatura</h4>
            <MockSubjectSummary mockResults={mockResults} />
          </div>
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Historial de simulacros</h4>
            <MockResultsTable mockResults={mockResults} onDelete={onDeleteMockResult} />
          </div>
        </div>
      ) : null}

      {view === "errors" ? (
        <div className="space-y-4">
          <ErrorLogForm subjects={subjects} onAddErrorLogItem={onAddErrorLogItem} />
          <ErrorLogList
            errorLogItems={errorLogItems}
            onSetStatus={onSetErrorLogStatus}
            onDelete={onDeleteErrorLogItem}
            onCreateReview={handleCreateReviewFromError}
          />
        </div>
      ) : null}

      {view === "reviews" ? (
        <div className="space-y-4">
          <ReviewItemForm subjects={subjects} onAddReviewItem={onAddReviewItem} />
          <ReviewItemsList
            reviewItems={reviewItems}
            onComplete={onCompleteReviewItem}
            onReschedule={onRescheduleReviewItem}
            onDelete={onDeleteReviewItem}
            emptyPendingMessage="Sin repasos pendientes. Cuando registres errores o temas débiles, aparecerán aquí."
          />
        </div>
      ) : null}

      {view === "progress" ? <EvaluationProgressTab diagnostic={diagnostic} /> : null}
    </div>
  );
}
