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
  buildEvaluationSummary,
  normalizeEvaluationView,
  type EvaluationCoachAction,
  type EvaluationView,
} from "@/lib/study-planner/evaluation-page-logic";
import { calculateReadinessForSubjects, getTodayDateString } from "@/lib/study-planner/calculations";
import { buildEvaluationPriorityGroups } from "@/lib/study-planner/evaluation-presentation";
import { MockResultForm } from "./MockResultForm";
import { MockSubjectSummary } from "./MockSubjectSummary";
import { MockResultsTable } from "./MockResultsTable";
import { ReviewItemForm } from "./ReviewItemForm";
import { ReviewItemsList } from "./ReviewItemsList";
import { EvaluationHero } from "./evaluation/EvaluationHero";
import { EvaluationPriorityPanel } from "./evaluation/EvaluationPriorityPanel";
import { EvaluationCoachCard, resolveCoachView } from "./evaluation/EvaluationCoachCard";
import type { GoToSubjectsOptions } from "@/lib/study-planner/dashboard-navigation";

export type { EvaluationView };

const SUB_TABS: { id: EvaluationView; label: string }[] = [
  { id: "mocks", label: "Simulacros" },
  { id: "reviews", label: "Repasos" },
];

type EvaluationSectionProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  initialView?: EvaluationView | "errors";
  focusMockFormRequestKey?: number;
  onAddMockResult: (mock: MockResult) => void;
  onDeleteMockResult: (id: string) => void;
  onAddReviewItem: (item: ReviewItem) => void;
  onCompleteReviewItem: (id: string) => void;
  onRescheduleReviewItem: (id: string, days: number) => void;
  onDeleteReviewItem: (id: string) => void;
  /** Mantenido para datos internos / futuro; sin UI en Evaluación V1. */
  onAddErrorLogItem: (item: ErrorLogItem) => void;
  onSetErrorLogStatus: (id: string, status: ErrorLogItem["status"]) => void;
  onDeleteErrorLogItem: (id: string) => void;
  onGoToCalendar?: () => void;
  onGoToSubjects?: (options?: GoToSubjectsOptions) => void;
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
  onAddErrorLogItem: _onAddErrorLogItem,
  onSetErrorLogStatus: _onSetErrorLogStatus,
  onDeleteErrorLogItem: _onDeleteErrorLogItem,
  initialView = "mocks",
  focusMockFormRequestKey = 0,
  onGoToCalendar,
  onGoToSubjects,
}: EvaluationSectionProps) {
  const today = getTodayDateString();
  const [view, setView] = useState<EvaluationView>(() => normalizeEvaluationView(initialView));
  const [mockFormOpen, setMockFormOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [pendingReviewsFocus, setPendingReviewsFocus] = useState(false);
  const mockFormRef = useRef<HTMLDivElement>(null);
  const reviewFormRef = useRef<HTMLDivElement>(null);
  const reviewsPendingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setView(normalizeEvaluationView(initialView));
  }, [initialView]);

  const openMockFormPanel = () => {
    setView("mocks");
    setMockFormOpen(true);
  };

  useEffect(() => {
    if (focusMockFormRequestKey <= 0) return;
    openMockFormPanel();
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

  const readiness = useMemo(
    () =>
      calculateReadinessForSubjects({
        subjectIds: subjects.map((s) => s.id),
        sessions,
        mockResults,
      }),
    [subjects, sessions, mockResults],
  );

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

  useEffect(() => {
    if (!pendingReviewsFocus || view !== "reviews") return;
    const timer = window.setTimeout(() => {
      reviewsPendingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      reviewsPendingRef.current?.focus();
      setPendingReviewsFocus(false);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pendingReviewsFocus, view]);

  const goToPendingReviews = () => {
    setView("reviews");
    setPendingReviewsFocus(true);
  };

  const goToSubjectsAtRisk = () => {
    onGoToSubjects?.({ filter: "at_risk" });
  };

  const handleCoachAction = (action: EvaluationCoachAction) => {
    if (action.kind === "view_calendar") {
      onGoToCalendar?.();
      return;
    }
    if (action.kind === "view_subjects") {
      goToSubjectsAtRisk();
      return;
    }
    if (action.kind === "view_reviews" || action.kind === "plan_review") {
      goToPendingReviews();
      return;
    }
    const nextView = resolveCoachView(action);
    if (nextView) setView(nextView);
    if (action.kind === "register_mock") {
      openMockFormPanel();
      window.setTimeout(() => {
        mockFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        const focusable = mockFormRef.current?.querySelector<HTMLElement>(
          "select, input:not([type='hidden'])",
        );
        focusable?.focus();
      }, 80);
    }
  };

  return (
    <div className="space-y-3 pb-2">
      <header className="space-y-0.5">
        <h2 className="text-[17px] font-medium tracking-tight text-[#0f1a33]">Evaluación</h2>
        <p className="max-w-xl text-[13px] text-slate-600">
          Diagnóstico de preparación y riesgos. Registra simulacros y sesiones desde el calendario;
          aquí analizas rendimiento e historial.
        </p>
      </header>

      <EvaluationHero
        subjects={subjects}
        sessions={sessions}
        mockResults={mockResults}
        errorLogItems={errorLogItems}
        reviewItems={reviewItems}
        examDates={examDates}
        summary={summary}
        coach={coach}
      />

      <EvaluationPriorityPanel groups={priorityGroups} />

      <EvaluationCoachCard recommendation={coach} onAction={handleCoachAction} />

      <div
        className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-slate-100/55 p-0.5 ring-1 ring-slate-200/25"
        role="tablist"
        aria-label="Sección de evaluación"
      >
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30 ${
              view === tab.id
                ? "bg-white text-[#0f1a33] shadow-[0_1px_3px_-1px_rgba(15,26,51,0.08)]"
                : "text-slate-600 hover:bg-white/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "mocks" ? (
        <div className="space-y-3">
          <div>
            <h4 className="mb-1.5 text-[12px] font-semibold text-[#0f1a33]">
              Rendimiento por asignatura
            </h4>
            <MockSubjectSummary mockResults={mockResults} />
          </div>
          <div>
            <h4 className="mb-1.5 text-[12px] font-semibold text-[#0f1a33]">Historial</h4>
            <MockResultsTable mockResults={mockResults} onDelete={onDeleteMockResult} />
          </div>
          <div
            ref={mockFormRef}
            className="rounded-xl bg-slate-50/50 p-3 ring-1 ring-slate-200/25"
          >
            <button
              type="button"
              onClick={() => setMockFormOpen((open) => !open)}
              aria-expanded={mockFormOpen}
              aria-controls="evaluation-mock-form-panel"
              className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left text-[13px] font-semibold text-[#3b6ea8] transition hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25"
            >
              <span>+ Añadir simulacro manual</span>
              <span className="text-[12px] font-normal text-slate-500" aria-hidden>
                {mockFormOpen ? "Ocultar" : "Opcional"}
              </span>
            </button>
            <p className="mt-1 px-1 text-[12px] leading-snug text-slate-500">
              Los simulacros completados en el calendario se reflejan aquí automáticamente.
            </p>
            {mockFormOpen ? (
              <div
                id="evaluation-mock-form-panel"
                className="mt-3 border-t border-slate-200/40 pt-3"
              >
                <MockResultForm subjects={subjects} onAddMockResult={onAddMockResult} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {view === "reviews" ? (
        <div className="space-y-3">
          <div ref={reviewsPendingRef} tabIndex={-1} className="scroll-mt-4 focus:outline-none">
            <p className="mb-1.5 text-[12px] font-semibold text-[#0f1a33]">Repasos pendientes</p>
          </div>
          <ReviewItemsList
            reviewItems={reviewItems}
            onComplete={onCompleteReviewItem}
            onReschedule={onRescheduleReviewItem}
            onDelete={onDeleteReviewItem}
            emptyPendingMessage="Sin repasos pendientes. Planifica repasos desde el calendario o tras un simulacro."
          />
          <div
            ref={reviewFormRef}
            className="rounded-xl bg-slate-50/50 p-3 ring-1 ring-slate-200/25"
          >
            <button
              type="button"
              onClick={() => setReviewFormOpen((open) => !open)}
              aria-expanded={reviewFormOpen}
              aria-controls="evaluation-review-form-panel"
              className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-left text-[13px] font-semibold text-[#3b6ea8] transition hover:text-[#0f1a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/25"
            >
              <span>+ Añadir repaso manual</span>
              <span className="text-[12px] font-normal text-slate-500" aria-hidden>
                {reviewFormOpen ? "Ocultar" : "Opcional"}
              </span>
            </button>
            <p className="mt-1 px-1 text-[12px] leading-snug text-slate-500">
              Los repasos planificados en el calendario también aparecen en tu agenda.
            </p>
            {reviewFormOpen ? (
              <div
                id="evaluation-review-form-panel"
                className="mt-3 border-t border-slate-200/40 pt-3"
              >
                <ReviewItemForm subjects={subjects} onAddReviewItem={onAddReviewItem} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
