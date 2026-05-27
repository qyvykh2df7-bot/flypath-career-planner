import { describe, expect, it } from "vitest";
import type { PlannedStudySession, StudySession } from "./types";
import { getPlannerMetrics } from "./planner-metrics";
import {
  buildStudySessionForPlannedCompletion,
  completePlannedSessionWithLog,
  deleteStudySessionWithPlannedSync,
  reconcilePlannedAndStudyLogs,
} from "./planned-log-sync";
import { normalizeStudyPlannerState } from "./storage";

const WEEK_START = "2026-05-18";
const TODAY = "2026-05-19";

function planned(
  overrides: Partial<PlannedStudySession> & Pick<PlannedStudySession, "id" | "status">,
): PlannedStudySession {
  return {
    date: WEEK_START,
    subjectId: "air-law",
    type: "theory",
    plannedDurationMinutes: 60,
    source: "auto",
    ...overrides,
  };
}

function metrics(plannedSessions: PlannedStudySession[]) {
  return getPlannerMetrics(plannedSessions, { weekStartDate: WEEK_START, today: TODAY });
}

describe("planned-log-sync", () => {
  it("completing a bank session can persist bankArea on the planned block", () => {
    const plannedSessions = [
      planned({ id: "p-bank", status: "pending", type: "question_bank", subjectId: "atpl-meteorology" }),
    ];
    const result = completePlannedSessionWithLog(plannedSessions, [], "p-bank", {
      bankArea: { code: "050-04", title: "Clouds and Fog" },
    });
    expect(result?.plannedSessions[0]?.bankArea).toEqual({
      code: "050-04",
      title: "Clouds and Fog",
    });
  });

  it("1. completing a planned session marks completed and raises metrics", () => {
    const plannedSessions = [planned({ id: "p1", status: "pending" })];
    const result = completePlannedSessionWithLog(plannedSessions, [], "p1");
    expect(result).not.toBeNull();

    const { sessions, plannedSessions: nextPlanned } = result!;
    expect(nextPlanned[0]?.status).toBe("completed");
    expect(nextPlanned[0]?.completedSessionId).toBe(sessions[0]?.id);
    expect(sessions[0]?.linkedPlannedSessionId).toBe("p1");

    const m = metrics(nextPlanned);
    expect(m.completedSessions).toBe(1);
    expect(m.pendingSessions).toBe(0);
    expect(m.weeklyProgressPercent).toBe(100);
    expect(m.completedMinutes).toBe(60);
  });

  it("2. deleting a linked log reverts planned to pending and lowers metrics", () => {
    const plannedSessions = [planned({ id: "p1", status: "pending" })];
    const completed = completePlannedSessionWithLog(plannedSessions, [], "p1")!;
    const logId = completed.sessions[0]!.id;

    const afterDelete = deleteStudySessionWithPlannedSync(
      completed.sessions,
      completed.plannedSessions,
      logId,
    );

    expect(afterDelete.sessions).toHaveLength(0);
    expect(afterDelete.plannedSessions[0]?.status).toBe("pending");
    expect(afterDelete.plannedSessions[0]?.completedSessionId).toBeUndefined();

    const m = metrics(afterDelete.plannedSessions);
    expect(m.completedSessions).toBe(0);
    expect(m.pendingSessions).toBe(1);
    expect(m.weeklyProgressPercent).toBe(0);
    expect(m.completedMinutes).toBe(0);
    expect(m.pendingLikeCount).toBe(1);
  });

  it("3. deleting a free log does not change planned sessions or plan progress", () => {
    const plannedSessions = [planned({ id: "p1", status: "pending" })];
    const freeLog: StudySession = {
      id: "free1",
      date: TODAY,
      subjectId: "air-law",
      type: "theory",
      durationMinutes: 90,
    };

    const afterDelete = deleteStudySessionWithPlannedSync(
      [freeLog],
      plannedSessions,
      "free1",
    );

    expect(afterDelete.sessions).toHaveLength(0);
    expect(afterDelete.plannedSessions[0]?.status).toBe("pending");
    expect(metrics(afterDelete.plannedSessions).weeklyProgressPercent).toBe(0);
  });

  it("4. skipped sessions are unchanged when deleting unrelated free logs", () => {
    const plannedSessions = [planned({ id: "sk1", status: "skipped" })];
    const freeLog: StudySession = {
      id: "free2",
      date: TODAY,
      subjectId: "air-law",
      type: "theory",
      durationMinutes: 45,
    };

    const afterDelete = deleteStudySessionWithPlannedSync(
      [freeLog],
      plannedSessions,
      "free2",
    );

    expect(afterDelete.plannedSessions[0]?.status).toBe("skipped");
    const m = metrics(afterDelete.plannedSessions);
    expect(m.skippedSessions).toBe(1);
    expect(m.completedSessions).toBe(0);
  });

  it("5. reconcile after hydration reverts completed blocks without a log", () => {
    const orphanedLog: StudySession = {
      id: "log-old",
      date: TODAY,
      subjectId: "air-law",
      type: "theory",
      durationMinutes: 60,
      linkedPlannedSessionId: "p1",
    };
    const completedBlock = planned({
      id: "p1",
      status: "completed",
      completedSessionId: "missing-log",
    });

    const reconciled = reconcilePlannedAndStudyLogs([orphanedLog], [completedBlock]);
    expect(reconciled.plannedSessions[0]?.status).toBe("pending");
    expect(reconciled.plannedSessions[0]?.completedSessionId).toBeUndefined();
    expect(reconciled.sessions[0]?.linkedPlannedSessionId).toBeUndefined();
  });

  it("normalizeStudyPlannerState repairs localStorage incoherence", () => {
    const raw = {
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: ["air-law"],
      onboardingCompleted: true,
      sessions: [
        {
          id: "log1",
          date: TODAY,
          subjectId: "air-law",
          type: "theory",
          durationMinutes: 60,
        },
      ],
      plannedSessions: [
        {
          id: "p1",
          date: WEEK_START,
          subjectId: "air-law",
          type: "theory",
          plannedDurationMinutes: 60,
          status: "completed",
          completedSessionId: "gone",
          source: "auto",
        },
      ],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
    };

    const state = normalizeStudyPlannerState(raw);
    expect(state.plannedSessions[0]?.status).toBe("pending");
    expect(state.plannedSessions[0]?.completedSessionId).toBeUndefined();
    expect(state.sessions[0]?.linkedPlannedSessionId).toBeUndefined();
  });

  it("completing mock session can attach mock result for evaluation", () => {
    const plannedSessions = [
      planned({ id: "m1", status: "pending", type: "mock", subjectId: "air-law" }),
    ];
    const result = completePlannedSessionWithLog(plannedSessions, [], "m1", {
      mockScore: 78,
      quality: "good",
    });
    expect(result?.mockResult?.score).toBe(78);
    expect(result?.mockResult?.subjectId).toBe("air-law");
  });

  it("completar clase conserva trainingType y subtema", () => {
    const plannedSessions = [
      planned({
        id: "c1",
        status: "pending",
        type: "class",
        subjectId: "ppl-navigation",
        classTrainingType: "ppl",
        classSubtopic: "GNSS",
      }),
    ];
    const result = completePlannedSessionWithLog(plannedSessions, [], "c1");
    expect(result?.sessions[0]?.classTrainingType).toBe("ppl");
    expect(result?.sessions[0]?.classSubtopic).toBe("GNSS");
    expect(result?.plannedSessions[0]?.classTrainingType).toBe("ppl");
    expect(result?.plannedSessions[0]?.classSubtopic).toBe("GNSS");
  });

  it("localStorage legado sin trainingType en clase asume ATPL", () => {
    const raw = {
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: ["atpl-air-law"],
      onboardingCompleted: true,
      sessions: [],
      plannedSessions: [
        {
          id: "pc1",
          date: WEEK_START,
          subjectId: "atpl-air-law",
          type: "class",
          plannedDurationMinutes: 60,
          status: "pending",
          source: "manual",
          classSubtopic: "International Law: Conventions, Agreements and Organisations",
        },
      ],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
    };
    const state = normalizeStudyPlannerState(raw);
    expect(state.plannedSessions[0]?.classTrainingType).toBe("atpl");
    expect(state.plannedSessions[0]?.classSubtopic).toContain("International Law");
  });

  it("legacy completedSessionId link is reverted on delete without linkedPlannedSessionId", () => {
    const log = buildStudySessionForPlannedCompletion(
      planned({ id: "p1", status: "pending" }),
    );
    const { linkedPlannedSessionId: _link, ...legacyLog } = log;
    const plannedSessions = [
      planned({
        id: "p1",
        status: "completed",
        completedSessionId: legacyLog.id,
      }),
    ];

    const afterDelete = deleteStudySessionWithPlannedSync(
      [legacyLog],
      plannedSessions,
      legacyLog.id,
    );

    expect(afterDelete.plannedSessions[0]?.status).toBe("pending");
  });
});
