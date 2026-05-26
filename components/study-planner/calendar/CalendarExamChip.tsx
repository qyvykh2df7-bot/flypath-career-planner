"use client";

import type { ExamDate } from "@/lib/study-planner/types";
import { formatExamCalendarLabel } from "@/lib/study-planner/calendar/exams-by-date";

type CalendarExamChipProps = {
  exam: ExamDate;
  onSelect?: (exam: ExamDate) => void;
  compact?: boolean;
};

export function CalendarExamChip({ exam, onSelect, compact = false }: CalendarExamChipProps) {
  const label = formatExamCalendarLabel(exam.subjectId);

  return (
    <button
      type="button"
      data-calendar-exam
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(exam);
      }}
      className={`w-full rounded-md bg-[#7a2e2e]/10 text-left ring-1 ring-[#b45353]/25 transition-colors hover:bg-[#7a2e2e]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b45353]/35 ${
        compact ? "px-1 py-0.5 text-[9px] font-semibold leading-tight text-[#7a2e2e]" : "px-1.5 py-1 text-[11px] font-semibold leading-snug text-[#7a2e2e]"
      }`}
      title={label}
    >
      <span className="line-clamp-2">{label}</span>
    </button>
  );
}
