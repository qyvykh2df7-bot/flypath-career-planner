import { describe, expect, it } from "vitest";
import {
  RECOVERY_PROBLEM_OPTIONS,
  RECOVERY_WEEK_LOAD_LABELS,
  generateRecoveryPlan,
} from "./recovery";

describe("recovery", () => {
  it("expone etiquetas de carga sin lenguaje de riesgo punitivo", () => {
    expect(RECOVERY_WEEK_LOAD_LABELS.high).toBe("Carga alta");
    expect(RECOVERY_WEEK_LOAD_LABELS.medium).toBe("Carga moderada");
    expect(RECOVERY_WEEK_LOAD_LABELS.low).toBe("Carga baja");
    expect(Object.values(RECOVERY_WEEK_LOAD_LABELS).join(" ")).not.toMatch(/riesgo/i);
  });

  it("incluye dudas acumuladas y no errores pendientes en opciones", () => {
    const labels = RECOVERY_PROBLEM_OPTIONS.map((o) => o.label).join(" ");
    const values = RECOVERY_PROBLEM_OPTIONS.map((o) => o.value);
    expect(values).toContain("accumulated_doubts");
    expect(values).not.toContain("pending_errors");
    expect(labels).toMatch(/dudas acumuladas/i);
    expect(labels).not.toMatch(/errores pendientes/i);
  });

  it("genera semana ligera calmada cuando hay burnout", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["burnout"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.variant).toBe("lighter");
    expect(plan.riskLevel).toBe("low");
    expect(RECOVERY_WEEK_LOAD_LABELS[plan.riskLevel]).toBe("Carga baja");
    expect(plan.summary).toMatch(/no necesitas estudiar más horas/i);
    expect(plan.summary).not.toMatch(/activar asignaturas/i);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.cta?.label).toBe("Pedir ayuda con una asignatura");
  });

  it("versión más ligera sigue disponible para uso interno", () => {
    const params = {
      selectedProblems: ["low_time", "no_weekly_plan"] as const,
      mode: "atpl" as const,
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    };
    const lighter = generateRecoveryPlan({ ...params, variant: "lighter" });
    expect(lighter.variant).toBe("lighter");
    expect(lighter.summary).toMatch(/menos carga/i);
  });

  it("con 10 asignaturas activas propone quitar 2", () => {
    const subjects = Array.from({ length: 10 }, (_, index) => ({
      id: `atpl-s${index + 1}`,
      name: `Asignatura ${index + 1}`,
      mode: "atpl" as const,
    }));
    const plan = generateRecoveryPlan({
      selectedProblems: ["too_many_subjects"],
      mode: "atpl",
      subjects,
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
      weeklyGoalMinutes: 600,
      today: "2026-05-19",
    });
    expect(plan.focusReduction?.activeSubjectsCount).toBe(10);
    expect(plan.focusReduction?.subjectsToRemoveCount).toBe(2);
    expect(plan.focusReduction?.subjectIdsToRemove).toHaveLength(2);
    expect(plan.summary).toMatch(/dejar fuera 2 asignaturas/i);
    expect(plan.summary).not.toMatch(/activar asignaturas/i);
  });

  it("con 5 asignaturas activas propone quitar 1", () => {
    const subjects = Array.from({ length: 5 }, (_, index) => ({
      id: `atpl-s${index + 1}`,
      name: `Asignatura ${index + 1}`,
      mode: "atpl" as const,
    }));
    const plan = generateRecoveryPlan({
      selectedProblems: ["too_many_subjects"],
      mode: "atpl",
      subjects,
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
      weeklyGoalMinutes: 600,
      today: "2026-05-19",
    });
    expect(plan.focusReduction?.activeSubjectsCount).toBe(5);
    expect(plan.focusReduction?.subjectsToRemoveCount).toBe(1);
    expect(plan.focusReduction?.subjectIdsToRemove).toHaveLength(1);
  });

  it("no propone quitar asignaturas con examen en próximos 14 días", () => {
    const subjects = Array.from({ length: 5 }, (_, index) => ({
      id: `atpl-s${index + 1}`,
      name: `Asignatura ${index + 1}`,
      mode: "atpl" as const,
    }));
    const plan = generateRecoveryPlan({
      selectedProblems: ["too_many_subjects"],
      mode: "atpl",
      subjects,
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [{ id: "e1", subjectId: "atpl-s1", date: "2026-05-28" }],
      weeklyGoalMinutes: 600,
      today: "2026-05-19",
    });
    expect(plan.focusReduction?.subjectIdsToRemove.includes("atpl-s1")).toBe(false);
    expect(plan.focusReduction?.nearExamSubjectIds.includes("atpl-s1")).toBe(true);
  });

  it("low_mock_scores genera pasos de corrección y no de carga extra", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["low_mock_scores"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [{ id: "m1", date: "2026-05-18", subjectId: "atpl-air-law", score: 62 }],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
      today: "2026-05-19",
    });

    const titles = plan.steps.map((step) => step.title).join(" ");
    expect(titles).toMatch(/Simulacro \+ revisión/);
    expect(titles).toMatch(/Detectar patrones/);
    expect(titles).toMatch(/Menos volumen automático/);
    expect(titles).not.toMatch(/Planifica 3 sesiones|Empieza con una sesión corta/i);
  });

  it("overdue_reviews genera pasos específicos de limpieza de deuda", () => {
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
      today: "2026-05-19",
    });

    const titles = plan.steps.map((step) => step.title).join(" ");
    expect(titles).toMatch(/Repasos atrasados primero/);
    expect(titles).toMatch(/Teoría nueva limitada/);
    expect(titles).toMatch(/Revisión corta diaria/);
    expect(titles).not.toMatch(/recuperar control|prioriza 2 asignaturas/i);
  });

  it("low_time genera pasos de continuidad mínima realista", () => {
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
      today: "2026-05-19",
    });

    const titles = plan.steps.map((step) => step.title).join(" ");
    expect(titles).toMatch(/Objetivo semanal realista/);
    expect(titles).toMatch(/Prioridad alta primero/);
    expect(titles).toMatch(/Sesiones cortas/);
    expect(titles).not.toMatch(/añadir 10 sesiones|recuperar control|priorizar 2 asignaturas/i);
  });

  it("dont_know_where_to_start genera pasos simples de arranque", () => {
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
      today: "2026-05-19",
    });

    const titles = plan.steps.map((step) => step.title).join(" ");
    expect(titles).toMatch(/Una asignatura primero/);
    expect(titles).toMatch(/Primer bloque corto/);
    expect(titles).toMatch(/Siguiente paso visible/);
    expect(titles).not.toMatch(/demasiadas sesiones|recuperar control|añadir 10 sesiones/i);
  });

  it("combina saturado + poco tiempo con intención principal burnout", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["burnout", "low_time"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.primaryIntent).toBe("burnout");
    expect(plan.steps.length).toBeLessThanOrEqual(3);
    expect(plan.summary).toMatch(/mínima y ligera|reduciremos la carga/i);
  });

  it("combina demasiadas asignaturas + no sé qué estudiar con intención estructural", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["too_many_subjects", "no_weekly_plan"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.primaryIntent).toBe("no_weekly_plan");
    expect(plan.steps.length).toBeLessThanOrEqual(3);
    expect(plan.steps.map((s) => s.title).join(" ")).toMatch(/Reducir foco primero|Semana estructurada/);
  });

  it("combina repasos + dudas en modo consolidación", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["overdue_reviews", "accumulated_doubts"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.primaryIntent).toBe("overdue_reviews");
    expect(plan.steps.length).toBeLessThanOrEqual(3);
    expect(plan.summary).toMatch(/consolidación/i);
  });

  it("combina simulacros + dudas priorizando cierre de errores", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["low_mock_scores", "accumulated_doubts"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [{ id: "m1", date: "2026-05-19", subjectId: "atpl-air-law", score: 62 }],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.primaryIntent).toBe("accumulated_doubts");
    expect(plan.steps.length).toBeLessThanOrEqual(3);
    expect(plan.steps.map((s) => s.title).join(" ")).toMatch(/Analizar errores clave|Repasos dirigidos/);
  });

  it("combina poco tiempo + no sé por dónde empezar con foco mínimo", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["low_time", "dont_know_where_to_start"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.primaryIntent).toBe("low_time");
    expect(plan.steps.length).toBeLessThanOrEqual(3);
    expect(plan.summary).toMatch(/mínimo|carga mínima/i);
    expect(plan.cta).toBeTruthy();
  });
});
