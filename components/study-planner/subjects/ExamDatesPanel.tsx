"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
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
  openFormRequestKey?: number;
};

export function ExamDatesPanel({
  subjects,
  examDates,
  onAddExamDate,
  onDeleteExamDate,
  openFormRequestKey = 0,
}: ExamDatesPanelProps) {
  const today = getTodayDateString();
  const panelRef = useRef<HTMLElement>(null);
  const subjectSelectRef = useRef<HTMLSelectElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (openFormRequestKey <= 0) return;
    setShowForm(true);
    const timer = window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      subjectSelectRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [openFormRequestKey]);

  const sorted = sortExamDatesByDateAsc(examDates);
  const upcoming = sorted.filter((e) => e.date >= today);
  const next = getNextUpcomingExam(examDates, today);
  const restUpcoming = next ? upcoming.filter((e) => e.id !== next.id) : upcoming;
  const listToShow = listExpanded ? restUpcoming : restUpcoming.slice(0, 2);
  const hiddenCount = Math.max(0, restUpcoming.length - listToShow.length);

  const fieldClass =
    "h-8 w-full min-w-0 rounded-md bg-white/90 px-2 text-[12px] text-[#0f1a33] ring-1 ring-slate-200/50 focus:ring-[#c9a454]/30 focus:outline-none";

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

  return (
    <section
      ref={panelRef}
      id="exam-dates-panel"
      className="overflow-hidden rounded-xl bg-white/90 ring-1 ring-slate-200/25"
    >
      <div className="px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {next ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-gradient-to-r from-[#fff9ee]/90 to-transparent px-2 py-1 ring-1 ring-[#c9a454]/12">
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[#7a5a16]/90">
                Próximo examen
              </span>
              <p className="min-w-0 truncate text-[12px] font-medium text-[#0f1a33]">
                {getSubjectById(next.subjectId)?.name ?? next.subjectId}
                <span className="font-normal text-slate-500">
                  {" "}
                  · {formatExamDisplayDate(next.date)} ·{" "}
                  {formatDaysRemaining(getDaysUntilDate(next.date, today))}
                </span>
              </p>
            </div>
          ) : (
            <p className="min-w-0 flex-1 text-[12px] text-slate-500">
              Sin fechas de examen configuradas
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#7a5a16] transition hover:bg-[#fff8e8]/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a454]/35"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Añadir fecha
            <ChevronDown
              className={`h-3 w-3 opacity-60 transition-transform ${showForm ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out ${
            showForm ? "mt-2 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <form
              onSubmit={handleSubmit}
              className="rounded-md bg-[#fffdf8]/60 px-2 py-1.5 ring-1 ring-[#c9a454]/10"
            >
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[min(100%,10rem)] flex-1 text-[10px] font-medium text-slate-500">
                  Asignatura
                  <select
                    ref={subjectSelectRef}
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
                <label className="w-full min-w-[8.5rem] flex-1 text-[10px] font-medium text-slate-500 sm:max-w-[9.5rem] sm:flex-none">
                  Fecha
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[#c9a454] px-3 text-[11px] font-semibold text-[#0f1a33] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a454]/40"
                >
                  Guardar
                </button>
              </div>
              {error ? (
                <p className="mt-1 text-[10px] font-medium text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      {restUpcoming.length > 0 ? (
        <div className="border-t border-slate-100/80 px-2 pb-1.5 pt-0.5">
          <ul className="space-y-0.5">
            {listToShow.map((exam) => {
              const name = getSubjectById(exam.subjectId)?.name ?? exam.subjectId;
              const days = getDaysUntilDate(exam.date, today);
              return (
                <li
                  key={exam.id}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-0.5 text-[11px] hover:bg-slate-50/70"
                >
                  <span className="min-w-0 truncate text-slate-600">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-slate-400">
                      {" "}
                      · {formatExamDisplayDate(exam.date)} · {formatDaysRemaining(days)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteExamDate(exam.id)}
                    className={`${plannerBtnGhost} shrink-0 px-1 py-0.5 text-[10px]`}
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 || (listExpanded && restUpcoming.length > 2) ? (
            <button
              type="button"
              onClick={() => setListExpanded((v) => !v)}
              className="flex w-full items-center justify-center gap-0.5 py-0.5 text-[10px] font-medium text-slate-500 hover:text-[#7a5a16]"
            >
              {listExpanded ? "Ver menos" : `Ver ${restUpcoming.length} más`}
              <ChevronDown
                className={`h-3 w-3 transition ${listExpanded ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
