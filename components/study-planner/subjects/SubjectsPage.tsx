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
import {
  calculatePendingErrorsForSubject,
  calculateReadinessForSubjects,
  getTodayDateString,
  sortReadinessForDisplay,
} from "@/lib/study-planner/calculations";
import { buildSubjectChartItems } from "@/lib/study-planner/subjects-chart-data";
import { plannerBtnGhost, plannerPageTitle } from "@/lib/study-planner/planner-ui";
import type { SubjectFilterId } from "@/lib/study-planner/subjects-page-logic";
import { ExamDatesPanel } from "./ExamDatesPanel";
import { SubjectDetailDrawer } from "./SubjectDetailDrawer";
import { SubjectsProgressBarChart } from "./SubjectsProgressBarChart";

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
  /** Conservado por compatibilidad con navegación desde Evaluación. */
  initialFilter?: SubjectFilterId;
  onGoToCalendar?: () => void;
};

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
  onGoToCalendar,
}: SubjectsPageProps) {
  const today = getTodayDateString();
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

  const chartItems = useMemo(
    () =>
      buildSubjectChartItems({
        readinessList,
        sessions,
        mockResults,
        plannedSessions,
        examDates,
        pendingErrorsBySubject,
        initialSubjectStates,
        today,
      }),
    [
      readinessList,
      sessions,
      mockResults,
      plannedSessions,
      examDates,
      pendingErrorsBySubject,
      initialSubjectStates,
      today,
    ],
  );

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const selectedReadiness =
    readinessList.find((r) => r.subjectId === selectedSubjectId) ?? null;

  const showEstimationCta =
    sessions.length + mockResults.length < 2 && typeof onGoToCalendar === "function";

  return (
    <div className="space-y-3 pb-2">
      <header>
        <h2 className={plannerPageTitle}>Asignaturas</h2>
      </header>

      <ExamDatesPanel
        subjects={subjects}
        examDates={examDates}
        onAddExamDate={onAddExamDate}
        onDeleteExamDate={onDeleteExamDate}
        openFormRequestKey={examDatesFormRequestKey}
        hideNextExamHighlight
      />

      <div className="space-y-2">
        <SubjectsProgressBarChart
          items={chartItems}
          onSelectSubject={setSelectedSubjectId}
        />

        {showEstimationCta ? (
          <div className="flex flex-col gap-2.5 px-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="text-[12px] leading-snug text-slate-500">
              Registra sesiones o simulacros para mejorar esta estimación.
            </p>
            <button
              type="button"
              onClick={onGoToCalendar}
              className={`${plannerBtnGhost} shrink-0 self-start sm:self-auto`}
            >
              Ir al calendario
            </button>
          </div>
        ) : null}
      </div>

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
