"use client";

import { useEffect, useState } from "react";
import type { PlannedStudySession, StudySessionType, StudySubject } from "@/lib/study-planner/types";
import { createPlannerId, formatDateLocal } from "@/lib/study-planner/calculations";
import { SESSION_TYPE_OPTIONS } from "@/lib/study-planner/labels";

type PlannedSessionFormProps = {
  subjects: StudySubject[];
  onAddPlannedSession: (planned: PlannedStudySession) => void;
};

export function PlannedSessionForm({ subjects, onAddPlannedSession }: PlannedSessionFormProps) {
  const [date, setDate] = useState(() => formatDateLocal(new Date()));
  const [startTime, setStartTime] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<StudySessionType>("theory");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [goal, setGoal] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
  }, [subjects, subjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (!subjectId) {
      setError("Selecciona una asignatura.");
      return;
    }

    const h = Math.max(0, parseInt(hours, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    const plannedDurationMinutes = h * 60 + m;

    if (plannedDurationMinutes <= 0) {
      setError("La duración debe ser mayor que cero.");
      return;
    }

    onAddPlannedSession({
      id: createPlannerId(),
      date,
      startTime: startTime.trim() || undefined,
      subjectId,
      type,
      plannedDurationMinutes,
      goal: goal.trim() || undefined,
      status: "planned",
    });

    setGoal("");
    setStartTime("");
    setHours("1");
    setMinutes("0");
    setFeedback("Sesión planificada");
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[15px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-600">Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-600">Hora de inicio (opcional)</span>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={fieldClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-600">Asignatura</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass} required>
            <option value="">Seleccionar…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-600">Tipo de sesión</span>
          <select value={type} onChange={(e) => setType(e.target.value as StudySessionType)} className={fieldClass}>
            {SESSION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-[13px] font-semibold text-slate-600">Duración prevista</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] text-slate-500">Horas</span>
              <input
                type="number"
                min={0}
                max={24}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-[12px] text-slate-500">Minutos</span>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
        </fieldset>
        <label className="block sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-600">Objetivo de la sesión (opcional)</span>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            className={`${fieldClass} min-h-[72px] resize-y`}
            placeholder="Qué quieres conseguir en esta sesión…"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-[14px] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="mt-3 text-[14px] font-medium text-emerald-700" role="status">
          {feedback}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_8px_24px_rgba(201,164,84,0.3)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
      >
        Planificar sesión
      </button>
    </form>
  );
}
