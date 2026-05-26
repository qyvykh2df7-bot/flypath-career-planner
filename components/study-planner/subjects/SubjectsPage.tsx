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

  return (
    <div className="space-y-3 pb-2">
      <header className="space-y-0.5">
        <h2 className="text-[17px] font-medium tracking-tight text-[#0f1a33]">Asignaturas</h2>
        <p className="max-w-xl text-[13px] leading-relaxed text-slate-600">
          Avance por materia y prioridad de estudio.
        </p>
      </header>

      <ExamDatesPanel
        subjects={subjects}
        examDates={examDates}
        onAddExamDate={onAddExamDate}
        onDeleteExamDate={onDeleteExamDate}
        openFormRequestKey={examDatesFormRequestKey}
        hideNextExamHighlight
      />

      <SubjectsProgressBarChart
        items={chartItems}
        onSelectSubject={setSelectedSubjectId}
      />

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
