"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings2, X } from "lucide-react";
import type { PlannerPlanSettingsPayload, StudyMode } from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import { getSubjectsByMode } from "@/lib/study-planner/subjects";
import {
  plannerBtnGhost,
  plannerBtnPrimary,
  plannerPanelSubtitle,
  plannerPanelTitle,
} from "@/lib/study-planner/planner-ui";
import { StudyModeSelector } from "@/components/study-planner/StudyModeSelector";
import { PlannerSettingsSubjects } from "./PlannerSettingsSubjects";
import { PlannerSettingsDates } from "./PlannerSettingsDates";
import { PlannerSettingsWeeklyGoal } from "./PlannerSettingsWeeklyGoal";

export type PlannerSettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  initial: PlannerPlanSettingsPayload;
  onSave: (payload: PlannerPlanSettingsPayload) => void;
  /** Si true, renderiza el formulario sin overlay (pestaña Configuración). */
  embedded?: boolean;
};

function draftFromInitial(initial: PlannerPlanSettingsPayload) {
  return {
    mode: initial.mode,
    activeSubjectIds: [...initial.activeSubjectIds],
    weeklyHours: Math.round(initial.weeklyGoalMinutes / 60),
    targetExamDate: initial.targetExamDate ?? "",
    useStudyStart: Boolean(initial.studyStartDate),
    studyStartDate: initial.studyStartDate ?? getTodayDateString(),
  };
}

export function PlannerSettingsPanel({
  open,
  onClose,
  initial,
  onSave,
  embedded = false,
}: PlannerSettingsPanelProps) {
  const [draft, setDraft] = useState(() => draftFromInitial(initial));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open || embedded) {
      setDraft(draftFromInitial(initial));
      setError(null);
    }
  }, [open, embedded, initial]);

  const catalogSubjects = useMemo(() => getSubjectsByMode(draft.mode), [draft.mode]);

  const handleModeChange = (next: StudyMode) => {
    setDraft((prev) => ({
      ...prev,
      mode: next,
      activeSubjectIds: getSubjectsByMode(next).map((s) => s.id),
    }));
    setError(null);
  };

  const handleSave = () => {
    if (draft.activeSubjectIds.length === 0) {
      setError("Selecciona al menos una asignatura activa.");
      return;
    }
    if (!draft.targetExamDate) {
      setError("Indica una fecha objetivo global.");
      return;
    }
    const hours = Number(draft.weeklyHours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 80) {
      setError("Las horas semanales deben estar entre 1 y 80.");
      return;
    }

    onSave({
      mode: draft.mode,
      activeSubjectIds: draft.activeSubjectIds,
      weeklyGoalMinutes: Math.round(hours * 60),
      targetExamDate: draft.targetExamDate,
      studyStartDate: draft.useStudyStart ? draft.studyStartDate : undefined,
    });
    if (!embedded) onClose();
  };

  const handleCancel = () => {
    setDraft(draftFromInitial(initial));
    setError(null);
    onClose();
  };

  const form = (
    <div className="flex max-h-[min(85vh,40rem)] flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 shrink-0 text-[#c9a454]" aria-hidden />
            <h2 id="planner-settings-title" className={plannerPanelTitle}>
              Configuración del plan
            </h2>
          </div>
          <p className={plannerPanelSubtitle}>
            Ajusta modo, asignaturas, ritmo y fechas sin repetir el onboarding.
          </p>
        </div>
        {!embedded ? (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0f1a33]"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
        <section className="space-y-2">
          <h3 className="text-[14px] font-semibold text-[#0f1a33]">Modo de estudio</h3>
          <p className="text-[13px] text-slate-500">
            Al cambiar de ATPL a PPL (o viceversa) se activan todas las asignaturas del nuevo modo.
            Los datos del modo anterior se conservan.
          </p>
          <StudyModeSelector mode={draft.mode} onModeChange={handleModeChange} />
        </section>

        <PlannerSettingsSubjects
          subjects={catalogSubjects}
          selectedIds={draft.activeSubjectIds}
          onChange={(ids) => {
            setDraft((prev) => ({ ...prev, activeSubjectIds: ids }));
            setError(null);
          }}
        />

        <PlannerSettingsWeeklyGoal
          weeklyHours={draft.weeklyHours}
          onChange={(hours) => {
            setDraft((prev) => ({ ...prev, weeklyHours: hours }));
            setError(null);
          }}
        />

        <PlannerSettingsDates
          targetExamDate={draft.targetExamDate}
          onTargetExamDateChange={(value) => {
            setDraft((prev) => ({ ...prev, targetExamDate: value }));
            setError(null);
          }}
          useStudyStart={draft.useStudyStart}
          onUseStudyStartChange={(value) =>
            setDraft((prev) => ({ ...prev, useStudyStart: value }))
          }
          studyStartDate={draft.studyStartDate}
          onStudyStartDateChange={(value) =>
            setDraft((prev) => ({ ...prev, studyStartDate: value }))
          }
        />

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-800">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button type="button" onClick={handleCancel} className={plannerBtnGhost}>
          Cancelar
        </button>
        <button type="button" onClick={handleSave} className={plannerBtnPrimary}>
          Guardar cambios
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80">
        {form}
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0f1a33]/40 backdrop-blur-[2px]"
        aria-label="Cerrar configuración"
        onClick={handleCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-settings-title"
        className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl border border-slate-200/90 bg-white shadow-[0_16px_48px_rgba(15,26,51,0.18)] sm:max-h-[90vh] sm:rounded-2xl"
      >
        {form}
      </div>
    </div>
  );
}
