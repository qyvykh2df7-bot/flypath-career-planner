"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type {
  PlannedStudySession,
  StudyMode,
  StudySubject,
  TeacherFollowUpComment,
} from "@/lib/study-planner/types";
import { getTodayDateString } from "@/lib/study-planner/calculations";
import type { PlannedSessionCreatePreset } from "@/lib/study-planner/dashboard-navigation";
import { getEvaluationFollowUpAccess } from "@/lib/study-planner/evaluation-follow-up-access";
import {
  buildFlyPathFollowUpSummary,
  buildPlanClassSessionPreset,
  buildRecommendedFollowUpTasks,
} from "@/lib/study-planner/teacher-follow-up";
import { PlannedSessionDrawer } from "./calendar/PlannedSessionDrawer";
import {
  plannerBtnGhost,
  plannerPageTitle,
  plannerPanelSubtitle,
  plannerSectionHeading,
} from "@/lib/study-planner/planner-ui";
import { FlyPathFollowUpInactiveCard } from "./evaluation/FlyPathFollowUpInactiveCard";
import { FlyPathFollowUpPremiumPanel } from "./evaluation/FlyPathFollowUpPremiumPanel";
import { FollowUpCommentsList } from "./evaluation/FollowUpCommentsList";
import { FollowUpCommentForm } from "./evaluation/FollowUpCommentForm";

type EvaluationSectionProps = {
  mode: StudyMode;
  subjects: StudySubject[];
  plannedSessions: PlannedStudySession[];
  followUpComments: TeacherFollowUpComment[];
  onAddFollowUpComment: (comment: TeacherFollowUpComment) => void;
  onDeleteFollowUpComment: (id: string) => void;
  onAddPlannedSession: (planned: PlannedStudySession) => void;
  /** Futuro: suscripción / clases con seguimiento FlyPath. */
  hasPremiumFollowUp?: boolean;
};

export function EvaluationSection({
  mode: _mode,
  subjects,
  plannedSessions,
  followUpComments,
  onAddFollowUpComment,
  onDeleteFollowUpComment,
  onAddPlannedSession,
  hasPremiumFollowUp: hasPremiumFollowUpProp,
}: EvaluationSectionProps) {
  const { hasPremiumFollowUp } = getEvaluationFollowUpAccess({
    hasPremiumFollowUp: hasPremiumFollowUpProp,
  });

  const today = getTodayDateString();
  const [formOpen, setFormOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState<PlannedSessionCreatePreset | null>(null);

  const summary = useMemo(
    () => buildFlyPathFollowUpSummary(followUpComments, plannedSessions, today),
    [followUpComments, plannedSessions, today],
  );

  const recommendedTasks = useMemo(
    () => buildRecommendedFollowUpTasks(followUpComments),
    [followUpComments],
  );

  const openPlanClassDrawer = useCallback(() => {
    setCreatePreset(buildPlanClassSessionPreset(followUpComments, subjects, today));
    setCreateDrawerOpen(true);
  }, [followUpComments, subjects, today]);

  return (
    <div className="space-y-4 pb-2">
      <header>
        <h2 className={plannerPageTitle}>Evaluación</h2>
        <p className={plannerPanelSubtitle}>
          {hasPremiumFollowUp
            ? "Seguimiento de tu estudio, clases y próximos objetivos."
            : "Notas personales y seguimiento FlyPath con clases."}
        </p>
      </header>

      {hasPremiumFollowUp ? (
        <FlyPathFollowUpPremiumPanel
          summary={summary}
          recommendedTasks={recommendedTasks}
          followUpComments={followUpComments}
          onDeleteFollowUpComment={onDeleteFollowUpComment}
          onPlanClass={openPlanClassDrawer}
        />
      ) : (
        <FlyPathFollowUpInactiveCard />
      )}

      <section className="space-y-2 border-t border-slate-200/60 pt-4">
        <h3 className={plannerSectionHeading}>Notas personales</h3>
        <p className="text-[13px] leading-relaxed text-slate-600">
          Usa este espacio para guardar observaciones de estudio, dudas o tareas propias.
        </p>
        <FollowUpCommentsList
          comments={followUpComments}
          onDelete={onDeleteFollowUpComment}
          emptyMessage="Aún no tienes notas personales."
          deleteAriaLabel="Eliminar nota"
        />
      </section>

      <section className="rounded-xl border border-dashed border-slate-200/90 bg-white/60">
        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          className={`${plannerBtnGhost} flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-50/80`}
          aria-expanded={formOpen}
          aria-controls="personal-note-form"
        >
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#c9a454]" aria-hidden />
            Añadir nota
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition ${formOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {formOpen ? (
          <div id="personal-note-form" className="border-t border-slate-100 px-3 pb-3 pt-1 sm:px-4">
            <FollowUpCommentForm
              subjects={subjects}
              onAdd={onAddFollowUpComment}
              onAdded={() => setFormOpen(false)}
            />
          </div>
        ) : null}
      </section>

      {hasPremiumFollowUp ? (
        <PlannedSessionDrawer
          open={createDrawerOpen}
          mode="create"
          initialDate={createPreset?.date ?? today}
          today={today}
          subjects={subjects}
          createPreset={createPreset}
          onClose={() => {
            setCreateDrawerOpen(false);
            setCreatePreset(null);
          }}
          onSave={(session) => {
            onAddPlannedSession(session);
            setCreateDrawerOpen(false);
            setCreatePreset(null);
          }}
        />
      ) : null}
    </div>
  );
}
