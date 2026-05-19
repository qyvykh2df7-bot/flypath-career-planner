"use client";

import type { StudySession } from "@/lib/study-planner/types";
import {
  calculateStudyStreak,
  formatDaysRemaining,
  getDaysUntilDate,
  getTodayDateString,
  hasStudiedOnDate,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";

type MomentumStripProps = {
  sessions: StudySession[];
  weekPercent: number;
  targetExamDate?: string;
  nextExamDate?: string;
  hasPlan?: boolean;
  remainingGoalMinutes?: number;
};

export function MomentumStrip({
  sessions,
  weekPercent,
  targetExamDate,
  nextExamDate,
  hasPlan = true,
  remainingGoalMinutes,
}: MomentumStripProps) {
  const today = getTodayDateString();
  const streak = calculateStudyStreak(sessions, today);
  const studiedToday = hasStudiedOnDate(sessions, today);

  const examIso = nextExamDate ?? targetExamDate;
  const examDays = examIso ? getDaysUntilDate(examIso, today) : null;

  const segments: string[] = [];
  if (studiedToday) {
    segments.push("Activo hoy");
  } else if (streak > 0) {
    segments.push(`${streak} día${streak === 1 ? "" : "s"} seguidos`);
  }
  segments.push(`${weekPercent}% semana`);
  if (
    !hasPlan &&
    remainingGoalMinutes !== undefined &&
    remainingGoalMinutes > 0
  ) {
    segments.push(`${minutesToHoursLabel(remainingGoalMinutes)} objetivo semanal`);
  }
  if (examDays !== null && examDays >= 0) {
    segments.push(formatDaysRemaining(examDays));
  }

  return (
    <p className="text-[11px] font-normal tracking-wide text-slate-400">
      {segments.map((seg, i) => (
        <span key={seg}>
          {i > 0 ? <span className="mx-2 text-slate-300/70">·</span> : null}
          {seg}
        </span>
      ))}
    </p>
  );
}
