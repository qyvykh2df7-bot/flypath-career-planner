import type { ExamDate, StudySessionType } from "./types";
import { getNextUpcomingExam, getTodayDateString } from "./calculations";
import type { PlannedSessionCreatePreset } from "./dashboard-navigation";

export function buildUpcomingExamSessionPreset(
  examDates: ExamDate[],
  type: StudySessionType,
  today: string = getTodayDateString(),
): PlannedSessionCreatePreset | null {
  const next = getNextUpcomingExam(examDates, today);
  if (!next) return null;
  return { subjectId: next.subjectId, type, date: today };
}
