"use client";

import { useEffect, useState } from "react";
import type { StudySession, StudySessionQuality, StudySessionType, StudySubject } from "@/lib/study-planner/types";
import { formatDateLocal } from "@/lib/study-planner/calculations";
import { SESSION_QUALITY_OPTIONS, SESSION_TYPE_OPTIONS } from "@/lib/study-planner/labels";

type StudyLogFormProps = {
  subjects: StudySubject[];
  onAddSession: (session: StudySession) => void;
};

function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function StudyLogForm({ subjects, onAddSession }: StudyLogFormProps) {
  const [date, setDate] = useState(() => formatDateLocal(new Date()));
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<StudySessionType>("theory");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [quality, setQuality] = useState<StudySessionQuality>("good");
  const [notes, setNotes] = useState("");
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
    const durationMinutes = h * 60 + m;

    if (durationMinutes <= 0) {
      setError("La duración debe ser mayor que cero.");
      return;
    }

    onAddSession({
      id: createSessionId(),
      date,
      subjectId,
      type,
      durationMinutes,
      quality,
      notes: notes.trim() || undefined,
    });

    setNotes("");
    setHours("1");
    setMinutes("0");
    setFeedback("Sesión registrada");
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";
  const labelClass = "text-[12px] font-semibold text-slate-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80 sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className={labelClass}>Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <label className="block sm:col-span-1">
          <span className={labelClass}>Asignatura</span>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={fieldClass}
            required
          >
            <option value="">Seleccionar…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Tipo de sesión</span>
          <select value={type} onChange={(e) => setType(e.target.value as StudySessionType)} className={fieldClass}>
            {SESSION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="sm:col-span-2">
          <legend className={labelClass}>Duración</legend>
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
          <span className={labelClass}>Calidad de sesión</span>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as StudySessionQuality)}
            className={fieldClass}
          >
            {SESSION_QUALITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Notas (opcional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${fieldClass} resize-y min-h-[64px]`}
            placeholder="Temas vistos, dudas, mock parcial…"
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
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
      >
        Registrar sesión
      </button>
    </form>
  );
}
