import { describe, expect, it } from "vitest";
import type { TeacherFollowUpComment } from "./types";
import { normalizeStudyPlannerState } from "./storage";
import {
  buildDashboardFollowUpNoticePreview,
  DASHBOARD_FOLLOW_UP_NOTICE_BODY,
  DASHBOARD_FOLLOW_UP_NOTICE_TITLE,
  shouldShowDashboardFollowUpNotice,
} from "./dashboard-follow-up-notice";

const comment: TeacherFollowUpComment = {
  id: "c1",
  date: "2026-05-27",
  category: "class",
  comment: "Texto largo que no debe mostrarse en Home del dashboard principal.",
  nextTask: "Repasar banco completo",
  subjectId: "atpl-air-law",
  createdBy: "student",
};

describe("dashboard-follow-up-notice", () => {
  it("shouldShowDashboardFollowUpNotice is false without comments", () => {
    expect(shouldShowDashboardFollowUpNotice([])).toBe(false);
    expect(shouldShowDashboardFollowUpNotice([], "c1")).toBe(false);
    expect(buildDashboardFollowUpNoticePreview([])).toBeNull();
  });

  it("buildDashboardFollowUpNoticePreview returns title, body and meta without comment text", () => {
    const preview = buildDashboardFollowUpNoticePreview([comment]);
    expect(preview).not.toBeNull();
    expect(preview?.title).toBe(DASHBOARD_FOLLOW_UP_NOTICE_TITLE);
    expect(preview?.body).toBe(DASHBOARD_FOLLOW_UP_NOTICE_BODY);
    expect(preview?.metaLine).toMatch(/Air Law/);
    expect(preview?.metaLine).toMatch(/27 may/);
    expect(JSON.stringify(preview)).not.toContain(comment.comment);
    expect(JSON.stringify(preview)).not.toContain(comment.nextTask);
  });

  it("uses most recent comment for meta line", () => {
    const older: TeacherFollowUpComment = {
      ...comment,
      id: "old",
      date: "2026-05-10",
      subjectId: "atpl-meteorology",
    };
    const preview = buildDashboardFollowUpNoticePreview([older, comment]);
    expect(preview?.latestCommentId).toBe("c1");
    expect(preview?.metaLine).toMatch(/Air Law/);
  });

  it("shouldShowDashboardFollowUpNotice when latest id differs from last seen", () => {
    expect(shouldShowDashboardFollowUpNotice([comment])).toBe(true);
    expect(shouldShowDashboardFollowUpNotice([comment], null)).toBe(true);
    expect(shouldShowDashboardFollowUpNotice([comment], "other-id")).toBe(true);
    expect(shouldShowDashboardFollowUpNotice([comment], "c1")).toBe(false);
  });

  it("new comment after visit shows notice again", () => {
    const older: TeacherFollowUpComment = { ...comment, id: "seen", date: "2026-05-20" };
    const newer: TeacherFollowUpComment = { ...comment, id: "new", date: "2026-05-28" };
    expect(shouldShowDashboardFollowUpNotice([older, newer], "seen")).toBe(true);
    expect(shouldShowDashboardFollowUpNotice([older, newer], "new")).toBe(false);
  });

  it("normalizeStudyPlannerState persists lastSeenFollowUpCommentByMode", () => {
    const state = normalizeStudyPlannerState({
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: [],
      onboardingCompleted: true,
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
      lastSeenFollowUpCommentByMode: { atpl: "c1", ppl: "p2" },
    });
    expect(state.lastSeenFollowUpCommentByMode).toEqual({ atpl: "c1", ppl: "p2" });
  });
});
