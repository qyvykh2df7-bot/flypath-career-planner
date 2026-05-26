"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import { getPlannerMetrics, getTodayDateString } from "@/lib/study-planner/calculations";
import { addWeeks, formatWeekRange, getCurrentWeekStart } from "@/lib/study-planner/date-utils";
import { ClearWeekConfirmDialog } from "../planning/ClearWeekConfirmDialog";
import { CalendarPeriodNav } from "./CalendarPeriodNav";

export type WeekManagementActions = {
  onRegenerate: () => void;
  onClearWeek: () => void;
};

type WeekViewManagementBarProps = {
  visibleWeekStartDate: string;
  weekPlanned: PlannedStudySession[];
  onVisibleWeekStartChange: (weekStart: string) => void;
  weekManagement: WeekManagementActions;
};

const btnSecondary =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-white/90 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 shadow-[0_2px_10px_-6px_rgba(15,26,51,0.08)] transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:border-slate-200/80 hover:bg-white hover:shadow-[0_4px_14px_-8px_rgba(15,26,51,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/20";

const btnDestructiveOutline =
  "inline-flex items-center gap-1.5 rounded-lg border border-red-200/80 bg-white px-2.5 py-1.5 text-[12px] font-medium text-red-700 transition-[background-color,border-color] duration-300 ease-out hover:border-red-300 hover:bg-red-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/60";

export function WeekViewManagementBar({
  visibleWeekStartDate,
  weekPlanned,
  onVisibleWeekStartChange,
  weekManagement,
}: WeekViewManagementBarProps) {
  const today = getTodayDateString();
  const currentWeekStart = getCurrentWeekStart(today);
  const isCurrentWeek = visibleWeekStartDate === currentWeekStart;
  const weekLabel = formatWeekRange(visibleWeekStartDate);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const pendingPlannedCount = useMemo(
    () =>
      getPlannerMetrics(weekPlanned, { weekStartDate: visibleWeekStartDate }).pendingLikeCount,
    [weekPlanned, visibleWeekStartDate],
  );

  const handleConfirmClear = () => {
    weekManagement.onClearWeek();
    setClearDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <p className="text-[16px] font-medium tracking-tight text-[#0f1a33] sm:text-[17px]">
          {weekLabel}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CalendarPeriodNav
            onPrev={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, -1))}
            onNext={() => onVisibleWeekStartChange(addWeeks(visibleWeekStartDate, 1))}
            onJumpToCurrent={() => onVisibleWeekStartChange(currentWeekStart)}
            currentLabel="Esta semana"
            currentDisabled={isCurrentWeek}
            prevAriaLabel="Semana anterior"
            nextAriaLabel="Semana siguiente"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={weekManagement.onRegenerate} className={btnSecondary}>
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              Regenerar semana
            </button>
            <button
              type="button"
              onClick={() => setClearDialogOpen(true)}
              className={btnDestructiveOutline}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Vaciar calendario semanal
            </button>
          </div>
        </div>
      </div>

      <ClearWeekConfirmDialog
        open={clearDialogOpen}
        pendingCount={pendingPlannedCount}
        weekLabel={weekLabel}
        onCancel={() => setClearDialogOpen(false)}
        onConfirm={handleConfirmClear}
      />
    </>
  );
}
