"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Sparkles, X } from "lucide-react";
import type {
  ErrorLogItem,
  MockResult,
  PlannedStudySession,
  ReviewItem,
  StudyMode,
  StudySession,
} from "@/lib/study-planner/types";
import {
  getDayShortLabel,
  getTodayDateString,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import {
  formatWeekRange,
  getPlannedSessionsForWeek,
  getWeekKind,
  type WeekKind,
} from "@/lib/study-planner/date-utils";
import { generateWeeklyPlan } from "@/lib/study-planner/planning/planning-engine";
import { buildWeekStrategyNarrative } from "@/lib/study-planner/planning/week-strategy-copy";
import type {
  ApplyPlanMode,
  PlanningEngineInput,
  WeeklyStudyPlan,
} from "@/lib/study-planner/planning/planning-types";
import {
  plannerBtnGhost,
  plannerBtnPrimary,
  plannerFormCard,
  plannerPanelSubtitle,
  plannerSectionHeading,
} from "@/lib/study-planner/planner-ui";
import { PlanPreviewDayAccordion } from "./PlanPreviewDayAccordion";

type WeeklyPlanGeneratorProps = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
  visibleWeekStartDate: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  reviewItems: ReviewItem[];
  errorLogItems: ErrorLogItem[];
  plannedSessions: PlannedStudySession[];
  onApply: (plan: WeeklyStudyPlan, applyMode: ApplyPlanMode) => void;
  onPlanActivated?: () => void;
  /** Modo regenerar: copy más breve. */
  regenerateMode?: boolean;
  onCancelRegenerate?: () => void;
};

function generateButtonLabel(weekKind: WeekKind, regenerate: boolean): string {
  if (regenerate) return "Regenerar plan";
  switch (weekKind) {
    case "current":
      return "Generar plan semanal";
    case "future":
      return "Generar plan para esta semana";
    case "past":
      return "Generar plan semanal";
  }
}

export function WeeklyPlanGenerator({
  mode,
  activeSubjectIds,
  weeklyGoalMinutes,
  targetExamDate,
  studyStartDate,
  visibleWeekStartDate,
  sessions,
  mockResults,
  reviewItems,
  errorLogItems,
  plannedSessions,
  onApply,
  onPlanActivated,
  regenerateMode = false,
  onCancelRegenerate,
}: WeeklyPlanGeneratorProps) {
  const [preview, setPreview] = useState<WeeklyStudyPlan | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [applyMode, setApplyMode] = useState<ApplyPlanMode>("append");

  const today = getTodayDateString();
  const weekKind = getWeekKind(visibleWeekStartDate, today);
  const isPastWeek = weekKind === "past";

  const weekPlanned = useMemo(
    () => getPlannedSessionsForWeek(plannedSessions, visibleWeekStartDate),
    [plannedSessions, visibleWeekStartDate],
  );
  const pendingWeekPlanned = useMemo(
    () => weekPlanned.filter((p) => p.status === "pending" || p.status === "in_progress"),
    [weekPlanned],
  );
  const hasExistingPlanned = pendingWeekPlanned.length > 0;
  const hasManualPending = pendingWeekPlanned.some((p) => p.source === "manual");

  useEffect(() => {
    setPreview(null);
    setWarnings([]);
    setApplyMode("append");
  }, [visibleWeekStartDate]);

  const blocksByDate = useMemo(() => {
    if (!preview) return [];
    const map = new Map<string, typeof preview.blocks>();
    for (const block of preview.blocks) {
      const list = map.get(block.date) ?? [];
      list.push(block);
      map.set(block.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [preview]);

  const strategyNarrative = useMemo(
    () => (preview ? buildWeekStrategyNarrative(preview) : null),
    [preview],
  );

  const previewDayCount = useMemo(() => {
    if (!preview) return 0;
    return new Set(preview.blocks.map((b) => b.date)).size;
  }, [preview]);

  const previewSummaryLine = preview
    ? `${preview.blocks.length} bloques · ${minutesToHoursLabel(preview.totalPlannedMinutes)} · ${previewDayCount} día${previewDayCount === 1 ? "" : "s"}`
    : null;

  const handleGenerate = () => {
    if (isPastWeek) return;

    const input: PlanningEngineInput = {
      mode,
      activeSubjectIds,
      weeklyGoalMinutes,
      targetExamDate,
      studyStartDate,
      weekStartDate: visibleWeekStartDate,
      referenceDate: today,
      sessions,
      mockResults,
      reviewItems,
      errorLogItems,
    };

    const result = generateWeeklyPlan(input);
    const msgs = [...result.warnings.map((w) => w.message)];

    if (hasExistingPlanned && result.plan) {
      msgs.unshift("Ya tienes sesiones planificadas en la semana visible.");
    }

    setWarnings(msgs);

    if (result.plan && result.plan.blocks.length > 0) {
      setPreview(result.plan);
      setApplyMode(
        hasExistingPlanned
          ? hasManualPending
            ? "replace_auto_only"
            : "replace_visible_week"
          : "append",
      );
    } else {
      setPreview(null);
    }
  };

  const handleDiscard = () => {
    setPreview(null);
    setWarnings([]);
    setApplyMode("append");
    if (regenerateMode) onCancelRegenerate?.();
  };

  const handleApply = () => {
    if (!preview) return;
    onApply(preview, applyMode);
    setPreview(null);
    setWarnings([]);
    onPlanActivated?.();
    if (regenerateMode) onCancelRegenerate?.();
  };

  return (
    <section className={plannerFormCard}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#c9a454]" aria-hidden />
            <h3 className={plannerSectionHeading}>
              {regenerateMode ? "Regenerar semana" : "Tu semana, organizada"}
            </h3>
          </div>
          <p className={plannerPanelSubtitle}>
            {regenerateMode
              ? "Genera un nuevo reparto. Puedes reemplazar o añadir a las sesiones actuales."
              : "FlyPath reparte tus horas entre asignaturas activas según progreso, mocks y fecha objetivo."}
            {weekKind !== "current" ? (
              <span className="mt-1 block font-medium text-[#0f1a33]">
                Semana visible: {formatWeekRange(visibleWeekStartDate)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {regenerateMode && !preview ? (
            <button type="button" onClick={onCancelRegenerate} className={plannerBtnGhost}>
              Cancelar
            </button>
          ) : null}
          {!preview && !isPastWeek ? (
            <button type="button" onClick={handleGenerate} className={plannerBtnPrimary}>
              <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden />
              {generateButtonLabel(weekKind, regenerateMode)}
            </button>
          ) : null}
        </div>
      </div>

      {isPastWeek && !preview ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
          No puedes generar planes para semanas pasadas.
        </p>
      ) : null}

      {warnings.length > 0 && !preview ? (
        <ul className="mt-3 space-y-1.5">
          {warnings.map((msg) => (
            <li
              key={msg}
              className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-[13px] text-amber-950"
            >
              {msg}
            </li>
          ))}
        </ul>
      ) : null}

      {preview ? (
        <div className="mt-4 space-y-3 rounded-xl border border-[#c9a454]/25 bg-[#fffdf8] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[14px] font-semibold text-[#0f1a33]">Vista previa</p>
              {previewSummaryLine ? (
                <p className="mt-0.5 text-[13px] font-medium text-[#0f1a33]/90">{previewSummaryLine}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-slate-500 hover:bg-white/80"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Descartar
            </button>
          </div>

          {strategyNarrative ? (
            <div className="rounded-lg border border-[#0f1a33]/10 bg-white/90 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">
                Estrategia de la semana
              </p>
              <p className="mt-1 text-[13px] leading-snug text-slate-700">{strategyNarrative}</p>
            </div>
          ) : null}

          {hasExistingPlanned ? (
            <div className="rounded-lg border border-amber-200/90 bg-white/80 p-2.5">
              <p className="text-[12px] font-medium text-amber-950">
                Ya tienes sesiones en esta semana ({pendingWeekPlanned.length} pendientes).
              </p>
              <fieldset className="mt-2 space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-700">
                  <input
                    type="radio"
                    name="apply-plan-mode"
                    checked={applyMode === "append"}
                    onChange={() => setApplyMode("append")}
                    className="text-[#c9a454]"
                  />
                  Mantener y añadir
                </label>
                {hasManualPending ? (
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-700">
                    <input
                      type="radio"
                      name="apply-plan-mode"
                      checked={applyMode === "replace_auto_only"}
                      onChange={() => setApplyMode("replace_auto_only")}
                      className="text-[#c9a454]"
                    />
                    Reemplazar auto y mantener manuales
                  </label>
                ) : null}
                <label className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-700">
                  <input
                    type="radio"
                    name="apply-plan-mode"
                    checked={applyMode === "replace_visible_week"}
                    onChange={() => setApplyMode("replace_visible_week")}
                    className="text-[#c9a454]"
                  />
                  Reemplazar todas las planificadas
                </label>
              </fieldset>
            </div>
          ) : null}

          <div className="space-y-1.5">
            {blocksByDate.map(([date, blocks], index) => (
              <PlanPreviewDayAccordion
                key={date}
                date={date}
                blocks={blocks}
                defaultOpen={index === 0}
                isToday={date === today}
              />
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#c9a454]/15 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleDiscard} className={plannerBtnGhost}>
              Descartar
            </button>
            <button type="button" onClick={handleApply} className={plannerBtnPrimary}>
              Activar mi semana
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
