"use client";

import type { StudySubject } from "@/lib/study-planner/types";
import { SubjectSelector } from "@/components/study-planner/onboarding/SubjectSelector";

type PlannerSettingsSubjectsProps = {
  subjects: StudySubject[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function PlannerSettingsSubjects({
  subjects,
  selectedIds,
  onChange,
}: PlannerSettingsSubjectsProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-[14px] font-semibold text-[#0f1a33]">Asignaturas activas</h3>
      <p className="text-[13px] text-slate-500">
        Las asignaturas desactivadas dejan de mostrarse en el plan, pero tus sesiones, simulacros,
        repasos y errores se conservan en el historial.
      </p>
      <SubjectSelector subjects={subjects} selectedIds={selectedIds} onChange={onChange} />
    </section>
  );
}
