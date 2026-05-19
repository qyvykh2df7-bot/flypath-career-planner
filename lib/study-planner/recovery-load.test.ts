import { describe, expect, it } from "vitest";
import { computeRecoveryTargetMinutes } from "./recovery-load";

describe("computeRecoveryTargetMinutes", () => {
  const CURRENT = 585; // 9 h 45 min
  const GOAL = 600; // 10 h

  it("recuperación normal no baja de 60% de carga actual ni 50% del objetivo", () => {
    const target = computeRecoveryTargetMinutes({
      variant: "standard",
      selectedProblems: ["overdue_reviews"],
      currentPlannedMinutes: CURRENT,
      weeklyGoalMinutes: GOAL,
    });
    expect(target).toBeGreaterThanOrEqual(Math.round(CURRENT * 0.6));
    expect(target).toBeGreaterThanOrEqual(Math.round(GOAL * 0.5));
    expect(target).toBeLessThanOrEqual(CURRENT);
  });

  it("versión ligera no baja de 40% del objetivo semanal sin burnout", () => {
    const target = computeRecoveryTargetMinutes({
      variant: "lighter",
      selectedProblems: ["low_time"],
      currentPlannedMinutes: CURRENT,
      weeklyGoalMinutes: GOAL,
    });
    expect(target).toBeGreaterThanOrEqual(Math.round(GOAL * 0.4));
    expect(target).toBeLessThanOrEqual(CURRENT);
  });

  it("versión ligera con burnout puede bajar más pero respeta suelo mínimo", () => {
    const target = computeRecoveryTargetMinutes({
      variant: "lighter",
      selectedProblems: ["burnout", "low_time"],
      currentPlannedMinutes: CURRENT,
      weeklyGoalMinutes: GOAL,
    });
    expect(target).toBeGreaterThanOrEqual(Math.round(GOAL * 0.35));
    expect(target).toBeLessThanOrEqual(CURRENT);
  });
});
