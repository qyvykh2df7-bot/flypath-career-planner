"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ExamDate } from "@/lib/study-planner/types";
import { formatShortDate } from "@/lib/study-planner/calculations";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type ExamDateInfoSheetProps = {
  exam: ExamDate | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
};

export function ExamDateInfoSheet({ exam, onClose, onDelete }: ExamDateInfoSheetProps) {
  useEffect(() => {
    if (!exam) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exam, onClose]);

  if (!exam) return null;

  const subjectName = getSubjectById(exam.subjectId)?.name ?? exam.subjectId;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0f1a33]/25 p-3 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="exam-sheet-title"
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-[0_16px_48px_-12px_rgba(15,26,51,0.28)] ring-1 ring-slate-200/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a2e2e]">
              Examen
            </p>
            <h4 id="exam-sheet-title" className="mt-0.5 text-[17px] font-semibold text-[#0f1a33]">
              {subjectName}
            </h4>
            <p className="mt-1 text-[14px] text-slate-600">{formatShortDate(exam.date)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {exam.notes ? (
          <p className="mt-3 rounded-lg bg-slate-50/80 px-3 py-2 text-[13px] leading-snug text-slate-600">
            {exam.notes}
          </p>
        ) : null}

        <p className="mt-3 text-[12px] leading-snug text-slate-500">
          Marcador de examen oficial. No es una sesión de estudio ni cuenta para el progreso del
          calendario.
        </p>

        {onDelete ? (
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                onDelete(exam.id);
                onClose();
              }}
              className={`${plannerBtnGhost} text-[13px] text-[#7a2e2e] hover:bg-[#7a2e2e]/8`}
            >
              Quitar fecha de examen
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
