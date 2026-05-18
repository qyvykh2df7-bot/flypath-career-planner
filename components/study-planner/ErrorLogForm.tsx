"use client";

import { useEffect, useState } from "react";
import type { ErrorLogItem, ErrorLogType, StudySubject } from "@/lib/study-planner/types";
import { createPlannerId, formatDateLocal } from "@/lib/study-planner/calculations";
import { ERROR_LOG_TYPE_OPTIONS } from "@/lib/study-planner/labels";

type ErrorLogFormProps = {
  subjects: StudySubject[];
  onAddErrorLogItem: (item: ErrorLogItem) => void;
};

export function ErrorLogForm({ subjects, onAddErrorLogItem }: ErrorLogFormProps) {
  const [date, setDate] = useState(() => formatDateLocal(new Date()));
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState<ErrorLogType>("concept");
  const [description, setDescription] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
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
    if (!topic.trim()) {
      setError("El tema es obligatorio.");
      return;
    }
    if (!description.trim()) {
      setError("La descripción del error es obligatoria.");
      return;
    }

    onAddErrorLogItem({
      id: createPlannerId(),
      date,
      subjectId,
      topic: topic.trim(),
      type,
      description: description.trim(),
      correctiveAction: correctiveAction.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "pending",
    });

    setTopic("");
    setDescription("");
    setCorrectiveAction("");
    setNotes("");
    setFeedback("Error registrado");
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
          <span className="text-[13px] font-semibold text-slate-600">Tipo de error</span>
          <select value={type} onChange={(e) => setType(e.target.value as ErrorLogType)} className={fieldClass} required>
            {ERROR_LOG_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
          <span className="text-[13px] font-semibold text-slate-600">Tema</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={fieldClass}
            placeholder="Ej. VOR, factor de carga, conversión de unidades…"
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-600">Descripción del error</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${fieldClass} min-h-[88px] resize-y`}
            placeholder="Qué fallaste y por qué crees que ocurrió…"
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-600">Acción correctiva (opcional)</span>
          <textarea
            value={correctiveAction}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            rows={2}
            className={`${fieldClass} min-h-[72px] resize-y`}
            placeholder="Qué harás para no repetirlo…"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[13px] font-semibold text-slate-600">Notas (opcional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${fieldClass} min-h-[72px] resize-y`}
            placeholder="Referencia de pregunta, mock, etc."
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
        Registrar error
      </button>
    </form>
  );
}
