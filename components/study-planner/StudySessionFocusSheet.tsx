"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Clock, X } from "lucide-react";
import type { PlannedStudySession, StudySession } from "@/lib/study-planner/types";
import {
  createPlannerId,
  formatShortDate,
  getDayShortLabel,
  minutesToHoursLabel,
} from "@/lib/study-planner/calculations";
import type { SessionFocusContext } from "@/lib/study-planner/calendar/session-focus-context";
import { getSessionTypeLabel, getSessionTypeShortLabel } from "@/lib/study-planner/labels";
import { plannerBtnGhost, plannerBtnPrimary } from "@/lib/study-planner/planner-ui";
import { getSubjectById } from "@/lib/study-planner/subjects";
import { SessionTypeBadge } from "./SessionTypeBadge";
import { SessionSourceBadge } from "./calendar/SessionSourceBadge";
import { SessionStatusBadge } from "./calendar/SessionStatusBadge";

type StudySessionFocusSheetProps = {
  session: PlannedStudySession | null;
  focusContext?: SessionFocusContext | null;
  onClose: () => void;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  /** Reservado: registrar en bitácora sin completar la sesión planificada (UI oculta hasta implementar). */
  onLogStudy?: (session: StudySession) => void;
  onEdit?: (session: PlannedStudySession) => void;
  onDelete?: (id: string) => void;
  onSelectRelated?: (session: PlannedStudySession) => void;
};

/** Payload para bitácora sin marcar la sesión planificada (uso futuro). */
export function buildLogStudySessionFromPlanned(planned: PlannedStudySession): StudySession {
  return {
    id: createPlannerId(),
    date: planned.date,
    subjectId: planned.subjectId,
    type: planned.type,
    durationMinutes: planned.plannedDurationMinutes,
    quality: "good",
    notes: planned.goal,
  };
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function StudySessionFocusSheet({
  session,
  focusContext,
  onClose,
  onComplete,
  onSkip,
  onLogStudy: _onLogStudy,
  onEdit,
  onDelete,
  onSelectRelated,
}: StudySessionFocusSheetProps) {
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!session) {
      setTimerRunning(false);
      setElapsedSec(0);
      setTimerOpen(false);
    }
  }, [session]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [session, onClose]);

  if (!session) return null;

  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  const isPending = session.status === "pending" || session.status === "in_progress";
  const plannedLabel = minutesToHoursLabel(session.plannedDurationMinutes);

  const handleComplete = () => {
    onComplete(session.id);
    onClose();
  };

  const handleSkip = () => {
    onSkip(session.id);
    onClose();
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm("¿Eliminar esta sesión planificada?")) {
      onDelete(session.id);
      onClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-[#0f1a33]/35 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[min(92vh,640px)] flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-white shadow-2xl sm:left-auto sm:right-0 sm:top-0 sm:max-h-none sm:w-[min(100%,420px)] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-session-focus-title"
        data-planned-session-id={session.id}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a5a16]">
                Sesión planificada
              </p>
              <h2
                id="study-session-focus-title"
                className="mt-0.5 text-[18px] font-semibold leading-tight text-[#0f1a33]"
              >
                {subjectName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <SessionTypeBadge type={session.type} />
                <SessionSourceBadge source={session.source} />
                <SessionStatusBadge session={session} />
              </div>
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

          <p className="mt-2 text-[13px] text-slate-600">
            {getSessionTypeShortLabel(session.type)} · {plannedLabel} ·{" "}
            {session.startTime ?? "sin hora"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {focusContext ? (
            <section className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
              {focusContext.lastStudyLabel ? (
                <p className="text-[12px] text-slate-600">{focusContext.lastStudyLabel}</p>
              ) : (
                <p className="text-[12px] text-slate-500">Sin sesiones registradas aún en esta asignatura.</p>
              )}
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-medium text-slate-500">Progreso asignatura</span>
                  <span className="font-semibold tabular-nums text-[#0f1a33]">
                    {focusContext.subjectProgressPercent}%
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a454]/90 to-[#ddb75c]/90"
                    style={{ width: `${Math.min(100, focusContext.subjectProgressPercent)}%` }}
                  />
                </div>
              </div>

              {focusContext.relatedSessions.length > 0 ? (
                <div className="mt-3 border-t border-slate-200/80 pt-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Próximas de {subjectName}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {focusContext.relatedSessions.map((rel) => (
                      <li key={rel.id}>
                        <button
                          type="button"
                          onClick={() => onSelectRelated?.(rel)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[12px] text-slate-700 hover:bg-white"
                        >
                          <span>
                            {getDayShortLabel(rel.date)} · {getSessionTypeShortLabel(rel.type)}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px]">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tipo</dt>
              <dd className="mt-0.5 font-medium text-[#0f1a33]">{getSessionTypeLabel(session.type)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Origen</dt>
              <dd className="mt-0.5 font-medium text-[#0f1a33]">
                {session.source === "manual" ? "Manual" : "Auto"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Día</dt>
              <dd className="mt-0.5 font-medium text-[#0f1a33]">
                {getDayShortLabel(session.date)} · {formatShortDate(session.date)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hora</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-[#0f1a33]">
                {session.startTime ?? "Flexible"}
              </dd>
            </div>
          </dl>

          {session.goal ? (
            <div className="mb-4 rounded-lg border border-[#c9a454]/20 bg-[#fffdf8] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7a5a16]">Objetivo</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{session.goal}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {isPending ? (
              <>
                <button type="button" onClick={handleComplete} className={plannerBtnPrimary}>
                  Marcar completada
                </button>
                <button type="button" onClick={handleSkip} className={plannerBtnGhost}>
                  Saltar sesión
                </button>
              </>
            ) : null}
            {onEdit ? (
              <button type="button" onClick={() => onEdit(session)} className={plannerBtnGhost}>
                Editar sesión
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className={`${plannerBtnGhost} text-red-800 hover:bg-red-50`}
              >
                Eliminar
              </button>
            ) : null}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setTimerOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-[12px] font-medium text-slate-600 hover:text-[#0f1a33]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Temporizador
              </span>
              <span className="inline-flex items-center gap-2 tabular-nums text-[#0f1a33]">
                {formatTimer(elapsedSec)}
                <ChevronDown
                  className={`h-4 w-4 transition ${timerOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </span>
            </button>
            {timerOpen ? (
              <button
                type="button"
                onClick={() => setTimerRunning((v) => !v)}
                className={`${plannerBtnGhost} mt-2 w-full text-[12px]`}
              >
                {timerRunning ? "Pausar" : "Iniciar"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={onClose} className={`${plannerBtnGhost} w-full text-slate-600`}>
            Cerrar
          </button>
        </div>
      </aside>
    </>
  );
}
