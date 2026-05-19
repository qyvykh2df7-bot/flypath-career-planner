import { describe, expect, it } from "vitest";
import type { PlannedStudySession } from "./types";
import {
  getStudyLogSaveFeedback,
  nextPendingIdAfterComplete,
  REGISTER_STUDY_LINK_LABEL,
  shouldShowPlanConfirmCard,
  sortTodayPending,
  STUDY_LOG_FEEDBACK,
} from "./study-log-form-logic";

const TODAY = "2026-05-19";

function planned(
  overrides: Partial<PlannedStudySession> & Pick<PlannedStudySession, "id" | "status">,
): PlannedStudySession {
  return {
    date: TODAY,
    subjectId: "atpl-air-law",
    type: "theory",
    plannedDurationMinutes: 45,
    source: "auto",
    ...overrides,
  };
}

describe("study-log-form-logic", () => {
  it("shouldShowPlanConfirmCard only for plan_block with pending selection", () => {
    const pending = [planned({ id: "p1", status: "pending" })];
    expect(shouldShowPlanConfirmCard("plan_block", pending, "p1")).toBe(true);
    expect(shouldShowPlanConfirmCard("free_study", pending, "p1")).toBe(false);
    expect(shouldShowPlanConfirmCard("plan_block", [], "p1")).toBe(false);
    expect(shouldShowPlanConfirmCard("plan_block", pending, "other")).toBe(false);
  });

  it("nextPendingIdAfterComplete returns siguiente pendiente", () => {
    const pending = [
      planned({ id: "p1", status: "pending" }),
      planned({ id: "p2", status: "pending", subjectId: "atpl-meteorology" }),
    ];
    expect(nextPendingIdAfterComplete(pending, "p1")).toBe("p2");
    expect(nextPendingIdAfterComplete(pending, "p2")).toBe("p1");
    expect(nextPendingIdAfterComplete([planned({ id: "p1", status: "pending" })], "p1")).toBeNull();
  });

  it("sortTodayPending excludes completed", () => {
    const all = [
      planned({ id: "done", status: "completed" }),
      planned({ id: "p1", status: "pending" }),
    ];
    expect(sortTodayPending(all, TODAY).map((p) => p.id)).toEqual(["p1"]);
  });

  it("getStudyLogSaveFeedback messages", () => {
    expect(getStudyLogSaveFeedback(true)).toBe(STUDY_LOG_FEEDBACK.planBlockSaved);
    expect(getStudyLogSaveFeedback(false)).toBe(STUDY_LOG_FEEDBACK.freeStudySaved);
  });

  it("REGISTER_STUDY_LINK_LABEL is Registrar estudio", () => {
    expect(REGISTER_STUDY_LINK_LABEL).toBe("Registrar estudio");
  });
});
