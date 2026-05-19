"use client";

import { useMemo, useState } from "react";
import type { PlannerOnboardingPayload, StudyMode } from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import { getSubjectsByMode } from "@/lib/study-planner/subjects";
import { plannerFieldClass, plannerFieldLabel } from "@/lib/study-planner/planner-ui";
import { StudyModeSelector } from "@/components/study-planner/StudyModeSelector";
import { PlannerOnboardingStep } from "./PlannerOnboardingStep";
import { OnboardingTargetDateFields } from "./OnboardingTargetDateFields";
import { SubjectSelector } from "./SubjectSelector";

const TOTAL_STEPS = 5;

type PlannerOnboardingProps = {
  onComplete: (payload: PlannerOnboardingPayload) => void;
};

export function PlannerOnboarding({ onComplete }: PlannerOnboardingProps) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<StudyMode>("atpl");
  const [activeSubjectIds, setActiveSubjectIds] = useState<string[]>(() =>
    getSubjectsByMode("atpl").map((s) => s.id),
  );
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [targetExamDate, setTargetExamDate] = useState("");
  const [studyStartDate, setStudyStartDate] = useState(() => getTodayDateString());
  const [useStudyStart, setUseStudyStart] = useState(false);

  const catalogSubjects = useMemo(() => getSubjectsByMode(mode), [mode]);

  const handleModeChange = (next: StudyMode) => {
    setMode(next);
    setActiveSubjectIds(getSubjectsByMode(next).map((s) => s.id));
  };

  const finish = () => {
    onComplete({
      mode,
      activeSubjectIds,
      weeklyGoalMinutes: Math.round(weeklyHours * 60),
      targetExamDate,
      studyStartDate: useStudyStart ? studyStartDate : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_32px_rgba(15,26,51,0.06)] sm:p-8">
        {step === 1 ? (
          <PlannerOnboardingStep
            step={1}
            totalSteps={TOTAL_STEPS}
            title="Elige tu programa"
            description="Adaptamos asignaturas y métricas a tu licencia objetivo."
            onNext={() => setStep(2)}
          >
            <StudyModeSelector mode={mode} onModeChange={handleModeChange} />
          </PlannerOnboardingStep>
        ) : null}

        {step === 2 ? (
          <PlannerOnboardingStep
            step={2}
            totalSteps={TOTAL_STEPS}
            title="Asignaturas activas"
            description="Marca las asignaturas que quieres incluir en tu plan. Puedes cambiarlas más adelante."
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextDisabled={activeSubjectIds.length === 0}
          >
            <SubjectSelector
              subjects={catalogSubjects}
              selectedIds={activeSubjectIds}
              onChange={setActiveSubjectIds}
            />
          </PlannerOnboardingStep>
        ) : null}

        {step === 3 ? (
          <PlannerOnboardingStep
            step={3}
            totalSteps={TOTAL_STEPS}
            title="Horas disponibles por semana"
            description="Un objetivo realista ayuda a medir si vas al ritmo previsto."
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          >
            <label className={plannerFieldLabel}>
              Horas por semana
              <input
                type="number"
                min={1}
                max={80}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className={plannerFieldClass}
              />
            </label>
            <p className="mt-2 text-[13px] text-slate-500">
              Equivale a {weeklyHours} h/semana ({weeklyHours * 60} minutos).
            </p>
          </PlannerOnboardingStep>
        ) : null}

        {step === 4 ? (
          <PlannerOnboardingStep
            step={4}
            totalSteps={TOTAL_STEPS}
            title="Fecha objetivo de estudio"
            description="Elige una fecha aproximada para terminar este bloque de estudio. No tiene que ser tu fecha oficial de examen."
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
            nextDisabled={!targetExamDate}
            nextDisabledHint="Selecciona una fecha para continuar."
          >
            <OnboardingTargetDateFields value={targetExamDate} onChange={setTargetExamDate} />
          </PlannerOnboardingStep>
        ) : null}

        {step === 5 ? (
          <PlannerOnboardingStep
            step={5}
            totalSteps={TOTAL_STEPS}
            title="Inicio del plan (opcional)"
            description="Si ya llevas tiempo estudiando, indica cuándo empezaste para estimar semanas restantes."
            onBack={() => setStep(4)}
            onNext={finish}
            nextLabel="Empezar con mi plan"
          >
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-slate-700">
              <input
                type="checkbox"
                checked={useStudyStart}
                onChange={(e) => setUseStudyStart(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#c9a454]"
              />
              Quiero indicar fecha de inicio
            </label>
            {useStudyStart ? (
              <label className={`${plannerFieldLabel} mt-4 block`}>
                Fecha de inicio
                <input
                  type="date"
                  value={studyStartDate}
                  onChange={(e) => setStudyStartDate(e.target.value)}
                  className={plannerFieldClass}
                />
              </label>
            ) : null}
          </PlannerOnboardingStep>
        ) : null}
      </div>
    </div>
  );
}
