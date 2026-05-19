"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { ExamDate, StudySubject } from "@/lib/study-planner/types";
import {
  createPlannerId,
  formatDaysRemaining,
  formatExamDisplayDate,
  getDaysUntilDate,
  getNextUpcomingExam,
  getTodayDateString,
  sortExamDatesByDateAsc,
} from "@/lib/study-planner/calculations";
import { plannerBtnGhost } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";

type ExamDatesPanelProps = {
  subjects: StudySubject[];
  examDates: ExamDate[];
  onAddExamDate: (exam: ExamDate) => void;
  onDeleteExamDate: (id: string) => void;
};

export function ExamDatesPanel({
  subjects,
  examDates,
  onAddExamDate,
  onDeleteExamDate,
}: ExamDatesPanelProps) {
  const today = getTodayDateString();
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
  }, [subjects, subjectId]);

  const sorted = sortExamDatesByDateAsc(examDates);
  const upcoming = sorted.filter((e) => e.date >= today);
  const next = getNextUpcomingExam(examDates, today);
  const listPreview = upcoming.slice(0, 4);
  const hasUpcoming = upcoming.length > 0;

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!subjectId) {
      setError("Selecciona una asignatura.");
      return;
    }
    onAddExamDate({
      id: createPlannerId(),
      subjectId,
      date,
      notes: notes.trim() || undefined,
    });
    setNotes("");
    setShowForm(false);
  };

  const openForm = () => setShowForm(true);

  if (!hasUpcoming && !showForm) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/90 bg-slate-50/60 px-3 py-2.5">
        <p className="text-[13px] text-slate-600">Sin fechas de examen configuradas</p>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#c9a454]/40 bg-[#fff8e8] px-2.5 py-1 text-[12px] font-semibold text-[#7a5a16] transition hover:bg-[#fff3dc]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Añadir fecha
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-100/80">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-[#0f1a33]">Fechas de examen</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Prioriza lo más urgente sin mezclarlo con el calendario de estudio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c9a454]/40 bg-[#fff8e8] px-3 py-1.5 text-[12px] font-semibold text-[#7a5a16] transition hover:bg-[#fff3dc]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Añadir fecha de examen
        </button>
      </div>

      {next ? (
        <div className="mt-3 rounded-lg border border-[#c9a454]/30 bg-gradient-to-r from-[#fffdf8] to-white px-3 py-2.5 ring-1 ring-[#c9a454]/15">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
            Próximo examen
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#0f1a33]">
            {getSubjectById(next.subjectId)?.name ?? next.subjectId}
            <span className="font-normal text-slate-600">
              {" "}
              · {formatExamDisplayDate(next.date)} ·{" "}
              {formatDaysRemaining(getDaysUntilDate(next.date, today))}
            </span>
          </p>
        </div>
      ) : null}

      {listPreview.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {listPreview.map((exam) => {
            const name = getSubjectById(exam.subjectId)?.name ?? exam.subjectId;
            const days = getDaysUntilDate(exam.date, today);
            const isNext = next?.id === exam.id;
            return (
              <li
                key={exam.id}
                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] ${
                  isNext ? "bg-[#fff8e8]/80" : "bg-slate-50/80"
                }`}
              >
                <span className="min-w-0 truncate text-slate-700">
                  <span className="font-medium text-[#0f1a33]">{name}</span>
                  <span className="text-slate-500">
                    {" "}
                    · {formatExamDisplayDate(exam.date)} · {formatDaysRemaining(days)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteExamDate(exam.id)}
                  className={`${plannerBtnGhost} shrink-0 px-2 py-1 text-[11px]`}
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-3 border-t border-slate-100 pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-[12px] font-semibold text-slate-600">
              Asignatura
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={fieldClass} required>
                <option value="">Seleccionar…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-semibold text-slate-600">
              Fecha
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
            </label>
          </div>
          {error ? (
            <p className="mt-2 text-[12px] font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c9a454] bg-[#c9a454] px-4 py-2 text-[13px] font-semibold text-[#0f1a33]"
          >
            Guardar fecha
          </button>
        </form>
      ) : null}
    </section>
  );
}
