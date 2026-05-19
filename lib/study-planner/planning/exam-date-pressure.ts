import type { ExamDate } from "../types";
import { getDaysUntilDate } from "../calculations";
import { getExamForSubject } from "../subjects-page-logic";

/**
 * Fecha de presión por asignatura:
 * 1. examDate propia (próxima) si existe
 * 2. targetExamDate global
 * 3. null → sin presión
 */
export function resolveEffectiveExamDateForSubject(
  subjectId: string,
  examDates: ExamDate[],
  targetExamDate: string | undefined,
  referenceDate: string,
): string | null {
  const subjectExam = getExamForSubject(subjectId, examDates, referenceDate);
  if (subjectExam) return subjectExam.date;

  if (targetExamDate && targetExamDate >= referenceDate) {
    return targetExamDate;
  }

  return null;
}

/** Días hasta el examen efectivo; null si no hay presión o la fecha ya pasó. */
export function resolveExamDaysLeftForSubject(
  subjectId: string,
  examDates: ExamDate[],
  targetExamDate: string | undefined,
  referenceDate: string,
): number | null {
  const effectiveDate = resolveEffectiveExamDateForSubject(
    subjectId,
    examDates,
    targetExamDate,
    referenceDate,
  );
  if (!effectiveDate) return null;

  const days = getDaysUntilDate(effectiveDate, referenceDate);
  return days >= 0 ? days : null;
}

export function buildExamDaysLeftBySubject(
  subjectIds: string[],
  examDates: ExamDate[],
  targetExamDate: string | undefined,
  referenceDate: string,
): Record<string, number | null> {
  const map: Record<string, number | null> = {};
  for (const id of subjectIds) {
    map[id] = resolveExamDaysLeftForSubject(id, examDates, targetExamDate, referenceDate);
  }
  return map;
}
