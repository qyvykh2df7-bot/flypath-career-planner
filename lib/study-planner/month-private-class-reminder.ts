import { comparePlannedByStartTime, formatShortDate, getDayShortLabel } from "./calculations";
import { getPlannedSessionsForMonth } from "./date-utils";
import type { PlannedStudySession } from "./types";

export const PRIVATE_CLASS_SESSION_TYPE = "class" as const;
export const CARLOS_INSTRUCTOR_NAME = "Carlos";
/** Avatar de Carlos en clases PPL/ATPL (`app/clases-ppl-atpl/page.tsx`). */
export const CARLOS_INSTRUCTOR_AVATAR_PATH = "/pollo.jpg";

const MAX_DATE_CHIPS = 3;

export function formatPrivateClassDateChip(date: string): string {
  return `${getDayShortLabel(date)} ${formatShortDate(date)}`;
}

/** Sesiones `class` del mes visible, ordenadas por fecha y hora. */
export function getMonthPrivateClassSessions(
  plannedSessions: PlannedStudySession[],
  visibleMonthStart: string,
): PlannedStudySession[] {
  return getPlannedSessionsForMonth(plannedSessions, visibleMonthStart)
    .filter((session) => session.type === PRIVATE_CLASS_SESSION_TYPE)
    .sort((a, b) => a.date.localeCompare(b.date) || comparePlannedByStartTime(a, b));
}

function uniqueDatesOrdered(sessions: PlannedStudySession[]): string[] {
  const dates: string[] = [];
  const seen = new Set<string>();
  for (const session of sessions) {
    if (seen.has(session.date)) continue;
    seen.add(session.date);
    dates.push(session.date);
  }
  return dates;
}

export type MonthPrivateClassReminderCopy = {
  title: string;
  body: string;
};

export function buildMonthPrivateClassReminderCopy(
  sessions: PlannedStudySession[],
): MonthPrivateClassReminderCopy | null {
  if (sessions.length === 0) return null;

  if (sessions.length === 1) {
    const session = sessions[0]!;
    const timeSuffix = session.startTime ? ` a las ${session.startTime}` : "";
    return {
      title: "Clase particular programada",
      body: `Tienes clase con ${CARLOS_INSTRUCTOR_NAME} el ${formatPrivateClassDateChip(session.date)}${timeSuffix}.`,
    };
  }

  const dates = uniqueDatesOrdered(sessions);
  const shown = dates.slice(0, MAX_DATE_CHIPS);
  const rest = dates.length - shown.length;
  const chips = shown.map((date) => formatPrivateClassDateChip(date)).join(" · ");
  const moreSuffix = rest > 0 ? ` + ${rest} más` : "";

  return {
    title: "Clases particulares programadas",
    body: `Tienes clases con ${CARLOS_INSTRUCTOR_NAME}: ${chips}${moreSuffix}.`,
  };
}
