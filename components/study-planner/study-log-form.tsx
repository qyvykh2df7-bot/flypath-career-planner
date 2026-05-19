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
import { SESSION_QUALITY_OPTIONS, SESSION_TYPE_OPTIONS } from "@/lib/study-planner/labels";
import { formatSessionHeadline } from "@/lib/study-planner/session-type-visual";
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

  const plannedHeadline =
    showPlanConfirm && selectedPlanned
      ? formatSessionHeadline({
          minutes: selectedPlanned.plannedDurationMinutes,
          subjectName: getSubjectById(selectedPlanned.subjectId)?.name ?? selectedPlanned.subjectId,
          sessionType: selectedPlanned.type,
        })
      : null;

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
    "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-[#0f1a33] shadow-sm focus:border-[#c9a454]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a454]/25";
  const labelClass = "text-[12px] font-semibold text-slate-600";

  return (
    <div className="space-y-4">
      {feedback ? (
        <p
          className="rounded-lg border border-emerald-200/90 bg-emerald-50 px-3.5 py-2.5 text-[14px] font-medium text-emerald-800 shadow-sm"
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}

      <div
        className="flex rounded-xl border border-slate-200/90 bg-slate-50/80 p-1"
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
            className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
              mode === item.id
                ? "bg-white text-[#0f1a33] shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-[#0f1a33]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "plan_block" ? (
        <div className="space-y-3">
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
                    {formatSessionHeadline({
                      minutes: p.plannedDurationMinutes,
                      subjectName: getSubjectById(p.subjectId)?.name ?? p.subjectId,
                      sessionType: p.type,
                    })}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {showPlanConfirm && plannedHeadline ? (
            <div className="rounded-xl border border-[#c9a454]/35 bg-gradient-to-br from-[#fffdf8] to-white p-4 shadow-sm ring-1 ring-[#c9a454]/20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5a16]">
                ¿Has completado este bloque?
              </p>
              <p className="mt-2 text-[16px] font-semibold text-[#0f1a33]">{plannedHeadline}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirmPlanned}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-4 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c]"
                >
                  Confirmar y guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("study-log-quick-form");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Editar antes de guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3.5">
              <p className="text-[14px] font-medium text-slate-700">
                Ya no quedan bloques pendientes hoy.
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                Puedes registrar estudio libre o adelantar una sesión desde el calendario.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <form
        id="study-log-quick-form"
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100/80 sm:p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
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
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(String(m))}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                    durationMinutes === String(m)
                      ? "border-[#c9a454]/50 bg-[#fff8e8] text-[#7a5a16]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <label className="mt-2 block">
              <span className="text-[12px] text-slate-500">Minutos</span>
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

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 transition hover:text-[#0f1a33]"
            >
              {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Añadir notas
            </button>
            {notesOpen ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${fieldClass} mt-2 resize-y min-h-[64px]`}
                placeholder="Temas vistos, dudas, mock parcial…"
              />
            ) : null}
          </div>

          <label className="block sm:col-span-2">
            <span className="text-[12px] text-slate-500">Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${fieldClass} max-w-[12rem]`}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 text-[14px] font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-5 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-[0_6px_20px_rgba(201,164,84,0.28)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
        >
          Guardar estudio
        </button>
      </form>
    </div>
  );
}
