import type { PlannedStudySession } from "@/lib/study-planner/types";

export type SessionDisplayStatus = "pending" | "in_progress" | "completed" | "skipped";

export function getSessionDisplayStatus(
  session: PlannedStudySession,
  today: string,
): SessionDisplayStatus {
  if (session.status === "completed") return "completed";
  if (session.status === "skipped") return "skipped";
  if (session.status === "in_progress") return "in_progress";
  if (session.date === today && session.status === "pending") return "in_progress";
  return "pending";
}

export const DISPLAY_STATUS_LABELS: Record<SessionDisplayStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completada",
  skipped: "Saltada",
};

export function displayStatusBadgeClass(status: SessionDisplayStatus): string {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
    case "skipped":
      return "bg-slate-100 text-slate-500 ring-slate-200/80";
    case "in_progress":
      return "bg-sky-50 text-sky-900 ring-sky-200/80";
    default:
      return "bg-[#fff8e8] text-[#7a5a16] ring-[#c9a454]/35";
  }
}
