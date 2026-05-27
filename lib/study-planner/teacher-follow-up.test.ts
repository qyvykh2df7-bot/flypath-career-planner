import { describe, expect, it } from "vitest";
import type { PlannedStudySession, TeacherFollowUpComment } from "./types";
import { normalizeStudyPlannerState } from "./storage";
import {
  buildFlyPathFollowUpSummary,
  buildPlanClassSessionPreset,
  buildRecommendedFollowUpTasks,
  filterFollowUpCommentsByMode,
  sortFollowUpCommentsDesc,
} from "./teacher-follow-up";

const TODAY = "2026-05-20";

function comment(
  partial: Partial<TeacherFollowUpComment> & Pick<TeacherFollowUpComment, "id" | "date" | "comment">,
): TeacherFollowUpComment {
  return {
    category: "general",
    createdBy: "student",
    ...partial,
  };
}

describe("teacher-follow-up", () => {
  it("buildFlyPathFollowUpSummary returns empty state without comments", () => {
    const summary = buildFlyPathFollowUpSummary([], [], TODAY);
    expect(summary.latestComment).toBeNull();
    expect(summary.nextObjective).toBeNull();
    expect(summary.nextClass).toBeNull();
    expect(summary.generalStatus).toBe("Sin seguimiento registrado");
  });

  it("buildRecommendedFollowUpTasks dedupes and orders from recent comments", () => {
    const comments: TeacherFollowUpComment[] = [
      comment({
        id: "a",
        date: "2026-05-18",
        comment: "Old",
        nextTask: "Repasar Meteorology",
      }),
      comment({
        id: "b",
        date: "2026-05-19",
        comment: "New",
        nextTask: "Hacer banco de Air Law",
      }),
      comment({
        id: "c",
        date: "2026-05-18",
        comment: "Dup",
        nextTask: "repasar meteorology",
      }),
    ];
    const tasks = buildRecommendedFollowUpTasks(comments);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]?.label).toBe("Hacer banco de Air Law");
  });

  it("buildFlyPathFollowUpSummary picks next class and objective", () => {
    const comments: TeacherFollowUpComment[] = [
      comment({
        id: "1",
        date: TODAY,
        comment: "Buen progreso",
        nextTask: "Repasar Instrumentation",
        category: "class",
      }),
    ];
    const planned: PlannedStudySession[] = [
      {
        id: "p1",
        date: "2026-05-22",
        subjectId: "atpl-air-law",
        type: "class",
        plannedDurationMinutes: 60,
        status: "pending",
        source: "manual",
        startTime: "10:00",
      },
    ];
    const summary = buildFlyPathFollowUpSummary(comments, planned, TODAY);
    expect(summary.latestComment?.id).toBe("1");
    expect(summary.nextObjective).toBe("Repasar Instrumentation");
    expect(summary.nextClass?.subjectId).toBe("atpl-air-law");
    expect(summary.generalStatus).toContain("tarea");
  });

  it("filterFollowUpCommentsByMode keeps general and mode subjects", () => {
    const comments: TeacherFollowUpComment[] = [
      comment({ id: "g", date: "2026-05-18", comment: "General" }),
      comment({
        id: "a",
        date: TODAY,
        comment: "ATPL",
        subjectId: "atpl-air-law",
      }),
      comment({
        id: "p",
        date: TODAY,
        comment: "PPL only",
        subjectId: "ppl-air-law",
      }),
    ];
    const atpl = filterFollowUpCommentsByMode(comments, "atpl");
    expect(atpl.map((c) => c.id).sort()).toEqual(["a", "g"]);
    expect(sortFollowUpCommentsDesc(atpl)[0]?.id).toBe("a");
  });

  it("normalizeStudyPlannerState persists teacherFollowUpComments from localStorage shape", () => {
    const raw = {
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: ["atpl-air-law"],
      onboardingCompleted: true,
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
      teacherFollowUpComments: [
        {
          id: "c1",
          date: TODAY,
          category: "study",
          comment: "Repaso banco",
          nextTask: "Hacer banco de Air Law",
          createdBy: "student",
          subjectId: "atpl-air-law",
        },
      ],
    };
    const state = normalizeStudyPlannerState(raw);
    expect(state.teacherFollowUpComments).toHaveLength(1);
    expect(state.teacherFollowUpComments?.[0]?.nextTask).toBe("Hacer banco de Air Law");
    const tasks = buildRecommendedFollowUpTasks(state.teacherFollowUpComments ?? []);
    expect(tasks[0]?.label).toBe("Hacer banco de Air Law");
  });

  it("buildPlanClassSessionPreset uses latest comment subject or leaves empty", () => {
    const withSubject = buildPlanClassSessionPreset(
      [
        comment({
          id: "1",
          date: TODAY,
          comment: "Clase",
          subjectId: "atpl-air-law",
        }),
      ],
      [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }],
      TODAY,
    );
    expect(withSubject.type).toBe("class");
    expect(withSubject.subjectId).toBe("atpl-air-law");

    const empty = buildPlanClassSessionPreset([], [{ id: "atpl-air-law", name: "Air Law", mode: "atpl" }], TODAY);
    expect(empty.type).toBe("class");
    expect(empty.leaveSubjectEmpty).toBe(true);
    expect(empty.subjectId).toBeUndefined();
  });

  it("legacy state without follow-up comments still loads", () => {
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
    });
    expect(state.teacherFollowUpComments).toBeUndefined();
    expect(buildFlyPathFollowUpSummary([], [], TODAY).latestComment).toBeNull();
  });
});
