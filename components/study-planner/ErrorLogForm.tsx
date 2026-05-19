"use client";

import { useEffect, useState } from "react";
import type { ErrorLogItem, StudySubject } from "@/lib/study-planner/types";
import { createPlannerId, formatDateLocal } from "@/lib/study-planner/calculations";

type ErrorSource = "banco" | "simulacro" | "clase" | "otro";
type ErrorSeverity = "baja" | "media" | "alta";

const SOURCE_OPTIONS: { value: ErrorSource; label: string }[] = [
  { value: "banco", label: "Banco" },
  { value: "simulacro", label: "Simulacro" },
  { value: "clase", label: "Clase" },
  { value: "otro", label: "Otro" },
];

const SEVERITY_OPTIONS: { value: ErrorSeverity; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

const SOURCE_LABELS: Record<ErrorSource, string> = {
  banco: "Banco",
  simulacro: "Simulacro",
  clase: "Clase",
  otro: "Otro",
};

const SEVERITY_LABELS: Record<ErrorSeverity, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

export function formatErrorMeta(source: ErrorSource, severity: ErrorSeverity): string {
  return `Fuente: ${SOURCE_LABELS[source]} · Gravedad: ${SEVERITY_LABELS[severity]}`;
}

export function parseErrorMeta(notes?: string): { source?: string; severity?: string; body?: string } {
  if (!notes) return {};
  const match = notes.match(/^Fuente: ([^·]+) · Gravedad: ([^\n]+)(?:\n([\s\S]*))?$/);
  if (!match) return { body: notes };
  return {
    source: match[1]?.trim(),
    severity: match[2]?.trim(),
    body: match[3]?.trim() || undefined,
  };
}

type ErrorLogFormProps = {
  subjects: StudySubject[];
  onAddErrorLogItem: (item: ErrorLogItem) => void;
};

export function ErrorLogForm({ subjects, onAddErrorLogItem }: ErrorLogFormProps) {
  const [date, setDate] = useState(() => formatDateLocal(new Date()));
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState<ErrorSource>("banco");
  const [severity, setSeverity] = useState<ErrorSeverity>("media");
  const [note, setNote] = useState("");
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
      setError("El tema o concepto es obligatorio.");
      return;
    }
    if (!note.trim()) {
      setError("Añade una nota sobre el error.");
      return;
    }

    const meta = formatErrorMeta(source, severity);
    onAddErrorLogItem({
      id: createPlannerId(),
      date,
      subjectId,
      topic: topic.trim(),
      type: "concept",
      description: note.trim(),
      notes: meta,
      status: "pending",
    });

    setTopic("");
    setNote("");
    setFeedback("Error guardado");
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
        <label className="block">
          <span className={labelClass}>Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
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
          <span className={labelClass}>Tema / concepto</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={fieldClass}
            placeholder="Ej. VOR, factor de carga, conversión de unidades…"
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Fuente</span>
          <select value={source} onChange={(e) => setSource(e.target.value as ErrorSource)} className={fieldClass}>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Gravedad</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as ErrorSeverity)}
            className={fieldClass}
          >
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Nota</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={`${fieldClass} min-h-[72px] resize-y`}
            placeholder="Qué fallaste, por qué y qué harás para corregirlo…"
            required
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
        Guardar error
      </button>
    </form>
  );
}
