"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, LayoutDashboard, BookOpen, PenLine, Calendar, ClipboardList, RotateCcw, TrendingUp } from "lucide-react";
import {
  DEFAULT_ATPL_PLANNER_STATE,
  type AtplPlannerState,
  type StudyMode,
  type StudySession,
} from "@/lib/study-planner/types";
import { loadStudyPlannerState, saveStudyPlannerState } from "@/lib/study-planner/storage";
import { filterSessionsByMode, getSubjectsByMode } from "@/lib/study-planner/subjects";
import { StudyModeSelector } from "./StudyModeSelector";
import { StudyDashboard } from "./StudyDashboard";
import { SubjectOverview } from "./SubjectOverview";
import { StudyLogForm } from "./StudyLogForm";
import { StudyLogTable } from "./StudyLogTable";

type PlannerTab =
  | "dashboard"
  | "subjects"
  | "log"
  | "calendar"
  | "mocks"
  | "reviews"
  | "progress";

const TABS: { id: PlannerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "subjects", label: "Asignaturas", icon: BookOpen },
  { id: "log", label: "Registro", icon: PenLine },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "mocks", label: "Mocks", icon: ClipboardList },
  { id: "reviews", label: "Repasos", icon: RotateCcw },
  { id: "progress", label: "Progreso", icon: TrendingUp },
];

const PLACEHOLDER_MSG = "Esta sección se activará en una próxima fase.";

export function AtplPlannerApp() {
  const [state, setState] = useState<AtplPlannerState>(DEFAULT_ATPL_PLANNER_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<PlannerTab>("dashboard");
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(loadStudyPlannerState(DEFAULT_ATPL_PLANNER_STATE));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStudyPlannerState(state);
  }, [state, hydrated]);

  const { mode, weeklyGoalMinutes, sessions } = state;
  const subjects = useMemo(() => getSubjectsByMode(mode), [mode]);
  const modeSessions = useMemo(() => filterSessionsByMode(sessions, mode), [sessions, mode]);

  const setMode = useCallback((next: StudyMode) => {
    setState((prev) => ({ ...prev, mode: next }));
  }, []);

  const addSession = useCallback((session: StudySession) => {
    setState((prev) => ({ ...prev, sessions: [...prev.sessions, session] }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const setWeeklyGoalHours = useCallback((hours: number) => {
    const clamped = Math.min(80, Math.max(1, hours));
    setState((prev) => ({ ...prev, weeklyGoalMinutes: clamped * 60 }));
  }, []);

  const scrollToWorkspace = useCallback(() => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#0f1a33]">
      <section className="border-b border-[#0f1a33]/10 bg-gradient-to-br from-[#0f1a33] via-[#152440] to-[#1a2d52] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2ddaa]">ATPL PLANNER</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
            Organiza tu estudio ATPL sin estudiar a ciegas
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-100 sm:text-base">
            Registra horas, sigue tu progreso por asignatura y prepara tus exámenes con una visión clara de tu carga
            semanal. También puedes usarlo para organizar teoría PPL.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveTab("dashboard");
                requestAnimationFrame(() => scrollToWorkspace());
              }}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#c9a454] bg-[#c9a454] px-6 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_10px_32px_rgba(201,164,84,0.35)] transition hover:border-[#ddb75c] hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50"
            >
              Empezar a planificar
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("subjects");
                requestAnimationFrame(() => scrollToWorkspace());
              }}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white transition hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Ver asignaturas
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <div ref={workspaceRef} id="planner-workspace" className="scroll-mt-4 px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <section aria-labelledby="mode-heading">
            <h2 id="mode-heading" className="text-lg font-semibold text-[#0f1a33] sm:text-xl">
              Modo de estudio
            </h2>
            <p className="mt-1 text-[14px] text-slate-600">
              ATPL Planner incluye modo PPL para la misma rutina de organización.
            </p>
            <div className="mt-4">
              <StudyModeSelector mode={mode} onModeChange={setMode} />
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-1 shadow-[0_8px_40px_rgba(15,26,51,0.06)] ring-1 ring-slate-100/80">
            <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <nav
                className="flex min-w-0 gap-1 px-1 pt-1"
                role="tablist"
                aria-label="Secciones del ATPL Planner"
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/45 sm:px-4 ${
                        isActive
                          ? "bg-[#0f1a33] text-white shadow-sm"
                          : "bg-slate-50 text-slate-600 hover:bg-[#fffdf8] hover:text-[#0f1a33]"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-100 p-4 sm:p-6" role="tabpanel">
              {activeTab === "dashboard" ? (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-[#0f1a33] sm:text-lg">Resumen</h3>
                  <StudyDashboard
                    sessions={modeSessions}
                    weeklyGoalMinutes={weeklyGoalMinutes}
                    subjects={subjects}
                    onWeeklyGoalHoursChange={setWeeklyGoalHours}
                  />
                </div>
              ) : null}

              {activeTab === "subjects" ? (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-[#0f1a33] sm:text-lg">
                    Asignaturas ({mode.toUpperCase()})
                  </h3>
                  <SubjectOverview subjects={subjects} sessions={modeSessions} />
                </div>
              ) : null}

              {activeTab === "log" ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-[#0f1a33] sm:text-lg">Registro de estudio</h3>
                    <p className="mt-1 text-[14px] text-slate-600">
                      Anota qué has estudiado, cuánto tiempo le has dedicado y cómo ha ido la sesión.
                    </p>
                  </div>
                  <StudyLogForm subjects={subjects} onAddSession={addSession} />
                  <div>
                    <h4 className="mb-3 text-[15px] font-semibold text-[#0f1a33]">Sesiones registradas</h4>
                    <StudyLogTable sessions={modeSessions} onDelete={deleteSession} />
                  </div>
                </div>
              ) : null}

              {activeTab !== "dashboard" && activeTab !== "subjects" && activeTab !== "log" ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
                  <p className="text-[15px] font-medium text-slate-700">{PLACEHOLDER_MSG}</p>
                  <p className="mt-2 text-[13px] text-slate-500">
                    Pronto podrás usar esta pestaña desde el mismo centro de control.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
