"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import { getPlannerMetrics, minutesToHoursLabel } from "@/lib/study-planner/calculations";
import { formatWeekRange } from "@/lib/study-planner/date-utils";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { ClearWeekConfirmDialog } from "./ClearWeekConfirmDialog";

type ActivatedWeekPanelProps = {
  visibleWeekStartDate: string;
  weekPlanned: PlannedStudySession[];
  onRegenerate: () => void;
  onAddManual: () => void;
  onClearWeek: () => void;
};

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
      <section className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 to-[#fffdf8] px-4 py-3.5 shadow-sm ring-1 ring-emerald-100/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/90">
              Semana activada
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#0f1a33]">
              {blockCount} bloques · {hoursLabel} · {dayCount} día{dayCount === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-[13px] text-slate-600">
              {completedCount} completado{completedCount === 1 ? "" : "s"}
              {skippedCount > 0
                ? ` · ${skippedCount} saltada${skippedCount === 1 ? "" : "s"}`
                : ""}
              {pendingPlannedCount > 0
                ? ` · ${pendingPlannedCount} pendiente${pendingPlannedCount === 1 ? "" : "s"}`
                : ""}{" "}
              · {weekLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              className={`${plannerBtnGhost} inline-flex items-center gap-1.5 text-[12px]`}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Regenerar semana
            </button>
            <button
              type="button"
              onClick={onAddManual}
              className={`${plannerBtnGhost} inline-flex items-center gap-1.5 text-[12px]`}
            >
              <Plus className="h-3.5 w-3.5 text-[#c9a454]" aria-hidden />
              Añadir sesión manual
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setClearDialogOpen(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-red-800/90 underline-offset-2 hover:text-red-900 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Vaciar calendario semanal
        </button>
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
