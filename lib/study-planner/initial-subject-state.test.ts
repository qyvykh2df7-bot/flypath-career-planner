import { describe, expect, it } from "vitest";
import { DEFAULT_ATPL_PLANNER_STATE } from "./types";
import { normalizeStudyPlannerState } from "./storage";
import {
  buildDefaultInitialSubjectStates,
  declaredStageToMaturityPhase,
  hasRealStudyDataFromStats,
  isSubjectDeclaredPassed,
  resolveSubjectMaturityPhaseWithGetter,
} from "./initial-subject-state";
import {
  buildSubjectStudyStats,
  getSubjectMaturityPhase,
  pickSessionTypeForMaturity,
} from "./planning/subject-maturity";
import { rankSubjectsByPriority } from "./planning/planning-engine";
import type { PlanningEngineInput } from "./planning/planning-types";

const SUBJECT = "atpl-air-law";
const OTHER = "atpl-meteorology";

function baseInput(overrides: Partial<PlanningEngineInput> = {}): PlanningEngineInput {
  return {
    mode: "atpl",
    activeSubjectIds: [SUBJECT, OTHER],
    weeklyGoalMinutes: 600,
    weekStartDate: "2026-05-19",
    referenceDate: "2026-05-19",
    sessions: [],
    mockResults: [],
    ...overrides,
  };
}

function emptyStats(subjectId = SUBJECT) {
  return buildSubjectStudyStats({
    subjectId,
    sessions: [],
    referenceDate: "2026-05-19",
    progressPercent: 0,
    latestMockScore: null,
    examDaysLeft: null,
  });
}

describe("initial-subject-state", () => {
  it("legacy storage without initial fields loads safely", () => {
    const legacy = {
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: [SUBJECT],
      onboardingCompleted: true,
      sessions: [],
      plannedSessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
    };
    const normalized = normalizeStudyPlannerState(legacy);
    expect(normalized.initialStudyContext).toBeUndefined();
    expect(normalized.initialSubjectStates).toBeUndefined();
    expect(normalized.sessions).toEqual([]);
  });

  it("default state matches previous behavior", () => {
    expect(DEFAULT_ATPL_PLANNER_STATE.initialSubjectStates).toBeUndefined();
  });

  it("not_started maps to initial phase", () => {
    expect(declaredStageToMaturityPhase("not_started")).toBe("initial");
  });

  it("base_initial maps to building", () => {
    expect(declaredStageToMaturityPhase("base_initial")).toBe("building");
  });

  it("mostly_bank maps to consolidation and picks question_bank early", () => {
    const phase = declaredStageToMaturityPhase("mostly_bank");
    expect(phase).toBe("consolidation");
    const stats = emptyStats();
    const picked = pickSessionTypeForMaturity({
      phase,
      subjectBlockIndex: 0,
      stats,
      errorSlotUsed: false,
      reviewSlotUsed: false,
      mockSlotUsed: false,
    });
    expect(picked.type).toBe("question_bank");
  });

  it("exam_prep maps to exam phase", () => {
    expect(declaredStageToMaturityPhase("exam_prep")).toBe("exam");
  });

  it("passed subject is not prioritized in generator", () => {
    const ranked = rankSubjectsByPriority(
      baseInput({
        initialSubjectStates: [
          { subjectId: SUBJECT, declaredStage: "passed" },
          { subjectId: OTHER, declaredStage: "in_progress" },
        ],
      }),
    );
    const passed = ranked.find((r) => r.subjectId === SUBJECT);
    const active = ranked.find((r) => r.subjectId === OTHER);
    expect(passed?.score).toBe(0);
    expect((active?.score ?? 0) > 0).toBe(true);
    expect(isSubjectDeclaredPassed(SUBJECT, [{ subjectId: SUBJECT, declaredStage: "passed" }])).toBe(
      true,
    );
  });

  it("real study data overrides declared exam_prep when sessions exist", () => {
    const stats = buildSubjectStudyStats({
      subjectId: SUBJECT,
      sessions: [
        {
          id: "1",
          date: "2026-05-19",
          subjectId: SUBJECT,
          type: "theory",
          durationMinutes: 45,
        },
      ],
      referenceDate: "2026-05-19",
      progressPercent: 5,
      latestMockScore: null,
      examDaysLeft: null,
    });
    expect(hasRealStudyDataFromStats(stats)).toBe(true);

    const phase = resolveSubjectMaturityPhaseWithGetter(
      stats,
      { subjectId: SUBJECT, declaredStage: "exam_prep" },
      getSubjectMaturityPhase,
    );
    expect(phase).toBe("building");
  });

  it("in_progress with estimated progress uses consolidation when no real data", () => {
    const stats = emptyStats();
    const phase = resolveSubjectMaturityPhaseWithGetter(
      stats,
      {
        subjectId: SUBJECT,
        declaredStage: "in_progress",
        estimatedProgressPercent: 40,
      },
      getSubjectMaturityPhase,
    );
    expect(phase).toBe("consolidation");
  });

  it("buildDefaultInitialSubjectStates for from_zero", () => {
    const states = buildDefaultInitialSubjectStates([SUBJECT, OTHER], "from_zero");
    expect(states.every((s) => s.declaredStage === "not_started")).toBe(true);
  });
});
