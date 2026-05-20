import type { PlannedStudySession } from "./types";
import { comparePlannedByStartTime } from "./calculations";
import type { PlannerMetrics } from "./planner-metrics";
import { isPendingLikeStatus, normalizePlannedSessionStatus } from "./planner-session-status";
import { formatSessionHeadline } from "./session-type-visual";
import { getSessionTypeShortLabel } from "./labels";
import { getSubjectById } from "./subjects";
import type { SessionHeroContext } from "@/components/study-planner/dashboard/SessionHeroCard";

function formatNextBlockLine(session: PlannedStudySession): string {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  return formatSessionHeadline({
    minutes: session.plannedDurationMinutes,
    subjectName,
    sessionType: session.type,
  });
}

function formatFollowingSessionLine(session: PlannedStudySession): string {
  const subjectName = getSubjectById(session.subjectId)?.name ?? session.subjectId;
  return `${subjectName} · ${session.plannedDurationMinutes} min · ${getSessionTypeShortLabel(session.type)}`;
}

function pendingTodaySessions(metrics: PlannerMetrics): PlannedStudySession[] {
  return metrics.todaySessions
    .filter((s) => isPendingLikeStatus(normalizePlannedSessionStatus(s.status) ?? "pending"))
    .sort(comparePlannedByStartTime);
}

function firstPendingAfterToday(metrics: PlannerMetrics, today: string): PlannedStudySession | null {
  return (
    metrics.weekSessions
      .filter(
        (s) =>
          s.date > today &&
          isPendingLikeStatus(normalizePlannedSessionStatus(s.status) ?? "pending"),
      )
      .sort((a, b) => a.date.localeCompare(b.date) || comparePlannedByStartTime(a, b))[0] ?? null
  );
}

function blockLabel(count: number): string {
  return `${count} bloque${count === 1 ? "" : "s"}`;
}

/**
 * Hero de “Hoy” / semana en marcha según métricas centrales (casos A–D).
 */
export function buildDashboardHeroFromMetrics(metrics: PlannerMetrics): SessionHeroContext {
  const today = metrics.today;
  const { skippedSessions, todayPendingSessions, pendingLikeCount } = metrics;
  const weekHasPending = pendingLikeCount > 0;

  const todayAllDone =
    metrics.todaySessions.length > 0 &&
    todayPendingSessions === 0 &&
    metrics.todayCompletedSessions > 0;

  const weekAllDone =
    metrics.hasPlan &&
    metrics.totalPlannedSessions > 0 &&
    !weekHasPending &&
    metrics.completedSessions === metrics.totalPlannedSessions;

  const todayPendingList = pendingTodaySessions(metrics);
  const followingSession = firstPendingAfterToday(metrics, today);

  // Caso A — pendientes hoy
  if (todayPendingSessions > 0 && todayPendingList[0]) {
    const session = todayPendingList[0];
    return {
      mode: "planned",
      sectionLabel: "Próxima sesión",
      durationLine: formatNextBlockLine(session),
      metaLine: `Te quedan ${blockLabel(todayPendingSessions)} hoy.`,
      ctaLabel: "Empezar sesión",
      primaryAction: "start_session",
      focusPlannedSessionId: session.id,
      secondaryLink: "calendar",
      showLogTodayLink: true,
    };
  }

  // Caso B — hoy cerrado, semana con pendientes
  if (todayAllDone && weekHasPending) {
    return {
      mode: "planned",
      sectionLabel: "Día completado",
      title: "Has completado tu estudio de hoy",
      metaLine: followingSession
        ? `Tu siguiente sesión es ${formatFollowingSessionLine(followingSession)}.`
        : "Revisa el calendario para ver los próximos bloques.",
      ctaLabel: followingSession ? "Adelantar siguiente sesión" : "Ver calendario",
      primaryAction: followingSession ? "advance_session" : "view_calendar",
      focusPlannedSessionId: followingSession?.id,
      secondaryLink: "calendar",
      showLogTodayLink: false,
    };
  }

  // Caso C — semana completada
  if (weekAllDone) {
    return {
      mode: "planned",
      sectionLabel: "Semana completada",
      title: "Has cerrado tu semana de estudio",
      metaLine:
        "Puedes revisar errores, hacer banco extra o preparar la próxima semana.",
      ctaLabel: "Ver calendario",
      primaryAction: "view_calendar",
      secondaryLink: "evaluation",
      showLogTodayLink: false,
    };
  }

  // Caso D — sesiones saltadas
  if (skippedSessions > 0) {
    return {
      mode: "planned",
      sectionLabel: "Sesiones por recuperar",
      title: "Hay bloques que no se han completado",
      metaLine: "Reorganiza tu semana para recuperar el ritmo sin sobrecargarte.",
      ctaLabel: "Reorganizar semana",
      primaryAction: "reorganize_week",
      secondaryLink: "calendar",
      showLogTodayLink: false,
    };
  }

  return {
    mode: "planned",
    sectionLabel: "Semana en marcha",
    title: metrics.hasPlan ? "Sin bloques pendientes ahora" : "Sin plan activo",
    metaLine: "Revisa tu calendario o marca bloques completados.",
    ctaLabel: "Ver calendario",
    primaryAction: "view_calendar",
    secondaryLink: "calendar",
    showLogTodayLink: false,
  };
}
