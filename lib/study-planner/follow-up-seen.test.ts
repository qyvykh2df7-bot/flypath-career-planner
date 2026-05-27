import { describe, expect, it } from "vitest";
import type { TeacherFollowUpComment } from "./types";
import { getLatestFollowUpComment } from "./teacher-follow-up";
import { shouldShowDashboardFollowUpNotice } from "./dashboard-follow-up-notice";

const base: TeacherFollowUpComment = {
  id: "a",
  date: "2026-05-27",
  category: "general",
  comment: "Hola",
  createdBy: "student",
};

describe("follow-up seen state", () => {
  it("getLatestFollowUpComment picks newest by date then id", () => {
    const older = { ...base, id: "old", date: "2026-05-20" };
    const newer = { ...base, id: "new", date: "2026-05-28" };
    expect(getLatestFollowUpComment([older, newer])?.id).toBe("new");
  });

  it("simulates visit: marking latest id hides notice until newer comment", () => {
    const comments = [base];
    expect(shouldShowDashboardFollowUpNotice(comments)).toBe(true);

    const lastSeenId = getLatestFollowUpComment(comments)!.id;
    expect(shouldShowDashboardFollowUpNotice(comments, lastSeenId)).toBe(false);

    const afterNew = [
      ...comments,
      { ...base, id: "b", date: "2026-05-28", comment: "Nuevo" },
    ];
    expect(shouldShowDashboardFollowUpNotice(afterNew, lastSeenId)).toBe(true);
  });
});
