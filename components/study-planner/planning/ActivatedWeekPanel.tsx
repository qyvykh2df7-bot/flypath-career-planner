"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import { getPlannerMetrics, minutesToHoursLabel } from "@/lib/study-planner/calculations";
import { formatWeekRange } from "@/lib/study-planner/date-utils";
import { ClearWeekConfirmDialog } from "./ClearWeekConfirmDialog";

type ActivatedWeekPanelProps = {
  visibleWeekStartDate: string;
  weekPlanned: PlannedStudySession[];
  onRegenerate: () => void;
  onAddManual: () => void;
  onClearWeek: () => void;
};

function WeekStatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-1 rounded-lg bg-slate-50/90 px-2 py-0.5 transition-[background-color] duration-200">
      <span className="text-[13px] font-medium tabular-nums tracking-tight text-[#0f1a33]">
        {value}
      </span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

const panelBtnSecondary =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200/50 bg-white/90 px-2.5 py-1.5 text-[12px] font-medium text-slate-700 shadow-[0_2px_10px_-6px_rgba(15,26,51,0.08)] transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:border-slate-200/80 hover:bg-white hover:shadow-[0_4px_14px_-8px_rgba(15,26,51,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea8]/20";

const panelBtnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg border border-[#c9a454]/30 bg-[#fff8e8]/90 px-2.5 py-1.5 text-[12px] font-medium text-[#0f1a33] shadow-[0_4px_14px_-8px_rgba(201,164,84,0.28)] transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:border-[#c9a454]/45 hover:bg-[#fff3d6] hover:shadow-[0_6px_16px_-8px_rgba(201,164,84,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/25";

const panelBtnDestructive =
  "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-red-700/85 transition-[background-color,color] duration-300 ease-out hover:bg-red-50/80 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/60";

export function ActivatedWeekPanel({
  visibleWeekStartDate,
  weekPlanned,
  onRegenerate,
  onAddManual,
  onClearWeek,
}: ActivatedWeekPanelProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const metrics = useMemo(
    () => getPlannerMetrics(weekPlanned, { weekStartDate: visibleWeekStartDate }),
    [weekPlanned, visibleWeekStartDate],
  );

  const blockCount = metrics.totalPlannedSessions;
  const dayCount = new Set(weekPlanned.map((p) => p.date)).size;
  const hoursLabel = minutesToHoursLabel(metrics.totalPlannedMinutes);
  const completedCount = metrics.completedSessions;
  const skippedCount = metrics.skippedSessions;
  const pendingPlannedCount = metrics.pendingLikeCount;
  const weekLabel = formatWeekRange(visibleWeekStartDate);

  const handleConfirmClear = () => {
    onClearWeek();
    setClearDialogOpen(false);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_-18px_rgba(15,26,51,0.12)] ring-1 ring-slate-200/40 transition-[box-shadow] duration-300">
        <div className="bg-gradient-to-r from-slate-50/70 via-white to-white px-3 py-2 sm:px-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a454]/90"
                  aria-hidden
                />
                <p className="text-[12px] font-medium text-slate-500">Semana activa</p>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-[15px] font-medium tracking-tight text-[#0f1a33]">
                  {weekLabel}
                </p>
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  ·
                </span>
                <p className="flex items-center gap-1 text-[11px] text-slate-500 sm:inline-flex">
                  <CalendarRange className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                  Control de la semana visible
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
              <button type="button" onClick={onRegenerate} className={panelBtnSecondary}>
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                Regenerar semana
              </button>
              <button type="button" onClick={onAddManual} className={panelBtnPrimary}>
                <Plus className="h-3.5 w-3.5 text-[#9a7a2e]" aria-hidden />
                Añadir sesión manual
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-slate-100/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3.5">
          <div className="flex min-w-0 flex-wrap gap-1">
            <WeekStatChip value={String(blockCount)} label="bloques" />
            <WeekStatChip value={hoursLabel} label="horas" />
            <WeekStatChip
              value={String(dayCount)}
              label={dayCount === 1 ? "día" : "días"}
            />
            <WeekStatChip value={String(completedCount)} label="hechas" />
            {pendingPlannedCount > 0 ? (
              <WeekStatChip value={String(pendingPlannedCount)} label="pendientes" />
            ) : null}
            {skippedCount > 0 ? (
              <WeekStatChip value={String(skippedCount)} label="saltadas" />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setClearDialogOpen(true)}
            className={`${panelBtnDestructive} self-start sm:self-center`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Vaciar calendario semanal
          </button>
        </div>
      </section>

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
