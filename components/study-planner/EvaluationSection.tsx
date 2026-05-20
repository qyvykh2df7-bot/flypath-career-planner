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
import { ErrorLogForm } from "./ErrorLogForm";
import { ErrorLogList } from "./ErrorLogList";
import { EvaluationHero } from "./evaluation/EvaluationHero";
import { EvaluationPriorityPanel } from "./evaluation/EvaluationPriorityPanel";
import { EvaluationCoachCard, resolveCoachView } from "./evaluation/EvaluationCoachCard";
import { createPlannerId, formatDateLocal } from "@/lib/study-planner/calculations";
import type { GoToSubjectsOptions } from "@/lib/study-planner/dashboard-navigation";

export type { EvaluationView };

const SUB_TABS: { id: EvaluationView; label: string }[] = [
  { id: "mocks", label: "Simulacros" },
  { id: "errors", label: "Errores" },
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
  initialView?: EvaluationView;
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
  onAddErrorLogItem,
  onSetErrorLogStatus,
  onDeleteErrorLogItem,
  initialView = "mocks",
  focusMockFormRequestKey = 0,
  onGoToCalendar,
  onGoToSubjects,
}: EvaluationSectionProps) {
  const today = getTodayDateString();
  const [view, setView] = useState<EvaluationView>(initialView);
  const [pendingFocusTarget, setPendingFocusTarget] = useState<"errors" | "reviews" | null>(null);
  const mockFormRef = useRef<HTMLDivElement>(null);
  const errorsPendingRef = useRef<HTMLDivElement>(null);
  const reviewsPendingRef = useRef<HTMLDivElement>(null);

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
    if (!pendingFocusTarget) return;
    if (pendingFocusTarget !== view) return;
    const targetRef = pendingFocusTarget === "errors" ? errorsPendingRef : reviewsPendingRef;
    const timer = window.setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      targetRef.current?.focus();
      setPendingFocusTarget(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pendingFocusTarget, view]);

  const goToPendingErrors = () => {
    setView("errors");
    setPendingFocusTarget("errors");
  };

  const goToPendingReviews = () => {
    setView("reviews");
    setPendingFocusTarget("reviews");
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
    if (action.kind === "view_errors") {
      goToPendingErrors();
      return;
    }
    if (action.kind === "view_reviews") {
      goToPendingReviews();
      return;
    }
    const nextView = resolveCoachView(action);
    if (nextView) setView(nextView);
    if (action.kind === "register_mock") {
      window.setTimeout(() => mockFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  const handleCreateReviewFromError = (error: ErrorLogItem) => {
    const todayStr = formatDateLocal(new Date());
    onAddReviewItem({
      id: createPlannerId(),
      subjectId: error.subjectId,
      topic: error.topic,
      createdAt: todayStr,
      dueDate: todayStr,
      intervalDays: 3,
      status: "pending",
      notes: `Repaso desde error: ${error.description.slice(0, 120)}`,
    });
    setView("reviews");
  };

  return (
    <div className="space-y-3 pb-2">
      <header className="space-y-0.5">
        <h2 className="text-[17px] font-medium tracking-tight text-[#0f1a33]">Evaluación</h2>
        <p className="max-w-xl text-[13px] text-slate-600">
          Centro de control: simulacros, riesgo y qué reforzar.
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
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/30 ${
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
          <div ref={mockFormRef} className="rounded-xl bg-white/90 p-3 ring-1 ring-slate-200/25">
            <p className="mb-2 text-[12px] font-semibold text-[#0f1a33]">Nuevo simulacro</p>
            <MockResultForm subjects={subjects} onAddMockResult={onAddMockResult} />
          </div>
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
        </div>
      ) : null}

      {view === "errors" ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/90 p-3 ring-1 ring-slate-200/25">
            <ErrorLogForm subjects={subjects} onAddErrorLogItem={onAddErrorLogItem} />
          </div>
          <div ref={errorsPendingRef} tabIndex={-1} className="scroll-mt-4 focus:outline-none">
            <p className="mb-1.5 text-[12px] font-semibold text-[#0f1a33]">Errores pendientes</p>
          </div>
          <ErrorLogList
            errorLogItems={errorLogItems}
            onSetStatus={onSetErrorLogStatus}
            onDelete={onDeleteErrorLogItem}
            onCreateReview={handleCreateReviewFromError}
          />
        </div>
      ) : null}

      {view === "reviews" ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/90 p-3 ring-1 ring-slate-200/25">
            <ReviewItemForm subjects={subjects} onAddReviewItem={onAddReviewItem} />
          </div>
          <div ref={reviewsPendingRef} tabIndex={-1} className="scroll-mt-4 focus:outline-none">
            <p className="mb-1.5 text-[12px] font-semibold text-[#0f1a33]">Repasos pendientes</p>
          </div>
          <ReviewItemsList
            reviewItems={reviewItems}
            onComplete={onCompleteReviewItem}
            onReschedule={onRescheduleReviewItem}
            onDelete={onDeleteReviewItem}
            emptyPendingMessage="Sin repasos pendientes. Registra errores o temas débiles para planificar repaso."
          />
        </div>
      ) : null}
    </div>
  );
}
