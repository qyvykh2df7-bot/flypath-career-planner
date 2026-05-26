import { describe, expect, it } from "vitest";
import { getDayCompletionSummary } from "./month-day-completion";
import type { PlannedStudySession } from "./types";

function session(status: PlannedStudySession["status"], id: string): PlannedStudySession {
  return {
    id,
    date: "2026-05-20",
    subjectId: "atpl-air-law",
    type: "theory",
    plannedDurationMinutes: 60,
    status,
    source: "manual",
  };
}

describe("getDayCompletionSummary", () => {
  it("returns none when there are no sessions", () => {
    expect(getDayCompletionSummary([])).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
      state: "none",
    });
  });

  it("returns not_started when 0 of N completed", () => {
    const summary = getDayCompletionSummary([
      session("pending", "a"),
      session("in_progress", "b"),
      session("skipped", "c"),
    ]);
    expect(summary.state).toBe("not_started");
    expect(summary.percent).toBe(0);
    expect(summary.completed).toBe(0);
    expect(summary.total).toBe(3);
  });

  it("returns in_progress with proportional percent", () => {
    const summary = getDayCompletionSummary([
      session("completed", "a"),
      session("pending", "b"),
      session("pending", "c"),
    ]);
    expect(summary.state).toBe("in_progress");
    expect(summary.percent).toBe(33);
    expect(summary.completed).toBe(1);
  });

  it("returns completed when all sessions are done", () => {
    const summary = getDayCompletionSummary([
      session("completed", "a"),
      session("completed", "b"),
    ]);
    expect(summary.state).toBe("completed");
    expect(summary.percent).toBe(100);
  });
});
