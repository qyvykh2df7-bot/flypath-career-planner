"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import {
  PLANNED_STATUS_LABELS,
  formatShortDate,
  getDayShortLabel,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import { getSessionTypeLabel } from "@/lib/study-planner/labels";
import { plannerBtnGhost, plannerBtnPrimary } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type PlannedSessionActionDrawerProps = {
  session: PlannedStudySession | null;
  onClose: () => void;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PlannedSessionActionDrawer({
  session,
  onClose,
  onComplete,
  onSkip,
  onDelete,
}: PlannedSessionActionDrawerProps) {
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [session, onClose]);

  if (!session) return null;

  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const isPending = session.status === "pending" || session.status === "in_progress";

  const handleComplete = () => {
    onComplete(session.id);
    onClose();
  };

  const handleSkip = () => {
    onSkip(session.id);
    onClose();
  };

  const handleDelete = () => {
    onDelete(session.id);
    onClose();
  };

  return (
  <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-[#0f1a33]/30 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[min(88vh,520px)] overflow-y-auto rounded-t-2xl border border-slate-200/90 bg-white p-4 shadow-2xl sm:left-auto sm:right-0 sm:top-0 sm:max-h-none sm:w-[min(100%,380px)] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planned-session-drawer-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              {getDayShortLabel(session.date)} · {formatShortDate(session.date)}
            </p>
            <h2 id="planned-session-drawer-title" className="mt-0.5 text-[17px] font-semibold text-[#0f1a33]">
              {subjectName}
            </h2>
            <p className="mt-1 text-[13px] text-slate-600">
              {session.startTime ? `${session.startTime} · ` : ""}
              {minutesToHoursLabel(session.plannedDurationMinutes)} · {getSessionTypeLabel(session.type)}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold uppercase text-slate-600">
              {PLANNED_STATUS_LABELS[session.status]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {session.goal ? (
          <p className="mb-4 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-[13px] text-slate-700">
            {session.goal}
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          {isPending ? (
            <>
              <button type="button" onClick={handleComplete} className={plannerBtnPrimary}>
                Completar sesión
              </button>
              <button type="button" onClick={handleSkip} className={plannerBtnGhost}>
                Saltar sesión
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={handleDelete}
            className={`${plannerBtnGhost} text-red-700 hover:border-red-200 hover:bg-red-50`}
          >
            Eliminar del plan
          </button>
        </div>
      </aside>
    </>
  );
}
