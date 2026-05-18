"use client";

import { useEffect, useState } from "react";
import type { ExamDate, StudySubject } from "@/lib/study-planner/types";
import {
  createPlannerId,
  formatDaysRemaining,
  formatExamDisplayDate,
  getDaysUntilDate,
  getTodayDateString,
  sortExamDatesByDateAsc,
} from "@/lib/study-planner/calculations";
import { plannerBtnGhost, plannerEmptyState, plannerFormCard } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type ExamDateSettingsProps = {
  subjects: StudySubject[];
  examDates: ExamDate[];
  onAddExamDate: (exam: ExamDate) => void;
  onDeleteExamDate: (id: string) => void;
};

export function ExamDateSettings({
  subjects,
  examDates,
  onAddExamDate,
  onDeleteExamDate,
}: ExamDateSettingsProps) {
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(() => getTodayDateString());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
  }, [subjects, subjectId]);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";
  const labelClass = "text-[13px] font-semibold text-slate-600";

  const sorted = sortExamDatesByDateAsc(examDates);
  const today = getTodayDateString();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (!subjectId) {
      setError("Selecciona una asignatura.");
      return;
    }
    if (!date) {
      setError("Indica la fecha del examen.");
      return;
    }

    onAddExamDate({
      id: createPlannerId(),
      subjectId,
      date,
      notes: notes.trim() || undefined,
    });

    setNotes("");
    setFeedback("Fecha guardada");
    window.setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold text-[#0f1a33]">Fechas de examen</h3>
        <p className="mt-0.5 text-[13px] text-slate-600">
          Añade tus próximas fechas para que el dashboard pueda priorizar lo más urgente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={plannerFormCard}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
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
          <label className="block">
            <span className={labelClass}>Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Nota opcional</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. segunda convocatoria"
              className={fieldClass}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-2 text-[13px] font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {feedback ? (
          <p className="mt-2 text-[13px] font-medium text-emerald-700">{feedback}</p>
        ) : null}

        <button
          type="submit"
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 sm:w-auto"
        >
          Guardar fecha
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className={plannerEmptyState}>Aún no has configurado fechas de examen.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((exam) => {
            const subjectName = getSubjectById(exam.subjectId)?.name ?? exam.subjectId;
            const daysLeft = getDaysUntilDate(exam.date, today);
            const isPast = daysLeft < 0;

            return (
              <li
                key={exam.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#0f1a33]">{subjectName}</p>
                  <p className="mt-0.5 text-[13px] text-slate-600">
                    {formatExamDisplayDate(exam.date)} · {formatDaysRemaining(daysLeft)}
                  </p>
                  {exam.notes ? (
                    <p className="mt-1 text-[12px] text-slate-500">{exam.notes}</p>
                  ) : null}
                  {isPast ? (
                    <p className="mt-1 text-[12px] font-medium text-amber-800">Fecha pasada</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteExamDate(exam.id)}
                  className={`${plannerBtnGhost} shrink-0 self-start sm:self-center`}
                >
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
