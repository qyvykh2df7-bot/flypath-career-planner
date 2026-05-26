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
    <div className="mt-1 flex flex-wrap items-center gap-1" aria-hidden>
      {sorted.map((s) => (
        <span
          key={s.id}
          className={`h-2 w-2 shrink-0 rounded-full ${getSessionTypeDotClass(s.type)} ${
            s.status === "completed" ? "opacity-45" : "opacity-95"
          }`}
        />
      ))}
      {overflow > 0 ? (
        <span className="text-[9px] font-semibold text-slate-500">+{overflow}</span>
      ) : null}
    </div>
  );
}
