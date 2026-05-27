import { describe, expect, it } from "vitest";
import { generateRecoveryPlan } from "./recovery";
import {
  attachRecoveryCalendarPreview,
  buildPracticalRecoverySummary,
  formatWeeklyStructureImpactLine,
  LOW_TIME_BUTTON_HINT,
  LOW_TIME_BUTTON_LABEL,
  LOW_TIME_IMPACT_LINE,
  MOCK_CORRECTION_BUTTON_HINT,
  MOCK_CORRECTION_BUTTON_LABEL,
  MOCK_CORRECTION_IMPACT_LINE,
  OVERDUE_REVIEWS_BUTTON_HINT,
  OVERDUE_REVIEWS_BUTTON_LABEL,
  OVERDUE_REVIEWS_IMPACT_LINE,
  START_GUIDANCE_BUTTON_HINT,
  START_GUIDANCE_BUTTON_LABEL,
  START_GUIDANCE_IMPACT_LINE,
} from "./recovery-plan-preview";

const WEEK_START = "2026-05-18";
const TODAY = "2026-05-19";

describe("recovery-plan-preview", () => {
  it("buildPracticalRecoverySummary explains calendar impact", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["no_weekly_plan", "accumulated_doubts"],
      mode: "atpl",
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });

    const enriched = attachRecoveryCalendarPreview(plan, {
      activeSubjectIds: ["atpl-air-law", "atpl-meteo"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    });

    expect(enriched.summary).toMatch(/próximos 7 días/i);
    expect(enriched.summary).toMatch(/semana simple y clara/i);
    expect(enriched.calendarImpact?.estimatedSessions).toBeGreaterThan(0);
    expect(enriched.summary).not.toMatch(/errores pendientes/i);
  });

  it("detects when existing pending sessions would be modified", () => {
    const existingPlanned = [
      {
        id: "p1",
        date: TODAY,
        subjectId: "atpl-air-law",
        type: "theory" as const,
        plannedDurationMinutes: 60,
        status: "pending" as const,
        source: "auto" as const,
      },
    ];

    const plan = generateRecoveryPlan({
      selectedProblems: ["accumulated_doubts"],
      mode: "atpl",
      subjects: [],
      sessions: [],
      plannedSessions: existingPlanned,
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });

    const input = {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: existingPlanned,
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    };

    const enriched = attachRecoveryCalendarPreview(plan, input);

    expect(enriched.calendarImpact?.willModifyExistingSessions).toBe(true);
    expect(buildPracticalRecoverySummary(enriched, input)).toMatch(/modificará/i);
  });

  it("usa copy calmado para no sé qué estudiar esta semana", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["no_weekly_plan"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });

    const input = {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    };

    const enriched = attachRecoveryCalendarPreview(plan, input);
    const sessions = enriched.calendarImpact?.estimatedSessions ?? 0;

    expect(enriched.summary).toMatch(/organizaremos una semana simple y clara/i);
    expect(enriched.summary).not.toMatch(/añadirá unas/i);
    expect(formatWeeklyStructureImpactLine(sessions)).toMatch(
      /sesiones organizadas · foco semanal · carga sostenible/i,
    );
    expect(formatWeeklyStructureImpactLine(sessions)).not.toMatch(/teoría y banco/i);
  });

  it("usa copy de corrección para simulacros sin mejorar nota", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["low_mock_scores"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [{ id: "m1", date: TODAY, subjectId: "atpl-air-law", score: 61 }],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    const input = {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    };

    const enriched = attachRecoveryCalendarPreview(plan, input);
    expect(enriched.summary).toMatch(/cambiaremos volumen por precisión/i);
    expect(enriched.summary).not.toMatch(/añadirá unas/i);
    expect(MOCK_CORRECTION_IMPACT_LINE).toMatch(/simulacros diagnósticos/i);
    expect(MOCK_CORRECTION_BUTTON_LABEL).toBe("Aplicar semana de corrección");
    expect(MOCK_CORRECTION_BUTTON_HINT).toMatch(/revisión de errores/i);
  });

  it("usa copy específico para repasos atrasados", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["overdue_reviews"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    const input = {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    };

    const enriched = attachRecoveryCalendarPreview(plan, input);
    expect(enriched.summary).toMatch(/limpiaremos repasos pendientes/i);
    expect(enriched.summary).not.toMatch(/priorizará 2 asignaturas|recuperar el control/i);
    expect(OVERDUE_REVIEWS_IMPACT_LINE).toBe(
      "~5 bloques de repaso · menos teoría nueva · continuidad semanal",
    );
    expect(OVERDUE_REVIEWS_BUTTON_LABEL).toBe("Aplicar semana de repaso");
    expect(OVERDUE_REVIEWS_BUTTON_HINT).toMatch(/priorizar repasos pendientes/i);
  });

  it("usa copy específico para poco tiempo", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["low_time"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    const input = {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    };

    const enriched = attachRecoveryCalendarPreview(plan, input);
    expect(enriched.summary).toMatch(/carga mínima realista/i);
    expect(enriched.summary).not.toMatch(
      /añadirá 10 sesiones|priorizar 2 asignaturas|recuperar control/i,
    );
    expect(LOW_TIME_IMPACT_LINE).toBe("~4–6 sesiones · bloques de 30–45 min · máxima prioridad");
    expect(LOW_TIME_BUTTON_LABEL).toBe("Aplicar semana mínima");
    expect(LOW_TIME_BUTTON_HINT).toMatch(/semana ligera/i);
  });

  it("usa copy específico para no saber por dónde empezar", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["dont_know_where_to_start"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    const input = {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    };

    const enriched = attachRecoveryCalendarPreview(plan, input);
    expect(enriched.summary).toMatch(/una sola asignatura/i);
    expect(enriched.summary).not.toMatch(/demasiadas sesiones|recuperar control|añadirá/i);
    expect(START_GUIDANCE_IMPACT_LINE).toBe("~3 bloques simples · una asignatura · primer paso claro");
    expect(START_GUIDANCE_BUTTON_LABEL).toBe("Aplicar plan de inicio");
    expect(START_GUIDANCE_BUTTON_HINT).toMatch(/empezar sin saturarte/i);
  });
});
