"use client";

import type {
  DeclaredSubjectStage,
  InitialStudyContext,
  InitialSubjectState,
  StudySubject,
} from "@/lib/study-planner/types";
import {
  buildDefaultInitialSubjectStates,
  INITIAL_STUDY_CONTEXT_OPTIONS,
} from "@/lib/study-planner/initial-subject-state";
import { OnboardingSubjectStatesList } from "../onboarding/OnboardingSubjectStatesList";

type PlannerSettingsInitialProgressProps = {
  subjects: StudySubject[];
  activeSubjectIds: string[];
  initialStudyContext: InitialStudyContext | undefined;
  initialSubjectStates: InitialSubjectState[];
  onContextChange: (ctx: InitialStudyContext) => void;
  onStatesChange: (states: InitialSubjectState[]) => void;
};

export function PlannerSettingsInitialProgress({
  subjects,
  activeSubjectIds,
  initialStudyContext,
  initialSubjectStates,
  onContextChange,
  onStatesChange,
}: PlannerSettingsInitialProgressProps) {
  const activeSubjects = subjects.filter((s) => activeSubjectIds.includes(s.id));
  const context = initialStudyContext ?? "from_zero";

  const ensureStatesForActive = (ctx: InitialStudyContext) => {
    const defaults = buildDefaultInitialSubjectStates(activeSubjectIds, ctx);
    const byId = new Map(initialSubjectStates.map((s) => [s.subjectId, s]));
    return defaults.map((d) => byId.get(d.subjectId) ?? d);
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[14px] font-semibold text-[#0f1a33]">Punto de partida</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          Contexto inicial del plan. Los datos reales de registro tienen prioridad cuando existan.
        </p>
      </div>

      <div className="space-y-2">
        {INITIAL_STUDY_CONTEXT_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 ${
              context === opt.value
                ? "border-[#c9a454]/40 bg-[#fff8e8]"
                : "border-slate-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="initialStudyContext"
              checked={context === opt.value}
              onChange={() => {
                onContextChange(opt.value);
                onStatesChange(ensureStatesForActive(opt.value));
              }}
              className="mt-1 h-4 w-4 border-slate-300 text-[#c9a454]"
            />
            <span>
              <span className="block text-[13px] font-medium text-[#0f1a33]">{opt.label}</span>
              <span className="block text-[12px] text-slate-500">{opt.description}</span>
            </span>
          </label>
        ))}
      </div>

      {context !== "from_zero" && activeSubjects.length > 0 ? (
        <OnboardingSubjectStatesList
          subjects={activeSubjects}
          states={
            initialSubjectStates.length > 0
              ? initialSubjectStates.filter((s) => activeSubjectIds.includes(s.subjectId))
              : ensureStatesForActive(context)
          }
          onChange={onStatesChange}
        />
      ) : null}
    </section>
  );
}
