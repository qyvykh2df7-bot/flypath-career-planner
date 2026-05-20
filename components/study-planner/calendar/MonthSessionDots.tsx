"use client";

import type { PlannedStudySession } from "@/lib/study-planner/types";
import { comparePlannedByStartTime } from "@/lib/study-planner/calculations";
import { getSessionTypeDotClass } from "@/lib/study-planner/session-type-visual";

const MAX_DOTS = 5;

type MonthSessionDotsProps = {
  sessions: PlannedStudySession[];
};

export function MonthSessionDots({ sessions }: MonthSessionDotsProps) {
  const sorted = [...sessions].sort(comparePlannedByStartTime).slice(0, MAX_DOTS);
  const overflow = sessions.length - sorted.length;

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-px" aria-hidden>
      {sorted.map((s) => (
        <span
          key={s.id}
          className={`h-1 w-1 rounded-full ${getSessionTypeDotClass(s.type)} ${
            s.status === "completed" ? "opacity-40" : "opacity-90"
          }`}
        />
      ))}
      {overflow > 0 ? (
        <span className="text-[8px] font-medium text-slate-400">+{overflow}</span>
      ) : null}
    </div>
  );
}
