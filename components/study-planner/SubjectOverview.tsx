"use client";

import type { StudySession, StudySubject } from "@/lib/study-planner/types";
import {
  calculateMinutesBySubject,
  getLatestSessionDateForSubject,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";

type SubjectOverviewProps = {
  subjects: StudySubject[];
  sessions: StudySession[];
};

export function SubjectOverview({ subjects, sessions }: SubjectOverviewProps) {
  const minutesBySubject = calculateMinutesBySubject(sessions);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => {
        const totalMinutes = minutesBySubject[subject.id] ?? 0;
        const hasSessions = totalMinutes > 0;
        const lastDate = getLatestSessionDateForSubject(sessions, subject.id);

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
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-medium text-slate-600">
                0%
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-medium tabular-nums text-slate-600">
                {minutesToHoursLabel(totalMinutes)}
              </span>
            </div>
            <p className="mt-3 text-[13px] text-slate-500">
              {hasSessions && lastDate
                ? `Última sesión: ${lastDate}`
                : "Sin sesiones registradas"}
            </p>
            <p className="mt-2 text-[12px] text-slate-400">Configurar más adelante</p>
          </div>
        );
      })}
    </div>
  );
}
