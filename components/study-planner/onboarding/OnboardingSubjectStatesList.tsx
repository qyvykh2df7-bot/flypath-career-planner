"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DeclaredSubjectStage, InitialSubjectState, StudySubject } from "@/lib/study-planner/types";
import { DECLARED_STAGE_OPTIONS } from "@/lib/study-planner/initial-subject-state";
import { plannerFieldClass, plannerFieldLabel } from "@/lib/study-planner/planner-ui";

type OnboardingSubjectStatesListProps = {
  subjects: StudySubject[];
  states: InitialSubjectState[];
  onChange: (states: InitialSubjectState[]) => void;
};

function updateState(
  states: InitialSubjectState[],
  subjectId: string,
  patch: Partial<InitialSubjectState>,
): InitialSubjectState[] {
  return states.map((s) => (s.subjectId === subjectId ? { ...s, ...patch } : s));
}

export function OnboardingSubjectStatesList({
  subjects,
  states,
  onChange,
}: OnboardingSubjectStatesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/90 bg-white">
      {subjects.map((subject) => {
        const row = states.find((s) => s.subjectId === subject.id);
        const stage = row?.declaredStage ?? "not_started";
        const expanded = expandedId === subject.id;

        return (
          <li key={subject.id} className="px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2 gap-y-1.5 sm:flex-nowrap">
              <p className="min-w-0 flex-1 text-[13px] font-medium text-[#0f1a33]">
                {subject.name}
              </p>
              <select
                value={stage}
                onChange={(e) =>
                  onChange(
                    updateState(states, subject.id, {
                      declaredStage: e.target.value as DeclaredSubjectStage,
                    }),
                  )
                }
                className="max-w-[11rem] shrink-0 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5 text-[12px] font-medium text-[#0f1a33]"
                aria-label={`Estado de ${subject.name}`}
              >
                {DECLARED_STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : subject.id)}
                className="shrink-0 text-[12px] font-semibold text-[#7a5a16] hover:underline"
              >
                {expanded ? "Ocultar detalles" : "Añadir detalles"}
              </button>
            </div>

            {expanded ? (
              <div className="mt-2 grid gap-2 rounded-lg bg-slate-50/80 p-2.5 sm:grid-cols-3">
                <label className={plannerFieldLabel}>
                  Progreso %
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Opcional"
                    value={row?.estimatedProgressPercent ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      onChange(
                        updateState(states, subject.id, {
                          estimatedProgressPercent:
                            v === "" ? undefined : Number(v),
                        }),
                      );
                    }}
                    className={plannerFieldClass}
                  />
                </label>
                <label className={plannerFieldLabel}>
                  Media de simulacros de examen
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Opcional"
                    value={row?.estimatedMockAverage ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      onChange(
                        updateState(states, subject.id, {
                          estimatedMockAverage: v === "" ? undefined : Number(v),
                        }),
                      );
                    }}
                    className={plannerFieldClass}
                  />
                </label>
                <label className={plannerFieldLabel}>
                  Fecha examen
                  <input
                    type="date"
                    value={row?.examDate ?? ""}
                    onChange={(e) =>
                      onChange(
                        updateState(states, subject.id, {
                          examDate: e.target.value || undefined,
                        }),
                      )
                    }
                    className={plannerFieldClass}
                  />
                </label>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
