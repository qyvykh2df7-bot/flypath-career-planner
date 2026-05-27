import { describe, expect, it } from "vitest";
import { generateRecoveryPlan } from "./recovery";
import { attachRecoveryCalendarPreview } from "./recovery-plan-preview";
import {
  BURNOUT_APPLY_CONFIRM_MESSAGE,
  BURNOUT_MAIN_SUMMARY,
  buildBurnoutRelief,
  isBurnoutRecoveryPlan,
} from "./recovery-burnout-relief";
import {
  recoveryPlanToPlannedSessions,
  shouldDescheduleRecoverySession,
} from "./recovery-apply";

const WEEK_START = "2026-05-18";
const TODAY = "2026-05-19";

describe("recovery-burnout-relief", () => {
  it("genera plan ligero con copy humano y sin activar asignaturas", () => {
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
      today: TODAY,
    });

    expect(plan.variant).toBe("lighter");
    expect(plan.summary).toBe(BURNOUT_MAIN_SUMMARY);
    expect(plan.summary).not.toMatch(/activar asignaturas/i);
    expect(plan.riskLevel).toBe("low");
    expect(isBurnoutRecoveryPlan(plan.problems)).toBe(true);
  });

  it("preview incluye cambios concretos y sesiones más cortas", () => {
    const pending = Array.from({ length: 18 }, (_, index) => ({
      id: `p-${index}`,
      date: TODAY,
      subjectId: "atpl-air-law",
      type: (index % 3 === 0 ? "question_bank" : "theory") as const,
      plannedDurationMinutes: 60,
      status: "pending" as const,
      source: "auto" as const,
    }));

    const base = generateRecoveryPlan({
      selectedProblems: ["burnout"],
      mode: "atpl",
      subjects: [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      sessions: [],
      plannedSessions: pending,
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: 600,
      today: TODAY,
    });

    const enriched = attachRecoveryCalendarPreview(base, {
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      plannedSessions: pending,
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
    });

    expect(enriched.burnoutRelief?.proposedChanges.length).toBeGreaterThan(0);
    expect(enriched.burnoutRelief?.proposedChanges.join(" ")).toMatch(/sesiones/i);
    expect(enriched.burnoutRelief?.proposedChanges.join(" ")).not.toMatch(/activar/i);

    const sessions = recoveryPlanToPlannedSessions({
      plan: enriched,
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: 600,
      currentPlannedMinutes: 18 * 60,
    });

    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.length).toBeLessThan(18);
    expect(sessions.every((s) => s.plannedDurationMinutes >= 45 && s.plannedDurationMinutes <= 60)).toBe(
      true,
    );
    expect(sessions.every((s) => s.type === "review" || s.type === "error_correction")).toBe(true);
  });

  it("no desprograma sesiones completadas y solo afecta semana actual", () => {
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
      today: TODAY,
      variant: "lighter",
    });

    expect(
      shouldDescheduleRecoverySession(
        plan,
        {
          id: "done",
          date: TODAY,
          subjectId: "atpl-air-law",
          type: "theory",
          plannedDurationMinutes: 60,
          status: "completed",
          source: "auto",
        },
        WEEK_START,
        ["atpl-air-law"],
      ),
    ).toBe(false);

    expect(
      shouldDescheduleRecoverySession(
        plan,
        {
          id: "future",
          date: "2026-05-27",
          subjectId: "atpl-air-law",
          type: "theory",
          plannedDurationMinutes: 60,
          status: "pending",
          source: "auto",
        },
        WEEK_START,
        ["atpl-air-law"],
      ),
    ).toBe(false);
  });

  it("buildBurnoutRelief calcula reducción 30-40% con 18 sesiones", () => {
    const pending = Array.from({ length: 18 }, (_, index) => ({
      id: `p-${index}`,
      date: TODAY,
      subjectId: "atpl-air-law",
      type: "theory" as const,
      plannedDurationMinutes: 60,
      status: "pending" as const,
      source: "auto" as const,
    }));

    const relief = buildBurnoutRelief(
      {
        activeSubjectIds: ["atpl-air-law"],
        reviewItems: [],
        errorLogItems: [],
        plannedSessions: pending,
        weekStartDate: WEEK_START,
        today: TODAY,
        weeklyGoalMinutes: 600,
      },
      11,
    );

    expect(relief.currentSessionCount).toBe(18);
    expect(relief.proposedSessionCount).toBe(11);
    expect(relief.volumeReductionPercent).toBeGreaterThanOrEqual(30);
    expect(relief.volumeReductionPercent).toBeLessThanOrEqual(40);
    expect(relief.proposedChanges[0]).toMatch(/18 → 11/);
  });

  it("expone mensaje de confirmación para aplicar semana ligera", () => {
    expect(BURNOUT_APPLY_CONFIRM_MESSAGE).toMatch(/no se perderá progreso/i);
  });
});
