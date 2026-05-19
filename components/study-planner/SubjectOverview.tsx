"use client";

import type { MockResult, StudyMode, StudySession, StudySubject } from "@/lib/study-planner/types";
import {
  calculateEstimatedMinutesPerSubject,
  calculateSubjectProgressPercent,
  getLatestSessionDateForSubject,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";

type SubjectOverviewProps = {
  subjects: StudySubject[];
  sessions: StudySession[];
  mockResults: MockResult[];
  mode: StudyMode;
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
};

export function SubjectOverview({
  subjects,
  sessions,
  mockResults,
  mode,
  weeklyGoalMinutes,
  targetExamDate,
  studyStartDate,
}: SubjectOverviewProps) {
  const estimatedPerSubject = calculateEstimatedMinutesPerSubject({
    mode,
    activeSubjectCount: subjects.length,
    weeklyGoalMinutes,
    targetExamDate,
    studyStartDate,
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => {
        const totalMinutes = sessions
          .filter((s) => s.subjectId === subject.id)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
        const hasSessions = totalMinutes > 0;
        const lastDate = getLatestSessionDateForSubject(sessions, subject.id);
        const progress = calculateSubjectProgressPercent({
          subjectId: subject.id,
          sessions,
          mockResults,
          estimatedTargetMinutes: estimatedPerSubject,
        });

        return (
          <div
            key={subject.id}
            className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80"
          >
            <p className="text-[14px] font-semibold leading-snug text-[#0f1a33]">{subject.name}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
              <span
                className={`rounded-full border px-2.5 py-0.5 font-medium ${
                  hasSessions
                    ? "border-[#c9a454]/35 bg-[#fff8e8] text-[#7a5a16]"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {hasSessions ? "En curso" : "No empezada"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-medium tabular-nums text-slate-700">
                {progress}%
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-medium tabular-nums text-slate-600">
                {minutesToHoursLabel(totalMinutes)}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c9a454] to-[#ddb75c]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              {hasSessions && lastDate
                ? `Última sesión: ${lastDate}`
                : "Sin sesiones registradas"}
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              Objetivo orientativo: {minutesToHoursLabel(estimatedPerSubject)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
