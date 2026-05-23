import { describe, expect, it } from "vitest";
import { getWeekDates, getWeekStart } from "../date-utils";
import { generateWeeklyPlan } from "./planning-engine";
import {
  computeWeeklyGoalProration,
  MAX_PLANNED_MINUTES_PER_DAY,
} from "./weekly-goal-proration";

const ACTIVE = ["atpl-air-law", "atpl-agk"];

function baseInput(weekStart: string, referenceDate: string) {
  return {
    mode: "atpl" as const,
    activeSubjectIds: ACTIVE,
    weeklyGoalMinutes: 20 * 60,
    weekStartDate: weekStart,
    referenceDate,
    sessions: [],
    mockResults: [],
    reviewItems: [],
    errorLogItems: [],
  };
}

describe("computeWeeklyGoalProration", () => {
  it("uses full load for future week", () => {
    const r = computeWeeklyGoalProration({
      weeklyGoalMinutes: 1200,
      weekKind: "future",
      eligibleDayCount: 7,
    });
    expect(r.effectiveMinutes).toBe(1200);
    expect(r.prorated).toBe(false);
  });

  it("uses full load when all 7 days are eligible (Monday start)", () => {
    const r = computeWeeklyGoalProration({
      weeklyGoalMinutes: 1200,
      weekKind: "current",
      eligibleDayCount: 7,
    });
    expect(r.effectiveMinutes).toBe(1200);
    expect(r.prorated).toBe(false);
  });

  it("prorates when only 2 days remain (Saturday)", () => {
    const r = computeWeeklyGoalProration({
      weeklyGoalMinutes: 1200,
      weekKind: "current",
      eligibleDayCount: 2,
    });
    expect(r.prorated).toBe(true);
    expect(r.effectiveMinutes).toBe(Math.round((1200 * 2) / 7));
    expect(r.effectiveMinutes).toBeLessThan(1200);
    expect(r.effectiveMinutes).toBeGreaterThan(300);
  });
});

describe("generateWeeklyPlan proration", () => {
  it("Monday generation uses full weekly goal minutes", () => {
    const today = "2026-05-18";
    const weekStart = getWeekStart(today);
    const result = generateWeeklyPlan(baseInput(weekStart, today));
    expect(result.plan).not.toBeNull();
    expect(result.plan!.totalPlannedMinutes).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.code === "reduced_remaining_days")).toBe(false);
    expect(result.plan!.totalPlannedMinutes).toBeGreaterThanOrEqual(1000);

    const byDay = new Map<string, number>();
    for (const b of result.plan!.blocks) {
      byDay.set(b.date, (byDay.get(b.date) ?? 0) + b.plannedMinutes);
    }
    for (const minutes of byDay.values()) {
      expect(minutes).toBeLessThanOrEqual(MAX_PLANNED_MINUTES_PER_DAY);
    }
    for (const [, count] of [...byDay.entries()].map(([date, mins]) => [
      date,
      result.plan!.blocks.filter((b) => b.date === date).length,
    ])) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it("Saturday generation uses proportional load, not full 20h", () => {
    const today = "2026-05-23";
    const weekStart = getWeekStart(today);
    const eligible = getWeekDates(weekStart).filter((d) => d >= today);
    expect(eligible.length).toBe(2);

    const result = generateWeeklyPlan(baseInput(weekStart, today));
    expect(result.plan).not.toBeNull();
    expect(result.warnings.some((w) => w.code === "reduced_remaining_days")).toBe(true);

    const fullGoal = 20 * 60;
    expect(result.plan!.totalPlannedMinutes).toBeLessThan(fullGoal * 0.6);

    const byDay = new Map<string, number>();
    for (const b of result.plan!.blocks) {
      byDay.set(b.date, (byDay.get(b.date) ?? 0) + b.plannedMinutes);
    }
    for (const minutes of byDay.values()) {
      expect(minutes).toBeLessThanOrEqual(MAX_PLANNED_MINUTES_PER_DAY);
    }
    for (const date of eligible) {
      const dayBlocks = result.plan!.blocks.filter((b) => b.date === date);
      expect(dayBlocks.length).toBeLessThanOrEqual(2);
    }
  });

  it("never assigns more than MAX_PLANNED_MINUTES_PER_DAY to any day", () => {
    const today = "2026-05-18";
    const weekStart = getWeekStart(today);
    const result = generateWeeklyPlan({
      ...baseInput(weekStart, today),
      weeklyGoalMinutes: 40 * 60,
    });
    expect(result.plan).not.toBeNull();
    const byDay = new Map<string, number>();
    for (const b of result.plan!.blocks) {
      byDay.set(b.date, (byDay.get(b.date) ?? 0) + b.plannedMinutes);
    }
    for (const minutes of byDay.values()) {
      expect(minutes).toBeLessThanOrEqual(MAX_PLANNED_MINUTES_PER_DAY);
    }
  });
});
