import { describe, expect, it } from "vitest";
import {
  ATPL_BANK_AREAS,
  findBankAreaByCode,
  formatBankAreaLabel,
  getBankAreasForSubject,
  parseBankArea,
} from "./atpl-bank-areas";
import { normalizeStudyPlannerState } from "./storage";
import type { PlannedStudySession } from "./types";

describe("atpl-bank-areas", () => {
  it("maps catalog subject ids to bank areas", () => {
    expect(getBankAreasForSubject("atpl-meteorology").some((a) => a.code === "050-04")).toBe(
      true,
    );
    expect(getBankAreasForSubject("atpl-flight-planning")).toEqual([]);
  });

  it("formats area label for selectors", () => {
    const area = findBankAreaByCode("atpl-meteorology", "050-04");
    expect(area).toBeDefined();
    expect(formatBankAreaLabel(area!)).toBe("050-04 · Clouds and Fog");
  });

  it("parses bankArea from storage shape", () => {
    expect(parseBankArea({ code: "010-01", title: "Test" })).toEqual({
      code: "010-01",
      title: "Test",
    });
    expect(parseBankArea({ code: "", title: "x" })).toBeUndefined();
  });

  it("includes air law and AGK chapters", () => {
    expect(ATPL_BANK_AREAS["atpl-air-law"]?.length).toBeGreaterThan(10);
    expect(ATPL_BANK_AREAS["atpl-aircraft-general-knowledge"]?.some((a) => a.code === "021-09")).toBe(
      true,
    );
  });
});

describe("planned session bankArea persistence", () => {
  const base: PlannedStudySession = {
    id: "p1",
    date: "2026-05-20",
    subjectId: "atpl-meteorology",
    type: "question_bank",
    plannedDurationMinutes: 60,
    status: "pending",
    source: "manual",
    bankArea: { code: "050-04", title: "Clouds and Fog" },
  };

  it("loads sessions with bankArea from localStorage JSON", () => {
    const state = normalizeStudyPlannerState({
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: ["atpl-meteorology"],
      plannedSessions: [base],
      sessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
    });
    expect(state.plannedSessions[0]?.bankArea?.code).toBe("050-04");
  });

  it("keeps legacy sessions without bankArea", () => {
    const { bankArea: _removed, ...legacy } = base;
    const state = normalizeStudyPlannerState({
      mode: "atpl",
      weeklyGoalMinutes: 600,
      activeSubjectIds: ["atpl-meteorology"],
      plannedSessions: [legacy],
      sessions: [],
      mockResults: [],
      reviewItems: [],
      errorLogItems: [],
      examDates: [],
    });
    expect(state.plannedSessions[0]?.bankArea).toBeUndefined();
  });
});
