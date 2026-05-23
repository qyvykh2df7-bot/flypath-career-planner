"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { PlannedStudySession, StudySubject } from "@/lib/study-planner/types";
import { PlannedSessionForm } from "../PlannedSessionForm";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";

type ManualSessionPanelProps = {
  subjects: StudySubject[];
  onAddPlannedSession: (planned: PlannedStudySession) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ManualSessionPanel({
  subjects,
  onAddPlannedSession,
  open: controlledOpen,
  onOpenChange,
}: ManualSessionPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const toggleOpen = () => {
    const next = !open;
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  };

  return (
    <section className="rounded-xl border border-dashed border-slate-200/90 bg-white/60">
      <button
        type="button"
        onClick={toggleOpen}
        className={`${plannerBtnGhost} flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-50/80`}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#c9a454]" aria-hidden />
          Añadir sesión manual
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-slate-100 px-3 pb-3 pt-1 sm:px-4">
          <p className="mb-2 text-[13px] text-slate-500">
            Añade bloques puntuales que no entren en el generador automático.
          </p>
          <PlannedSessionForm
            subjects={subjects}
            onAddPlannedSession={onAddPlannedSession}
            onAdded={() => {
              if (onOpenChange) onOpenChange(false);
              else setInternalOpen(false);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
