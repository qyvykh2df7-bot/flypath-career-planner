"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, Sparkles } from "lucide-react";
import type {
  ErrorLogItem,
  ExamDate,
  InitialSubjectState,
  MockResult,
  PlannedStudySession,
  ReviewItem,
  StudyMode,
  StudySession,
} from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import {
  formatWeekRange,
  getPlannedSessionsForWeek,
  getWeekKind,
  type WeekKind,
} from "@/lib/study-planner/date-utils";
import { generateWeeklyPlan } from "@/lib/study-planner/planning/planning-engine";
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

type WeeklyPlanGeneratorProps = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  examDates?: ExamDate[];
  initialSubjectStates?: InitialSubjectState[];
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

function resolveApplyMode(hasExistingPlanned: boolean, hasManualPending: boolean): ApplyPlanMode {
  if (!hasExistingPlanned) return "append";
  return hasManualPending ? "replace_auto_only" : "replace_visible_week";
}

export function WeeklyPlanGenerator({
  mode,
  activeSubjectIds,
  weeklyGoalMinutes,
  targetExamDate,
  examDates = [],
  initialSubjectStates = [],
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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setWarnings([]);
    setIsGenerating(false);
  }, [visibleWeekStartDate]);

  const handleGenerate = async () => {
    if (isPastWeek || isGenerating) return;

    setIsGenerating(true);
    setWarnings([]);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 0);
    });

    try {
      const input: PlanningEngineInput = {
        mode,
        activeSubjectIds,
        weeklyGoalMinutes,
        targetExamDate,
        examDates,
        initialSubjectStates,
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

      if (result.plan && result.plan.blocks.length > 0) {
        const applyMode = resolveApplyMode(hasExistingPlanned, hasManualPending);
        onApply(result.plan, applyMode);
        onPlanActivated?.();
        if (regenerateMode) onCancelRegenerate?.();
        return;
      }

      setWarnings(msgs);
    } finally {
      setIsGenerating(false);
    }
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
              ? "Genera un nuevo reparto y se aplicará al calendario al instante."
              : "FlyPath reparte tus horas entre asignaturas activas según progreso, simulacros de examen y fecha objetivo."}
            {weekKind !== "current" ? (
              <span className="mt-1 block font-medium text-[#0f1a33]">
                Semana visible: {formatWeekRange(visibleWeekStartDate)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {regenerateMode ? (
            <button
              type="button"
              onClick={onCancelRegenerate}
              className={plannerBtnGhost}
              disabled={isGenerating}
            >
              Cancelar
            </button>
          ) : null}
          {!isPastWeek ? (
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className={plannerBtnPrimary}
              disabled={isGenerating}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden />
              )}
              {isGenerating ? "Generando…" : generateButtonLabel(weekKind, regenerateMode)}
            </button>
          ) : null}
        </div>
      </div>

      {isPastWeek ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
          No puedes generar planes para semanas pasadas.
        </p>
      ) : null}

      {warnings.length > 0 ? (
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
    </section>
  );
}
