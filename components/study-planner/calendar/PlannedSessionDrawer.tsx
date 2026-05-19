"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  PlannedStudySession,
  StudySessionType,
  StudySubject,
} from "@/lib/study-planner/types";
import { createPlannerId } from "@/lib/study-planner/calculations";
import { validatePlannedSessionScheduleDate } from "@/lib/study-planner/planned-session-scheduling";
import { getSessionTypeShortLabel } from "@/lib/study-planner/labels";
import { plannerBtnGhost, plannerBtnPrimary } from "@/lib/study-planner/planner-ui";

const PLANNER_SESSION_TYPES: StudySessionType[] = [
  "theory",
  "question_bank",
  "review",
  "mock",
  "error_correction",
];

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

export type PlannedSessionDrawerMode = "create" | "edit";

type PlannedSessionDrawerProps = {
  open: boolean;
  mode: PlannedSessionDrawerMode;
  initialDate: string;
  today: string;
  subjects: StudySubject[];
  session?: PlannedStudySession | null;
  onClose: () => void;
  onSave: (session: PlannedStudySession) => void;
};

export function PlannedSessionDrawer({
  open,
  mode,
  initialDate,
  today,
  subjects,
  session,
  onClose,
  onSave,
}: PlannedSessionDrawerProps) {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState("09:00");
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<StudySessionType>("theory");
  const [duration, setDuration] = useState(60);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && session) {
      setDate(session.date);
      setStartTime(session.startTime ?? "09:00");
      setSubjectId(session.subjectId);
      setType(session.type);
      setDuration(session.plannedDurationMinutes);
      setGoal(session.goal ?? "");
    } else {
      setDate(initialDate);
      setStartTime("09:00");
      setSubjectId(subjects[0]?.id ?? "");
      setType("theory");
      setDuration(60);
      setGoal("");
    }
    setError(null);
  }, [open, mode, session, initialDate, subjects]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setError("Elige una asignatura.");
      return;
    }
    if (duration <= 0) {
      setError("La duración debe ser mayor que cero.");
      return;
    }

    const scheduleCheck = validatePlannedSessionScheduleDate(date, today);
    if (!scheduleCheck.ok) {
      setError(scheduleCheck.error);
      return;
    }

    const payload: PlannedStudySession = {
      id: mode === "edit" && session ? session.id : createPlannerId(),
      date,
      startTime: startTime.trim() || undefined,
      subjectId,
      type,
      plannedDurationMinutes: duration,
      goal: goal.trim() || undefined,
      status: session?.status ?? "pending",
      completedSessionId: session?.completedSessionId,
      source: mode === "edit" && session ? session.source : "manual",
    };

    onSave(payload);
    onClose();
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[14px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/20";
  const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-[#0f1a33]/30 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 right-0 z-[61] max-h-[min(94vh,640px)] overflow-y-auto rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl sm:left-auto sm:right-0 sm:top-0 sm:max-h-none sm:w-[min(100%,440px)] sm:rounded-none sm:rounded-l-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planned-session-drawer-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-4 backdrop-blur-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">
              {mode === "edit" ? "Editar sesión" : "Nueva sesión"}
            </p>
            <h2 id="planned-session-drawer-title" className="mt-0.5 text-[18px] font-semibold text-[#0f1a33]">
              Planificación manual
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
          <label className="block">
            <span className={labelClass}>Fecha</span>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
              required
            />
          </label>

          <label className="block">
            <span className={labelClass}>Hora</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={fieldClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Asignatura</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass} required>
              <option value="">Seleccionar…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className={labelClass}>Tipo</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PLANNER_SESSION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition ring-1 ${
                    type === t
                      ? "bg-[#0f1a33] text-white ring-[#0f1a33]"
                      : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                  }`}
                >
                  {getSessionTypeShortLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>Duración</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-semibold tabular-nums ring-1 ${
                    duration === m
                      ? "bg-[#c9a454]/15 text-[#7a5a16] ring-[#c9a454]/40"
                      : "bg-white text-slate-600 ring-slate-200"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <input
              type="number"
              min={15}
              max={300}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className={`${fieldClass} mt-2`}
            />
          </div>

          <label className="block">
            <span className={labelClass}>Notas / objetivo</span>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className={`${fieldClass} min-h-[72px] resize-y`}
              placeholder="Qué quieres conseguir en esta sesión…"
            />
          </label>

          {error ? (
            <p className="text-[13px] font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={plannerBtnGhost}>
              Cancelar
            </button>
            <button type="submit" className={plannerBtnPrimary}>
              Guardar
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
