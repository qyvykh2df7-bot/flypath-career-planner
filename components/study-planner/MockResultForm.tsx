"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MockResult, StudySubject } from "@/lib/study-planner/types";
import { createPlannerId, formatDateLocal } from "@/lib/study-planner/calculations";

type MockResultFormProps = {
  subjects: StudySubject[];
  onAddMockResult: (mock: MockResult) => void;
};

export function MockResultForm({ subjects, onAddMockResult }: MockResultFormProps) {
  const [date, setDate] = useState(() => formatDateLocal(new Date()));
  const [subjectId, setSubjectId] = useState("");
  const [score, setScore] = useState("");
  const [bank, setBank] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [notes, setNotes] = useState("");
  const [showExtras, setShowExtras] = useState(false);
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

    if (score.trim() === "") {
      setError("Introduce el resultado del simulacro de examen.");
      return;
    }

    const parsedScore = parseFloat(score.replace(",", "."));
    if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      setError("La nota debe estar entre 0 y 100.");
      return;
    }

    const h = Math.max(0, parseInt(hours, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    const durationMinutes = h * 60 + m;

    onAddMockResult({
      id: createPlannerId(),
      date,
      subjectId,
      score: Math.round(parsedScore * 10) / 10,
      bank: bank.trim() || undefined,
      durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
      notes: notes.trim() || undefined,
    });

    setScore("");
    setBank("");
    setHours("0");
    setMinutes("0");
    setNotes("");
    setShowExtras(false);
    setFeedback("Simulacro de examen guardado");
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const fieldClass =
    "mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";
  const labelClass = "text-[12px] font-semibold text-slate-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm ring-1 ring-slate-100/80"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
        </label>
        <label className="block">
          <span className={labelClass}>Resultado %</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className={fieldClass}
            placeholder="Ej. 78"
            required
          />
        </label>
        <label className="block sm:col-span-2">
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
        <label className="block sm:col-span-2">
          <span className={labelClass}>Banco/plataforma usada (opcional)</span>
          <input
            type="text"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className={fieldClass}
            placeholder="Ej. Bristol, ATPL Questions, AviationExam…"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setShowExtras((v) => !v)}
        className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200/90 bg-slate-50/60 px-2.5 py-1.5 text-left text-[13px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        aria-expanded={showExtras}
      >
        Duración y notas (opcional)
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${showExtras ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {showExtras ? (
        <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
          <fieldset>
            <legend className={labelClass}>Duración</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[13px] text-slate-500">Horas</span>
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
                <span className="text-[13px] text-slate-500">Minutos</span>
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
          <label className="block">
            <span className={labelClass}>Notas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${fieldClass} min-h-[52px] resize-y`}
              placeholder="Observaciones del simulacro de examen…"
            />
          </label>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-[13px] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="mt-2 text-[13px] font-medium text-emerald-700" role="status">
          {feedback}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-2.5 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-[#c9a454] bg-[#c9a454] px-4 py-2 text-[13px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
      >
        Guardar simulacro de examen
      </button>
    </form>
  );
}
