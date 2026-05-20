"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const calendarPeriodNavShell =
  "inline-flex items-center rounded-xl bg-slate-100/55 p-0.5 shadow-[inset_0_1px_2px_rgba(15,26,51,0.03)]";

export const calendarPeriodNavBtn =
  "inline-flex items-center justify-center rounded-[10px] px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition-[background-color,color,box-shadow] duration-300 ease-out hover:bg-white/90 hover:text-[#0f1a33] hover:shadow-[0_2px_8px_-4px_rgba(15,26,51,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/20";

type CalendarPeriodNavProps = {
  onPrev: () => void;
  onNext: () => void;
  onJumpToCurrent: () => void;
  currentLabel: string;
  currentDisabled?: boolean;
  prevAriaLabel: string;
  nextAriaLabel: string;
};

export function CalendarPeriodNav({
  onPrev,
  onNext,
  onJumpToCurrent,
  currentLabel,
  currentDisabled = false,
  prevAriaLabel,
  nextAriaLabel,
}: CalendarPeriodNavProps) {
  return (
    <div className={calendarPeriodNavShell}>
      <button
        type="button"
        onClick={onPrev}
        className={calendarPeriodNavBtn}
        aria-label={prevAriaLabel}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onJumpToCurrent}
        disabled={currentDisabled}
        className={`${calendarPeriodNavBtn} min-w-[5.5rem] border-x border-slate-200/40 px-3 disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:shadow-none ${
          currentDisabled
            ? "bg-white text-[#0f1a33] shadow-[0_2px_8px_-4px_rgba(15,26,51,0.08)]"
            : ""
        }`}
      >
        {currentLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        className={calendarPeriodNavBtn}
        aria-label={nextAriaLabel}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
