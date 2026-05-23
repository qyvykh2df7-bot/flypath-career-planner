"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type {
  ErrorLogItem,
  ExamDate,
  MockResult,
  PlannedStudySession,
  StudySession,
  StudySubject,
  SubjectReadiness,
} from "@/lib/study-planner/types";
import { calculatePendingErrorsForSubject } from "@/lib/study-planner/calculations";
import { isPendingLikeStatus } from "@/lib/study-planner/planner-session-status";
import { SubjectReadinessCard } from "../SubjectReadinessCard";
import { getExamForSubject } from "@/lib/study-planner/subjects-page-logic";
import {
  formatDaysRemaining,
  formatExamDisplayDate,
  getDaysUntilDate,
  getTodayDateString,
} from "@/lib/study-planner/calculations";
import { getSubjectById } from "@/lib/study-planner/subjects";

type SubjectDetailDrawerProps = {
  subject: StudySubject | null;
  readiness: SubjectReadiness | null;
  sessions: StudySession[];
  mockResults: MockResult[];
  errorLogItems: ErrorLogItem[];
  examDates: ExamDate[];
  plannedSessions: PlannedStudySession[];
  onClose: () => void;
};

export function SubjectDetailDrawer({
  subject,
  readiness,
  sessions,
  mockResults,
  errorLogItems,
  examDates,
  plannedSessions,
  onClose,
}: SubjectDetailDrawerProps) {
  const today = getTodayDateString();

  useEffect(() => {
    if (!subject) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [subject, onClose]);

  if (!subject || !readiness) return null;

  const exam = getExamForSubject(subject.id, examDates, today);
  const upcomingPlanned = plannedSessions
    .filter((p) => p.subjectId === subject.id && isPendingLikeStatus(p.status) && p.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[55] bg-[#0f1a33]/30 backdrop-blur-[1px]"
        aria-label="Cerrar detalle"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 right-0 z-[60] flex max-h-[min(85dvh,640px)] flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-[#f6f7f9] shadow-2xl sm:left-auto sm:right-0 sm:top-0 sm:max-h-none sm:h-full sm:w-[min(100%,420px)] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-detail-title"
      >
        <div className="flex shrink-0 items-center justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-300" aria-hidden />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200/80 px-4 pb-3 pt-1 sm:px-5 sm:pt-5">
          <div className="min-w-0 pr-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Detalle</p>
            <h2
              id="subject-detail-title"
              className="truncate text-[18px] font-semibold text-[#0f1a33]"
            >
              {subject.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-slate-200/90 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          {exam ? (
            <p className="mb-3 rounded-lg border border-[#c9a454]/25 bg-[#fffdf8] px-3 py-2 text-[13px] text-[#7a5a16]">
              Examen: {formatExamDisplayDate(exam.date)} ·{" "}
              {formatDaysRemaining(getDaysUntilDate(exam.date, today))}
            </p>
          ) : null}

          <SubjectReadinessCard
            subject={subject}
            readiness={readiness}
            pendingErrorsCount={calculatePendingErrorsForSubject(errorLogItems, subject.id)}
            examDates={examDates}
          />

          {upcomingPlanned.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Próximas sesiones planificadas
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                {upcomingPlanned.map((p) => (
                  <li key={p.id}>
                    {p.date} · {p.plannedDurationMinutes} min · {p.type}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
