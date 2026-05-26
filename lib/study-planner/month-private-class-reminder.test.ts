import { describe, expect, it } from "vitest";
import {
  buildMonthPrivateClassReminderCopy,
  getMonthPrivateClassSessions,
} from "./month-private-class-reminder";
import type { PlannedStudySession } from "./types";

function classSession(
  partial: Partial<PlannedStudySession> & Pick<PlannedStudySession, "id" | "date">,
): PlannedStudySession {
  return {
    subjectId: "atpl-air-law",
    type: "class",
    plannedDurationMinutes: 60,
    status: "pending",
    source: "manual",
    ...partial,
  };
}

describe("month-private-class-reminder", () => {
  const planned: PlannedStudySession[] = [
    classSession({ id: "c1", date: "2026-05-26", startTime: "09:00" }),
    classSession({ id: "c2", date: "2026-05-28" }),
    classSession({ id: "t1", date: "2026-05-27", type: "theory" }),
    classSession({ id: "c3", date: "2026-04-30" }),
  ];

  it("filters class sessions in visible month only", () => {
    const may = getMonthPrivateClassSessions(planned, "2026-05-01");
    expect(may.map((s) => s.id)).toEqual(["c1", "c2"]);
  });

  it("builds single-class copy with time", () => {
    const copy = buildMonthPrivateClassReminderCopy([
      classSession({ id: "c1", date: "2026-05-26", startTime: "09:00" }),
    ]);
    expect(copy?.title).toBe("Clase particular programada");
    expect(copy?.body).toContain("09:00");
    expect(copy?.body).toContain("Carlos");
  });

  it("builds multi-date copy with max 3 chips and overflow", () => {
    const sessions = [
      classSession({ id: "1", date: "2026-05-10" }),
      classSession({ id: "2", date: "2026-05-12" }),
      classSession({ id: "3", date: "2026-05-14" }),
      classSession({ id: "4", date: "2026-05-16" }),
      classSession({ id: "5", date: "2026-05-18" }),
    ];
    const copy = buildMonthPrivateClassReminderCopy(sessions);
    expect(copy?.title).toBe("Clases particulares programadas");
    expect(copy?.body).toContain("+ 2 más");
  });

  it("dedupes multiple classes on the same day", () => {
    const sessions = [
      classSession({ id: "1", date: "2026-05-26", startTime: "09:00" }),
      classSession({ id: "2", date: "2026-05-26", startTime: "11:00" }),
      classSession({ id: "3", date: "2026-05-28" }),
    ];
    const copy = buildMonthPrivateClassReminderCopy(sessions);
    expect(copy?.body).not.toContain("· ·");
    expect(copy?.body.match(/26\/05/g)?.length).toBe(1);
  });
});
