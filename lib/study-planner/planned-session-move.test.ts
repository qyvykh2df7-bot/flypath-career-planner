import { describe, expect, it } from "vitest";
import type { PlannedStudySession } from "./types";
import { canMovePlannedSessionToDate, movePlannedSessionToDate } from "./planned-session-move";

const TODAY = "2026-05-20";

function makeSession(overrides: Partial<PlannedStudySession> = {}): PlannedStudySession {
  return {
    id: "p1",
    date: TODAY,
    startTime: "10:00",
    subjectId: "atpl-air-law",
    type: "review",
    plannedDurationMinutes: 60,
    status: "pending",
    source: "manual",
    goal: "Repasar dudas",
    ...overrides,
  };
}

describe("planned-session-move", () => {
  it("pending puede moverse a día futuro", () => {
    const session = makeSession();
    expect(canMovePlannedSessionToDate(session, "2026-05-22", TODAY)).toBe(true);
  });

  it("pending no puede moverse a día pasado", () => {
    const session = makeSession();
    expect(canMovePlannedSessionToDate(session, "2026-05-19", TODAY)).toBe(false);
  });

  it("completed no puede moverse", () => {
    const session = makeSession({ status: "completed" });
    expect(canMovePlannedSessionToDate(session, "2026-05-22", TODAY)).toBe(false);
  });

  it("skipped no puede moverse", () => {
    const session = makeSession({ status: "skipped" });
    expect(canMovePlannedSessionToDate(session, "2026-05-22", TODAY)).toBe(false);
  });

  it("mover sesión actualiza fecha sin cambiar hora/duración/tipo", () => {
    const session = makeSession({
      startTime: "14:30",
      plannedDurationMinutes: 90,
      type: "question_bank",
      source: "auto",
    });
    const moved = movePlannedSessionToDate([session], session.id, "2026-05-23", TODAY);
    expect(moved).toHaveLength(1);
    expect(moved[0]?.date).toBe("2026-05-23");
    expect(moved[0]?.startTime).toBe("14:30");
    expect(moved[0]?.plannedDurationMinutes).toBe(90);
    expect(moved[0]?.type).toBe("question_bank");
    expect(moved[0]?.source).toBe("auto");
  });

  it("no crea duplicados al mover", () => {
    const a = makeSession({ id: "p1" });
    const b = makeSession({ id: "p2", date: "2026-05-21", subjectId: "atpl-meteo" });
    const moved = movePlannedSessionToDate([a, b], "p1", "2026-05-23", TODAY);
    expect(moved).toHaveLength(2);
    expect(moved.map((s) => s.id)).toEqual(["p1", "p2"]);
    expect(moved.filter((s) => s.id === "p1")).toHaveLength(1);
  });
});
