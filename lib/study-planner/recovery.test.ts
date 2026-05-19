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

  it("mantiene las opciones de problemas actuales", () => {
    expect(RECOVERY_PROBLEM_OPTIONS.map((o) => o.value)).toEqual([
      "too_many_subjects",
      "low_mock_scores",
      "no_weekly_plan",
      "overdue_reviews",
      "pending_errors",
      "low_time",
      "burnout",
      "dont_know_where_to_start",
    ]);
  });

  it("genera plan con carga alta cuando hay burnout", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["burnout"],
      mode: "atpl",
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    });
    expect(plan.riskLevel).toBe("high");
    expect(RECOVERY_WEEK_LOAD_LABELS[plan.riskLevel]).toBe("Carga alta");
    expect(plan.steps.length).toBeGreaterThan(0);
  });

  it("versión más ligera reduce carga y prioriza bloques cortos", () => {
    const params = {
      selectedProblems: ["burnout", "low_time"] as const,
      mode: "atpl" as const,
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
    };
    const standard = generateRecoveryPlan(params);
    const lighter = generateRecoveryPlan({ ...params, variant: "lighter" });

    expect(lighter.variant).toBe("lighter");
    expect(lighter.summary).toMatch(/menos carga/i);
    expect(["low", "medium"]).toContain(lighter.riskLevel);
    if (standard.riskLevel === "high") {
      expect(lighter.riskLevel).not.toBe("high");
    }
    expect(lighter.steps[0]?.title).toMatch(/bloques en calendario/i);
    expect(lighter.steps.length).toBeLessThanOrEqual(5);
  });
});
