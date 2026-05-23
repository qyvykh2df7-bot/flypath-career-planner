"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type {
  PlannedStudySession,
  StudySession,
  StudySessionQuality,
  StudySessionType,
  StudySubject,
} from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import { SESSION_QUALITY_OPTIONS, SESSION_TYPE_OPTIONS, getSessionTypeShortLabel } from "@/lib/study-planner/labels";
import { getSubjectById } from "@/lib/study-planner/subjects";
import type { StudyLogIntent, StudyLogMode } from "@/lib/study-planner/study-log-intent";
import { isPendingLikeStatus } from "@/lib/study-planner/planner-session-status";
import {
  getStudyLogSaveFeedback,
  nextPendingIdAfterComplete,
  shouldShowPlanConfirmCard,
  sortTodayPending,
  STUDY_LOG_FEEDBACK,
  STUDY_LOG_FEEDBACK_MS,
} from "@/lib/study-planner/study-log-form-logic";

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

export type StudyLogSavePayload = {
  session: StudySession;
  plannedSessionId?: string;
};

type StudyLogFormProps = {
  subjects: StudySubject[];
  plannedSessions: PlannedStudySession[];
  today?: string;
  intent?: StudyLogIntent | null;
  onSave: (payload: StudyLogSavePayload) => void;
  onIntentConsumed?: () => void;
};

function createSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_DURATION = "45";

function emptyFormFields(today: string) {
  return {
    subjectId: "",
    type: "theory" as StudySessionType,
    durationMinutes: DEFAULT_DURATION,
    quality: "good" as StudySessionQuality,
    notes: "",
    date: today,
    notesOpen: false,
  };
}

function formatPlannedOneLiner(planned: PlannedStudySession): string {
  const subjectName = getSubjectById(planned.subjectId)?.name ?? planned.subjectId;
  return `${subjectName} · ${getSessionTypeShortLabel(planned.type)} · ${planned.plannedDurationMinutes} min`;
}

export function StudyLogForm({
  subjects,
  plannedSessions,
  today = getTodayDateString(),
  intent,
  onSave,
  onIntentConsumed,
}: StudyLogFormProps) {
  const todayPending = useMemo(
    () => sortTodayPending(plannedSessions, today),
    [plannedSessions, today],
  );

  const initialMode: StudyLogMode =
    intent?.mode ??
    (intent?.plannedSessionId || todayPending.length > 0 ? "plan_block" : "free_study");

  const [mode, setMode] = useState<StudyLogMode>(initialMode);
  const [plannedSessionId, setPlannedSessionId] = useState<string>(
    intent?.plannedSessionId ?? todayPending[0]?.id ?? "",
  );
  const [date, setDate] = useState(today);
  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<StudySessionType>("theory");
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION);
  const [quality, setQuality] = useState<StudySessionQuality>("good");
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlanned = useMemo(
    () => plannedSessions.find((p) => p.id === plannedSessionId) ?? null,
    [plannedSessions, plannedSessionId],
  );

  const showPlanConfirm = shouldShowPlanConfirmCard(mode, todayPending, plannedSessionId);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), STUDY_LOG_FEEDBACK_MS);
  }, []);

  const resetToManualEntry = useCallback(() => {
    const empty = emptyFormFields(today);
    setPlannedSessionId("");
    setSubjectId(empty.subjectId);
    setType(empty.type);
    setDurationMinutes(empty.durationMinutes);
    setQuality(empty.quality);
    setNotes(empty.notes);
    setDate(empty.date);
    setNotesOpen(empty.notesOpen);
  }, [today]);

  const applyPlannedToForm = useCallback((planned: PlannedStudySession) => {
    setPlannedSessionId(planned.id);
    setDate(planned.date);
    setSubjectId(planned.subjectId);
    setType(planned.type);
    setDurationMinutes(String(planned.plannedDurationMinutes));
  }, []);

  const afterPlanBlockSaved = useCallback(
    (completedPlannedId: string) => {
      const nextId = nextPendingIdAfterComplete(todayPending, completedPlannedId);
      if (nextId) {
        const next = todayPending.find((p) => p.id === nextId);
        if (next) {
          applyPlannedToForm(next);
          setNotes("");
          setNotesOpen(false);
          return;
        }
      }
      resetToManualEntry();
      setMode("free_study");
    },
    [todayPending, applyPlannedToForm, resetToManualEntry],
  );

  useEffect(() => {
    if (!intent) return;
    const nextMode =
      intent.mode ?? (intent.plannedSessionId || todayPending.length > 0 ? "plan_block" : "free_study");
    setMode(nextMode);
    if (intent.plannedSessionId) {
      const planned = plannedSessions.find((p) => p.id === intent.plannedSessionId);
      if (planned && isPendingLikeStatus(planned.status)) applyPlannedToForm(planned);
    } else if (nextMode === "plan_block" && todayPending[0]) {
      applyPlannedToForm(todayPending[0]!);
    }
    onIntentConsumed?.();
  }, [intent, plannedSessions, todayPending, applyPlannedToForm, onIntentConsumed]);

  useEffect(() => {
    if (
      mode === "plan_block" &&
      selectedPlanned &&
      isPendingLikeStatus(selectedPlanned.status)
    ) {
      applyPlannedToForm(selectedPlanned);
    }
  }, [mode, selectedPlanned, applyPlannedToForm]);

  useEffect(() => {
    if (subjectId && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId("");
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (mode !== "plan_block") return;
    if (plannedSessionId && todayPending.some((p) => p.id === plannedSessionId)) return;
    if (todayPending[0]) {
      applyPlannedToForm(todayPending[0]!);
    } else {
      setPlannedSessionId("");
      if (subjectId && !todayPending.length) {
        resetToManualEntry();
      }
    }
  }, [mode, plannedSessionId, todayPending, applyPlannedToForm, subjectId, resetToManualEntry]);

  const plannedOneLiner =
    showPlanConfirm && selectedPlanned ? formatPlannedOneLiner(selectedPlanned) : null;

  const parseDurationMinutes = (): number | null => {
    const n = parseInt(durationMinutes, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.min(24 * 60, n);
  };

  const submitSession = (linkPlanned: boolean) => {
    setError(null);

    if (!subjectId) {
      setError("Selecciona una asignatura.");
      return;
    }

    const mins = parseDurationMinutes();
    if (mins === null) {
      setError("Indica una duración válida en minutos.");
      return;
    }

    const session = {
      id: createSessionId(),
      date,
      subjectId,
      type,
      durationMinutes: mins,
      quality,
      notes: notes.trim() || undefined,
    };

    const completedPlannedId = linkPlanned ? plannedSessionId : undefined;

    try {
      if (linkPlanned && plannedSessionId) {
        onSave({ session, plannedSessionId });
        afterPlanBlockSaved(plannedSessionId);
        showFeedback(getStudyLogSaveFeedback(true));
      } else {
        onSave({ session });
        resetToManualEntry();
        showFeedback(getStudyLogSaveFeedback(false));
      }
    } catch {
      setError(STUDY_LOG_FEEDBACK.saveError);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSession(mode === "plan_block" && Boolean(plannedSessionId) && showPlanConfirm);
  };

  const handleConfirmPlanned = () => {
    if (!showPlanConfirm || !selectedPlanned) {
      setError("Selecciona un bloque del plan para hoy.");
      return;
    }
    submitSession(true);
  };

  const fieldClass =
    "mt-0.5 h-9 w-full rounded-md bg-white px-2.5 text-[13px] text-[#0f1a33] ring-1 ring-slate-200/45 focus:ring-2 focus:ring-[#c9a454]/25 focus:outline-none";
  const labelClass = "text-[13px] font-medium text-slate-500";

  const confirmBtnPrimary =
    "inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-[#c9a454] px-3 text-[13px] font-semibold text-[#0f1a33] ring-1 ring-[#ddb75c]/40 transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40";
  const confirmBtnSecondary =
    "inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-white px-3 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200/50 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/80";

  return (
    <div className="space-y-3">
      {feedback ? (
        <p
          className="rounded-lg bg-emerald-50/90 px-3 py-2 text-[13px] font-medium text-emerald-800 ring-1 ring-emerald-200/50"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}

      <div
        className="inline-flex w-full max-w-md rounded-lg bg-slate-100/60 p-0.5 ring-1 ring-slate-200/25"
        role="tablist"
        aria-label="Modo de registro"
      >
        {(
          [
            { id: "plan_block" as const, label: "Bloque del plan" },
            { id: "free_study" as const, label: "Estudio libre" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => {
              setMode(item.id);
              if (item.id === "free_study") {
                resetToManualEntry();
              } else if (todayPending[0]) {
                applyPlannedToForm(todayPending[0]!);
              }
            }}
            className={`flex-1 rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition ${
              mode === item.id
                ? "bg-white text-[#0f1a33] shadow-[0_1px_3px_-1px_rgba(15,26,51,0.08)]"
                : "text-slate-600 hover:bg-white/50 hover:text-[#0f1a33]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "plan_block" ? (
        <div className="space-y-2">
          {todayPending.length > 1 ? (
            <label className="block">
              <span className={labelClass}>Bloque pendiente hoy</span>
              <select
                value={plannedSessionId}
                onChange={(e) => {
                  const planned = plannedSessions.find((p) => p.id === e.target.value);
                  if (planned && isPendingLikeStatus(planned.status)) {
                    applyPlannedToForm(planned);
                  }
                }}
                className={fieldClass}
              >
                {todayPending.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPlannedOneLiner(p)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showPlanConfirm && plannedOneLiner ? (
            <div className="rounded-lg bg-gradient-to-r from-[#fffdf8] to-white px-3 py-2.5 ring-1 ring-[#c9a454]/18">
              <p className="text-[12px] font-semibold text-[#7a5a16]">
                ¿Has completado este bloque?
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold text-[#0f1a33]">
                {plannedOneLiner}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={handleConfirmPlanned} className={confirmBtnPrimary}>
                  Confirmar y guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("study-log-quick-form")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className={confirmBtnSecondary}
                >
                  Editar antes de guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50/70 px-3 py-2 ring-1 ring-slate-200/25">
              <p className="text-[13px] font-medium text-slate-700">
                Ya no quedan bloques pendientes hoy.
              </p>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Registra estudio libre o adelanta desde el calendario.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <form
        id="study-log-quick-form"
        onSubmit={handleSubmit}
        className="rounded-xl bg-white/95 p-3 ring-1 ring-slate-200/30 sm:p-3.5"
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
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
            <span className={labelClass}>Tipo de sesión</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as StudySessionType)}
              className={fieldClass}
            >
              {SESSION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <span className={labelClass}>Duración</span>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(String(m))}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
                    durationMinutes === String(m)
                      ? "bg-[#fff8e8] text-[#7a5a16] ring-1 ring-[#c9a454]/35"
                      : "bg-white text-slate-600 ring-1 ring-slate-200/45 hover:ring-[#c9a454]/25 hover:text-[#7a5a16]"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <label className="mt-1.5 block">
              <span className="text-[13px] text-slate-400">Minutos</span>
              <input
                type="number"
                min={1}
                max={24 * 60}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className={fieldClass}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Calidad</span>
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

          <label className="block">
            <span className={labelClass}>Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 transition hover:text-[#0f1a33]"
            >
              {notesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Añadir notas
            </button>
            {notesOpen ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${fieldClass} mt-1 min-h-[52px] resize-y`}
                placeholder="Temas vistos, dudas…"
              />
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-[12px] font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#c9a454] px-4 text-[13px] font-semibold text-[#0f1a33] ring-1 ring-[#ddb75c]/40 transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40"
        >
          Guardar estudio
        </button>
      </form>
    </div>
  );
}
