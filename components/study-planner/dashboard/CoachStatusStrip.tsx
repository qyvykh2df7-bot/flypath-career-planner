"use client";

import {
  buildWeeklyCoachMessage,
  type WeeklyPlanCompletion,
} from "@/lib/study-planner/calculations";

type CoachStatusStripProps = {
  completion: WeeklyPlanCompletion;
  totalStudySessions?: number;
  /** Oculta el texto cuando el hero ya comunica el mismo mensaje */
  hideSubline?: boolean;
};

export function CoachStatusStrip({
  completion,
  totalStudySessions = 0,
  hideSubline = false,
}: CoachStatusStripProps) {
  const coach = buildWeeklyCoachMessage(completion, totalStudySessions);
  const progressKey = `${completion.completionPercent}-${completion.expectedProgressPercent}`;
  const showSubline = !hideSubline && coach.subline.length > 0;

  return (
    <section className={showSubline ? "space-y-1.5" : ""}>
      {showSubline ? (
        <p className="text-[13px] font-normal leading-snug text-slate-500">{coach.subline}</p>
      ) : null}
      <div className="relative h-1 overflow-hidden rounded-full bg-slate-200/70">
        <div
          key={progressKey}
          className="planner-bar-grow absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90 transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, completion.completionPercent)}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-[#0f1a33]/20 transition-[left] duration-700 ease-out"
          style={{ left: `${Math.min(100, completion.expectedProgressPercent)}%` }}
        />
      </div>
    </section>
  );
}
