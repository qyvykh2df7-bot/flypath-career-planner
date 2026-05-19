"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Sparkles, X } from "lucide-react";
import type { MockResult, PlannedStudySession, StudyMode, StudySession } from "@/lib/study-planner/types";
import {
  formatShortDate,
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
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
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
import { getSubjectById } from "@/lib/study-planner/subjects";

type WeeklyPlanGeneratorProps = {
  mode: StudyMode;
  activeSubjectIds: string[];
  weeklyGoalMinutes: number;
  targetExamDate?: string;
  studyStartDate?: string;
  visibleWeekStartDate: string;
  sessions: StudySession[];
  mockResults: MockResult[];
  plannedSessions: PlannedStudySession[];
  onApply: (plan: WeeklyStudyPlan, applyMode: ApplyPlanMode) => void;
};

function generateButtonLabel(weekKind: WeekKind): string {
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
  plannedSessions,
  onApply,
}: WeeklyPlanGeneratorProps) {
  const [preview, setPreview] = useState<WeeklyStudyPlan | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [applyMode, setApplyMode] = useState<ApplyPlanMode>("append");
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const today = getTodayDateString();
  const weekKind = getWeekKind(visibleWeekStartDate, today);
  const isPastWeek = weekKind === "past";

  const weekPlanned = useMemo(
    () => getPlannedSessionsForWeek(plannedSessions, visibleWeekStartDate),
    [plannedSessions, visibleWeekStartDate],
  );
  const pendingWeekPlanned = useMemo(
    () => weekPlanned.filter((p) => p.status === "planned"),
    [weekPlanned],
  );
  const hasExistingPlanned = pendingWeekPlanned.length > 0;

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

  const includedSubjectIds = useMemo(() => {
    if (!preview) return [];
    return [...new Set(preview.blocks.map((b) => b.subjectId))];
  }, [preview]);

  const handleGenerate = () => {
    if (isPastWeek) return;

    setAppliedFeedback(null);
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
    };

    const result = generateWeeklyPlan(input);
    const msgs = [...result.warnings.map((w) => w.message)];

    if (hasExistingPlanned && result.plan) {
      msgs.unshift("Ya tienes sesiones planificadas en la semana visible.");
    }

    setWarnings(msgs);

    if (result.plan && result.plan.blocks.length > 0) {
      setPreview(result.plan);
      setApplyMode("append");
    } else {
      setPreview(null);
    }
  };

  const handleDiscard = () => {
    setPreview(null);
    setWarnings([]);
    setApplyMode("append");
  };

  const handleApply = () => {
    if (!preview) return;
    onApply(preview, applyMode);
    setAppliedFeedback(
      applyMode === "replace_visible_week"
        ? "Plan aplicado: se reemplazaron las sesiones planificadas de la semana visible."
        : "Plan aplicado al calendario.",
    );
    setPreview(null);
    setWarnings([]);
    window.setTimeout(() => setAppliedFeedback(null), 3500);
  };

  return (
    <section className={plannerFormCard}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#c9a454]" aria-hidden />
            <h3 className={plannerSectionHeading}>Generador de plan semanal</h3>
          </div>
          <p className={plannerPanelSubtitle}>
            Reparte tus horas entre asignaturas activas según progreso, mocks y fecha objetivo.
            {weekKind !== "current" ? (
              <span className="mt-1 block font-medium text-[#0f1a33]">
                Semana visible: {formatWeekRange(visibleWeekStartDate)}
              </span>
            ) : null}
          </p>
        </div>
        {!preview && !isPastWeek ? (
          <button type="button" onClick={handleGenerate} className={plannerBtnPrimary}>
            <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden />
            {generateButtonLabel(weekKind)}
          </button>
        ) : null}
      </div>

      {isPastWeek && !preview ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
          No puedes generar planes para semanas pasadas.
        </p>
      ) : null}

      {appliedFeedback ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800">
          {appliedFeedback}
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
        <div className="mt-4 space-y-4 rounded-xl border border-[#c9a454]/25 bg-[#fffdf8] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[14px] font-semibold text-[#0f1a33]">Vista previa del plan</p>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {formatWeekRange(preview.weekStartDate)} ·{" "}
                {minutesToHoursLabel(preview.totalPlannedMinutes)} · {preview.blocks.length} bloques ·{" "}
                {includedSubjectIds.length} asignaturas
              </p>
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

          {preview.summaryHints.length > 0 ? (
            <ul className="list-inside list-disc text-[12px] text-slate-600">
              {preview.summaryHints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          ) : null}

          {hasExistingPlanned ? (
            <div className="rounded-lg border border-amber-200/90 bg-white/80 p-3">
              <p className="text-[13px] font-medium text-amber-950">
                Ya tienes sesiones planificadas en la semana visible.
              </p>
              <fieldset className="mt-2 space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                  <input
                    type="radio"
                    name="apply-plan-mode"
                    checked={applyMode === "append"}
                    onChange={() => setApplyMode("append")}
                    className="text-[#c9a454]"
                  />
                  Mantener y añadir nuevas ({pendingWeekPlanned.length} planificadas)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                  <input
                    type="radio"
                    name="apply-plan-mode"
                    checked={applyMode === "replace_visible_week"}
                    onChange={() => setApplyMode("replace_visible_week")}
                    className="text-[#c9a454]"
                  />
                  Reemplazar sesiones planificadas de la semana visible
                </label>
              </fieldset>
            </div>
          ) : null}

          <div className="space-y-3">
            {blocksByDate.map(([date, blocks]) => (
              <div key={date}>
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  {getDayShortLabel(date)} · {formatShortDate(date)}
                </p>
                <ul className="mt-1.5 space-y-2">
                  {blocks.map((block) => {
                    const subjectName =
                      getSubjectById(block.subjectId)?.name ?? block.subjectId;
                    return (
                      <li
                        key={block.id}
                        className="rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[13px]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[#0f1a33]">{subjectName}</span>
                          <span className="tabular-nums text-slate-600">
                            {block.suggestedStartTime} · {block.plannedMinutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600">
                          {getSessionTypeLabel(block.sessionType)} · {block.reasonLabel}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#c9a454]/15 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={handleDiscard} className={plannerBtnGhost}>
              Descartar
            </button>
            <button type="button" onClick={handleApply} className={plannerBtnPrimary}>
              Aplicar al calendario
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
