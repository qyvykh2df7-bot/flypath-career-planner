import { describe, expect, it } from "vitest";
import type { PlannedStudySession, StudySession } from "./types";
import { getPlannerMetrics } from "./planner-metrics";
import { calculateWeeklyPlanCompletion } from "./calculations";

const WEEK_START = "2026-05-18";
const TODAY = "2026-05-19";

function session(
  overrides: Partial<PlannedStudySession> & Pick<PlannedStudySession, "id" | "status">,
): PlannedStudySession {
  return {
    date: WEEK_START,
    subjectId: "air-law",
    type: "theory",
    plannedDurationMinutes: 45,
    source: "auto",
    ...overrides,
  };
}

function metricsFor(
  plannedSessions: PlannedStudySession[],
  options?: Parameters<typeof getPlannerMetrics>[1],
) {
  return getPlannerMetrics(plannedSessions, {
    weekStartDate: WEEK_START,
    today: TODAY,
    ...options,
  });
}

describe("getPlannerMetrics", () => {
  it("1. single pending session: 0% progress, counts and minutes", () => {
    const planned = [session({ id: "p1", status: "pending", plannedDurationMinutes: 60 })];

    const m = metricsFor(planned);

    expect(m.weeklyProgressPercent).toBe(0);
    expect(m.completedSessions).toBe(0);
    expect(m.pendingSessions).toBe(1);
    expect(m.skippedSessions).toBe(0);
    expect(m.completedMinutes).toBe(0);
    expect(m.totalPlannedMinutes).toBe(60);
    expect(m.pendingMinutes).toBe(60);
    expect(m.pendingLikeCount).toBe(1);
  });

  it("2. single completed session: 100% progress and completed minutes", () => {
    const planned = [session({ id: "c1", status: "completed", plannedDurationMinutes: 50 })];

    const m = metricsFor(planned);

    expect(m.weeklyProgressPercent).toBe(100);
    expect(m.completedSessions).toBe(1);
    expect(m.pendingSessions).toBe(0);
    expect(m.completedMinutes).toBe(50);
    expect(m.totalPlannedMinutes).toBe(50);
  });

  it("3. single skipped session: 0% progress, skipped counts and minutes", () => {
    const planned = [session({ id: "s1", status: "skipped", plannedDurationMinutes: 40 })];

    const m = metricsFor(planned);

    expect(m.weeklyProgressPercent).toBe(0);
    expect(m.completedSessions).toBe(0);
    expect(m.pendingSessions).toBe(0);
    expect(m.skippedSessions).toBe(1);
    expect(m.skippedMinutes).toBe(40);
    expect(m.completedMinutes).toBe(0);
    expect(m.totalPlannedMinutes).toBe(40);
  });

  it("4. mixed plan: progress = completedMinutes / totalPlannedMinutes, never > 100%", () => {
    const planned = [
      session({ id: "c1", status: "completed", plannedDurationMinutes: 60 }),
      session({ id: "p1", status: "pending", plannedDurationMinutes: 45, date: "2026-05-20" }),
      session({ id: "sk1", status: "skipped", plannedDurationMinutes: 30, date: "2026-05-21" }),
    ];

    const m = metricsFor(planned);
    const expectedPercent = Math.min(
      100,
      Math.round((60 / (60 + 45 + 30)) * 100),
    );

    expect(m.completedMinutes).toBe(60);
    expect(m.totalPlannedMinutes).toBe(135);
    expect(m.pendingSessions).toBe(1);
    expect(m.completedSessions).toBe(1);
    expect(m.skippedSessions).toBe(1);
    expect(m.weeklyProgressPercent).toBe(expectedPercent);
    expect(m.weeklyProgressPercent).toBeLessThanOrEqual(100);
  });

  it("5. sessions outside visible week are excluded", () => {
    const inWeek = session({ id: "w1", status: "pending", plannedDurationMinutes: 45 });
    const prevWeek = session({
      id: "old",
      status: "completed",
      plannedDurationMinutes: 120,
      date: "2026-05-11",
    });

    const m = metricsFor([inWeek, prevWeek]);

    expect(m.totalPlannedSessions).toBe(1);
    expect(m.totalPlannedMinutes).toBe(45);
    expect(m.completedSessions).toBe(0);
    expect(m.weekSessions.map((s) => s.id)).toEqual(["w1"]);
  });

  it("6. todaySessions and nextSession reflect today and earliest actionable", () => {
    const planned = [
      session({
        id: "yesterday",
        status: "pending",
        date: WEEK_START,
        startTime: "09:00",
        plannedDurationMinutes: 30,
      }),
      session({
        id: "today-early",
        status: "pending",
        date: TODAY,
        startTime: "08:00",
        plannedDurationMinutes: 45,
      }),
      session({
        id: "today-late",
        status: "completed",
        date: TODAY,
        startTime: "18:00",
        plannedDurationMinutes: 60,
      }),
      session({
        id: "tomorrow",
        status: "pending",
        date: "2026-05-20",
        plannedDurationMinutes: 50,
      }),
    ];

    const m = metricsFor(planned);

    expect(m.todaySessions.map((s) => s.id).sort()).toEqual(["today-early", "today-late"]);
    expect(m.todayPendingSessions).toBe(1);
    expect(m.todayCompletedSessions).toBe(1);
    expect(m.nextSession?.id).toBe("yesterday");
    expect(m.upcomingSessions[0]?.id).toBe("today-early");
  });

  it("7. study logs without completed blocks do not inflate weekly plan progress", () => {
    const planned = [session({ id: "p1", status: "pending", plannedDurationMinutes: 60 })];
    const logs: StudySession[] = [
      {
        id: "log1",
        date: TODAY,
        subjectId: "air-law",
        type: "theory",
        durationMinutes: 180,
      },
    ];

    const withoutLogs = metricsFor(planned);
    const withLogs = metricsFor(planned, { studySessions: logs });

    expect(withoutLogs.weeklyProgressPercent).toBe(0);
    expect(withLogs.weeklyProgressPercent).toBe(0);
    expect(withLogs.completedMinutes).toBe(0);
    expect(withLogs.activeSubjectsTouched).toBe(1);

    const completion = calculateWeeklyPlanCompletion(planned, logs, 0, TODAY);
    expect(completion.completionPercent).toBe(0);
    expect(completion.totalCreditedMinutes).toBe(0);
    expect(completion.actualLoggedMinutes).toBe(180);
  });

  it("legacy planned status normalizes to pending in metrics", () => {
    const legacy = {
      ...session({ id: "legacy", status: "pending" }),
      status: "planned" as unknown as PlannedStudySession["status"],
    };

    const m = metricsFor([legacy]);

    expect(m.pendingSessions).toBe(1);
    expect(m.weeklyProgressPercent).toBe(0);
    expect(m.totalPlannedSessions).toBe(1);
  });
});
