import type { PlannedStudySession } from "./types";
import { comparePlannedByStartTime, getTodayDateString } from "./calculations";
import type { PlannerMetrics } from "./planner-metrics";
import { isPendingLikeStatus } from "./planner-session-status";
import { formatSessionHeadline } from "./session-type-visual";
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

/**
 * Hero de “Hoy” / semana en marcha según métricas centrales (casos A–D).
 */
export function buildDashboardHeroFromMetrics(
  metrics: PlannerMetrics,
  options?: { onReorganizeWeek?: boolean },
): SessionHeroContext {
  const today = getTodayDateString();
  const { nextSession, skippedSessions, todayPendingSessions, pendingLikeCount } = metrics;
  const weekHasPending = pendingLikeCount > 0;
  const todayAllDone =
    metrics.todaySessions.length > 0 &&
    todayPendingSessions === 0 &&
    metrics.todayCompletedSessions > 0;
  const weekAllDone =
    metrics.hasPlan &&
    !weekHasPending &&
    metrics.completedSessions === metrics.totalPlannedSessions;

  if (nextSession) {
    const subjectName = getSubjectById(nextSession.subjectId)?.name ?? nextSession.subjectId;
    return {
      mode: "planned",
      sectionLabel: "Próxima sesión",
      durationLine: formatNextBlockLine(nextSession),
      metaLine:
        todayPendingSessions > 0
          ? `Hoy tienes ${todayPendingSessions} bloque${todayPendingSessions === 1 ? "" : "s"} pendiente${todayPendingSessions === 1 ? "" : "s"}`
          : undefined,
      ctaLabel: "Empezar sesión",
    };
  }

  if (skippedSessions > 0 && !weekHasPending) {
    return {
      mode: "planned",
      sectionLabel: "Sesiones por recuperar",
      title: `${skippedSessions} sesión${skippedSessions === 1 ? "" : "es"} saltada${skippedSessions === 1 ? "" : "s"}`,
      metaLine: "Reorganiza la semana para recuperar el tiempo perdido.",
      ctaLabel: options?.onReorganizeWeek ? "Reorganizar semana" : "Ver plan semanal",
    };
  }

  if (weekAllDone) {
    return {
      mode: "planned",
      sectionLabel: "Semana completada",
      title: "Buen trabajo",
      metaLine: "Puedes revisar o preparar la próxima semana.",
      ctaLabel: "Ver plan semanal",
    };
  }

  if (todayAllDone && weekHasPending) {
    const afterToday = metrics.weekSessions
      .filter((s) => isPendingLikeStatus(s.status) && s.date > today)
      .sort((a, b) => a.date.localeCompare(b.date) || comparePlannedByStartTime(a, b));
    const following = afterToday[0] ?? null;
    return {
      mode: "planned",
      sectionLabel: "Día completado",
      title: "Has cerrado los bloques de hoy",
      metaLine: following
        ? `Tu siguiente bloque es ${formatNextBlockLine(following)}`
        : "Revisa el calendario para ver los próximos bloques.",
      ctaLabel: "Ver plan semanal",
    };
  }

  return {
    mode: "planned",
    sectionLabel: "Semana en marcha",
    title: metrics.hasPlan ? "Sin bloques pendientes ahora" : "Sin plan activo",
    metaLine: "Revisa tu calendario o marca bloques completados.",
    ctaLabel: "Ver plan semanal",
  };
}
