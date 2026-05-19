"use client";

import { ArrowRight } from "lucide-react";
import type { PlannedStudySession } from "@/lib/study-planner/types";
import type {
  AttentionItem,
  DashboardHeroEmptyState,
  HeroCoachTone,
} from "@/lib/study-planner/calculations";
import { REGISTER_STUDY_LINK_LABEL } from "@/lib/study-planner/study-log-form-logic";
import { plannerBtnHero } from "@/lib/study-planner/planner-ui";

export type SessionHeroPrimaryAction =
  | "start_session"
  | "advance_session"
  | "view_calendar"
  | "reorganize_week"
  | "view_evaluation";

export type SessionHeroSecondaryLink = "calendar" | "evaluation" | "none";

export type SessionHeroContext = {
  mode: "planned" | "suggested" | "empty";
  sectionLabel?: string;
  title?: string;
  durationLine?: string;
  metaLine?: string;
  reviewLine?: string;
  errorLine?: string;
  ctaLabel: string;
  primaryAction?: SessionHeroPrimaryAction;
  focusPlannedSessionId?: string;
  secondaryLink?: SessionHeroSecondaryLink;
  showLogTodayLink?: boolean;
};

const SECONDARY_LINK_LABELS: Record<Exclude<SessionHeroSecondaryLink, "none">, string> = {
  calendar: "Ver calendario",
  evaluation: "Revisar evaluación",
};

type SessionHeroCardProps = {
  context: SessionHeroContext;
  coachTone: HeroCoachTone;
  suppressCoachHeader?: boolean;
  onPrimaryAction: () => void;
  onLogToday?: () => void;
  onViewPlan?: () => void;
  onViewEvaluation?: () => void;
};

export function buildSessionHeroContext(params: {
  nextSession: PlannedStudySession | null;
  subjectName?: string;
  sessionMeta?: string;
  topAttention: AttentionItem | null;
  pendingReviewsForSubject: number;
  pendingErrorsForSubject: number;
  emptyState?: DashboardHeroEmptyState | null;
  weekActive?: boolean;
  todayPendingCount?: number;
  today?: string;
}): SessionHeroContext {
  const {
    nextSession,
    subjectName,
    sessionMeta,
    topAttention,
    pendingReviewsForSubject,
    pendingErrorsForSubject,
    emptyState,
    weekActive,
    todayPendingCount = 0,
    today,
  } = params;

  if (emptyState) {
    return {
      mode: "empty",
      sectionLabel: emptyState.sectionLabel,
      title: emptyState.title,
      metaLine: emptyState.metaLine,
      ctaLabel: emptyState.ctaLabel,
    };
  }

  if (nextSession && subjectName) {
    const reviewLine =
      pendingReviewsForSubject > 0
        ? `${pendingReviewsForSubject} repaso${pendingReviewsForSubject === 1 ? "" : "s"} pendiente${pendingReviewsForSubject === 1 ? "" : "s"}`
        : undefined;
    const errorLine =
      pendingErrorsForSubject > 0
        ? `${pendingErrorsForSubject} error${pendingErrorsForSubject === 1 ? "" : "es"} sin cerrar`
        : undefined;

    const isToday = today && nextSession.date === today;
    let metaLine = sessionMeta;
    if (weekActive && isToday && todayPendingCount > 0) {
      const blockWord = todayPendingCount === 1 ? "bloque" : "bloques";
      metaLine = `Hoy tienes ${todayPendingCount} ${blockWord}. Empieza por ${subjectName} · ${nextSession.plannedDurationMinutes} min.`;
    }

    return {
      mode: "planned",
      sectionLabel: weekActive ? "Semana en marcha" : "Tu siguiente sesión",
      title: subjectName,
      durationLine: `${nextSession.plannedDurationMinutes} min`,
      metaLine,
      reviewLine,
      errorLine,
      ctaLabel: "Empezar sesión",
    };
  }

  if (topAttention) {
    return {
      mode: "suggested",
      sectionLabel: "Tu siguiente sesión",
      title: topAttention.subjectName,
      durationLine: "45 min sugeridos",
      metaLine: topAttention.reason,
      ctaLabel: "Empezar sesión",
    };
  }

  return {
    mode: "empty",
    sectionLabel: "Tu siguiente paso",
    title: "Define tu foco de hoy",
    metaLine: "Genera un plan semanal para repartir mejor tus horas.",
    ctaLabel: "Generar plan semanal",
  };
}

export function SessionHeroCard({
  context,
  coachTone,
  suppressCoachHeader = false,
  onPrimaryAction,
  onLogToday,
  onViewPlan,
  onViewEvaluation,
}: SessionHeroCardProps) {
  const secondaryLink = context.secondaryLink ?? "calendar";
  const secondaryLabel =
    secondaryLink !== "none" ? SECONDARY_LINK_LABELS[secondaryLink] : null;
  const showLogToday = context.showLogTodayLink ?? Boolean(onLogToday);
  const showSecondary =
    secondaryLabel &&
    (secondaryLink === "calendar" ? onViewPlan : onViewEvaluation);
  const detailLines = [context.reviewLine, context.errorLine].filter(Boolean);
  const showHeadline = Boolean(context.durationLine || context.title);
  const showSectionLabel = Boolean(context.sectionLabel);

  return (
    <section className="planner-fade-up relative min-h-[min(220px,38dvh)] overflow-hidden rounded-2xl bg-[#0f1a33] px-6 py-5 shadow-[0_16px_44px_rgba(15,26,51,0.2)] ring-1 ring-white/[0.08] sm:px-7 sm:py-6">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#c9a454]/[0.07] via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative flex min-h-[min(200px,34dvh)] flex-col">
        {!suppressCoachHeader && coachTone.emotionalLine ? (
          <div className="space-y-1">
            <p className="text-[13px] font-semibold tracking-tight text-[#f2ddaa]">
              {coachTone.emotionalLine}
            </p>
            {coachTone.focusHint ? (
              <p className="text-[12px] leading-snug text-slate-400">{coachTone.focusHint}</p>
            ) : null}
          </div>
        ) : null}

        <div
          className={`flex-1 ${!suppressCoachHeader && coachTone.emotionalLine ? (showSectionLabel ? "mt-5" : "mt-4") : showSectionLabel ? "mt-1" : "mt-0"}`}
        >
          {showSectionLabel ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {context.sectionLabel}
            </p>
          ) : null}
          {showHeadline ? (
            <h2 className="mt-2 text-[26px] font-semibold leading-[1.15] tracking-tight text-white sm:text-[28px]">
              {context.durationLine && context.title ? (
                <>
                  <span className="text-[#ddb75c]">{context.durationLine}</span>
                  <span className="text-white"> · {context.title}</span>
                </>
              ) : context.durationLine ? (
                <span className="text-[#ddb75c]">{context.durationLine}</span>
              ) : (
                context.title
              )}
            </h2>
          ) : null}
          {context.metaLine ? (
            <p
              className={`max-w-lg leading-relaxed text-slate-300/95 ${
                showHeadline
                  ? "mt-2.5 text-[14px]"
                  : showSectionLabel
                    ? "mt-2 text-[14px]"
                    : "mt-0 text-[14px] sm:text-[15px]"
              }`}
            >
              {context.metaLine}
            </p>
          ) : null}
          {detailLines.length > 0 ? (
            <p className="mt-2 text-[12px] text-slate-500">{detailLines.join(" · ")}</p>
          ) : null}
        </div>

        <div className="mt-auto space-y-2.5 pt-4">
          <button type="button" onClick={onPrimaryAction} className={plannerBtnHero}>
            {context.ctaLabel}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
          {(showLogToday || showSecondary) && (
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[12px] text-slate-400">
              {showLogToday && onLogToday ? (
                <button
                  type="button"
                  onClick={onLogToday}
                  className="font-medium underline-offset-2 transition hover:text-[#ddb75c] hover:underline"
                >
                  {REGISTER_STUDY_LINK_LABEL}
                </button>
              ) : null}
              {showLogToday && onLogToday && showSecondary ? (
                <span className="text-slate-600" aria-hidden>
                  ·
                </span>
              ) : null}
              {showSecondary ? (
                <button
                  type="button"
                  onClick={
                    secondaryLink === "evaluation" ? onViewEvaluation : onViewPlan
                  }
                  className="font-medium underline-offset-2 transition hover:text-[#ddb75c] hover:underline"
                >
                  {secondaryLabel}
                </button>
              ) : null}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
