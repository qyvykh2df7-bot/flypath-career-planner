import { describe, expect, it } from "vitest";
import { generateRecoveryPlan } from "./recovery";
import {
  pickRecoveryFocusSubjects,
  recoveryPlanToPlannedSessions,
} from "./recovery-apply";
import { computeRecoveryTargetMinutes } from "./recovery-load";

const WEEK_START = "2026-05-18";
const TODAY = "2026-05-19";
const LOAD_9H45 = 585;
const GOAL_10H = 600;

describe("recovery-apply", () => {
  it("prioriza asignaturas con repasos o errores pendientes", () => {
    const focus = pickRecoveryFocusSubjects(
      ["atpl-air-law", "atpl-meteo"],
      [
        {
          id: "r1",
          subjectId: "atpl-meteo",
          topic: "t",
          createdAt: TODAY,
          dueDate: "2026-05-10",
          intervalDays: 1,
          status: "overdue",
        },
      ],
      [],
      TODAY,
    );
    expect(focus[0]).toBe("atpl-meteo");
  });

  it("con semana cargada (~9 h 45 min) no recorta a ~2 h", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["overdue_reviews", "pending_errors"],
      mode: "atpl",
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: GOAL_10H,
    });

    const sessions = recoveryPlanToPlannedSessions({
      plan,
      activeSubjectIds: ["atpl-air-law", "atpl-meteo"],
      reviewItems: [],
      errorLogItems: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: GOAL_10H,
      currentPlannedMinutes: LOAD_9H45,
    });

    const totalMinutes = sessions.reduce((s, p) => s + p.plannedDurationMinutes, 0);
    expect(totalMinutes).toBeGreaterThanOrEqual(Math.round(LOAD_9H45 * 0.6));
    expect(totalMinutes).toBeGreaterThanOrEqual(
      computeRecoveryTargetMinutes({
        variant: "standard",
        selectedProblems: plan.problems,
        currentPlannedMinutes: LOAD_9H45,
        weeklyGoalMinutes: GOAL_10H,
      }) - 15,
    );
    expect(totalMinutes).toBeLessThanOrEqual(LOAD_9H45);
    expect(sessions.every((s) => s.source === "auto" && s.status === "pending")).toBe(true);
    expect(sessions.some((s) => s.type === "review" || s.type === "error_correction")).toBe(true);
  });

  it("versión ligera mantiene repasos/errores y respeta suelo de objetivo", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["burnout", "low_time", "overdue_reviews"],
      mode: "atpl",
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: GOAL_10H,
      variant: "lighter",
    });

    const sessions = recoveryPlanToPlannedSessions({
      plan,
      activeSubjectIds: ["atpl-air-law"],
      reviewItems: [],
      errorLogItems: [],
      weekStartDate: WEEK_START,
      today: TODAY,
      weeklyGoalMinutes: GOAL_10H,
      currentPlannedMinutes: LOAD_9H45,
    });

    const totalMinutes = sessions.reduce((s, p) => s + p.plannedDurationMinutes, 0);
    expect(totalMinutes).toBeGreaterThanOrEqual(Math.round(GOAL_10H * 0.35));
    expect(sessions.every((s) => s.type === "review" || s.type === "error_correction")).toBe(
      true,
    );
  });

  it("no crea bloques sin asignaturas activas", () => {
    const plan = generateRecoveryPlan({
      selectedProblems: ["burnout"],
      mode: "atpl",
      subjects: [],
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      weeklyGoalMinutes: GOAL_10H,
    });

    expect(
      recoveryPlanToPlannedSessions({
        plan,
        activeSubjectIds: [],
        reviewItems: [],
        errorLogItems: [],
        weekStartDate: WEEK_START,
        today: TODAY,
        weeklyGoalMinutes: GOAL_10H,
        currentPlannedMinutes: LOAD_9H45,
      }),
    ).toEqual([]);
  });
});
