"use client";

import { useEffect, useState } from "react";
import type { ReviewItem, StudySubject } from "@/lib/study-planner/types";
import {
  addDaysToDate,
  createPlannerId,
  getTodayDateString,
} from "@/lib/study-planner/calculations";

type ReviewItemFormProps = {
  subjects: StudySubject[];
  onAddReviewItem: (item: ReviewItem) => void;
};

type IntervalMode = "1" | "3" | "7" | "14" | "custom";

const QUICK_INTERVALS: { mode: IntervalMode; label: string; days: number }[] = [
  { mode: "1", label: "Mañana", days: 1 },
  { mode: "3", label: "En 3 días", days: 3 },
  { mode: "7", label: "En 7 días", days: 7 },
  { mode: "14", label: "En 14 días", days: 14 },
];

export function ReviewItemForm({ subjects, onAddReviewItem }: ReviewItemFormProps) {
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [intervalMode, setIntervalMode] = useState<IntervalMode>("7");
  const [customDueDate, setCustomDueDate] = useState(() => addDaysToDate(getTodayDateString(), 7));
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

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("El tema es obligatorio.");
      return;
    }

    const today = getTodayDateString();
    let dueDate: string;
    let intervalDays: number;

    if (intervalMode === "custom") {
      if (!customDueDate) {
        setError("Selecciona una fecha de repaso.");
        return;
      }
      dueDate = customDueDate;
      const [y, m, d] = today.split("-").map(Number);
      const [dy, dm, dd] = dueDate.split("-").map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(dy, dm - 1, dd);
      intervalDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)),
      );
    } else {
      const quick = QUICK_INTERVALS.find((q) => q.mode === intervalMode);
      intervalDays = quick?.days ?? 7;
      dueDate = addDaysToDate(today, intervalDays);
    }

    onAddReviewItem({
      id: createPlannerId(),
      subjectId,
      topic: trimmedTopic,
      createdAt: today,
      dueDate,
      intervalDays,
      status: "pending",
      notes: notes.trim() || undefined,
    });

    setTopic("");
    setNotes("");
    setFeedback("Repaso creado");
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
          <span className={labelClass}>Tema</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={fieldClass}
            placeholder="Ej. Performance factor, VOR, Mass & Balance…"
            required
          />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className={labelClass}>Fecha de repaso</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_INTERVALS.map((q) => (
              <button
                key={q.mode}
                type="button"
                onClick={() => setIntervalMode(q.mode)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 ${
                  intervalMode === q.mode
                    ? "border-[#c9a454] bg-[#fff8e8] text-[#7a5a16]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#c9a454]/40"
                }`}
              >
                {q.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIntervalMode("custom")}
              className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 ${
                intervalMode === "custom"
                  ? "border-[#c9a454] bg-[#fff8e8] text-[#7a5a16]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#c9a454]/40"
              }`}
            >
              Fecha personalizada
            </button>
          </div>
          {intervalMode === "custom" ? (
            <label className="mt-3 block">
              <span className="text-[13px] text-slate-500">Elegir fecha</span>
              <input
                type="date"
                value={customDueDate}
                onChange={(e) => setCustomDueDate(e.target.value)}
                className={fieldClass}
                required
              />
            </label>
          ) : null}
        </fieldset>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Notas (opcional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${fieldClass} min-h-[64px] resize-y`}
            placeholder="Qué quieres repasar en concreto…"
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
        Crear repaso
      </button>
    </form>
  );
}
