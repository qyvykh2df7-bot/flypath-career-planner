"use client";

import { useEffect, useState } from "react";
import type {
  StudyMode,
  StudySubject,
  MockResult,
  ReviewItem,
  ErrorLogItem,
  StudySession,
} from "@/lib/study-planner/types";
import { MockResultForm } from "./MockResultForm";
import { MockSubjectSummary } from "./MockSubjectSummary";
import { MockResultsTable } from "./MockResultsTable";
import { ReviewItemForm } from "./ReviewItemForm";
import { ReviewItemsList } from "./ReviewItemsList";
import { ErrorLogForm } from "./ErrorLogForm";
import { ErrorLogSummary } from "./ErrorLogSummary";
import { ErrorLogList } from "./ErrorLogList";
import { StudyProgressCharts } from "./StudyProgressCharts";

const SUB_TABS: { id: EvaluationView; label: string }[] = [
  { id: "mocks", label: "Mocks" },
  { id: "reviews", label: "Repasos" },
  { id: "errors", label: "Errores" },
  { id: "progress", label: "Progreso" },
];

export type EvaluationView = "mocks" | "reviews" | "errors" | "progress";

type EvaluationSectionProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  weeklyGoalMinutes: number;
  initialView?: EvaluationView;
  onAddMockResult: (mock: MockResult) => void;
  onDeleteMockResult: (id: string) => void;
  onAddReviewItem: (item: ReviewItem) => void;
  onCompleteReviewItem: (id: string) => void;
  onRescheduleReviewItem: (id: string, days: number) => void;
  onDeleteReviewItem: (id: string) => void;
  onAddErrorLogItem: (item: ErrorLogItem) => void;
  onSetErrorLogStatus: (id: string, status: ErrorLogItem["status"]) => void;
  onDeleteErrorLogItem: (id: string) => void;
};

export function EvaluationSection({
  mode,
  subjects,
  sessions,
  mockResults,
  reviewItems,
  errorLogItems,
  weeklyGoalMinutes,
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
}: EvaluationSectionProps) {
  const [view, setView] = useState<EvaluationView>(initialView);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  return (
    <div className="space-y-4">
      <h3 className="text-[14px] font-semibold text-[#0f1a33]">Evaluación</h3>

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
          <MockResultForm subjects={subjects} onAddMockResult={onAddMockResult} />
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Resumen por asignatura</h4>
            <MockSubjectSummary mockResults={mockResults} />
          </div>
          <div>
            <h4 className="mb-2 text-[13px] font-semibold text-[#0f1a33]">Historial de mocks</h4>
            <MockResultsTable mockResults={mockResults} onDelete={onDeleteMockResult} />
          </div>
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
          />
        </div>
      ) : null}

      {view === "errors" ? (
        <div className="space-y-4">
          <ErrorLogForm subjects={subjects} onAddErrorLogItem={onAddErrorLogItem} />
          <ErrorLogSummary errorLogItems={errorLogItems} subjects={subjects} mode={mode} />
          <ErrorLogList
            errorLogItems={errorLogItems}
            onSetStatus={onSetErrorLogStatus}
            onDelete={onDeleteErrorLogItem}
          />
        </div>
      ) : null}

      {view === "progress" ? (
        <StudyProgressCharts
          mode={mode}
          sessions={sessions}
          mockResults={mockResults}
          subjects={subjects}
          weeklyGoalMinutes={weeklyGoalMinutes}
        />
      ) : null}
    </div>
  );
}
