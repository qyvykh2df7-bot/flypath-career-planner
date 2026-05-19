import { describe, expect, it } from "vitest";
import {
  PAST_PLAN_DATE_ERROR,
  canSchedulePlannedSessionOnDate,
  validatePlannedSessionScheduleDate,
} from "./planned-session-scheduling";

const TODAY = "2026-05-19";

describe("planned-session-scheduling", () => {
  it("no permite planificar en días anteriores a hoy", () => {
    expect(canSchedulePlannedSessionOnDate("2026-05-18", TODAY)).toBe(false);
    expect(validatePlannedSessionScheduleDate("2026-05-18", TODAY)).toEqual({
      ok: false,
      error: PAST_PLAN_DATE_ERROR,
    });
  });

  it("permite planificar hoy y días futuros", () => {
    expect(canSchedulePlannedSessionOnDate(TODAY, TODAY)).toBe(true);
    expect(canSchedulePlannedSessionOnDate("2026-05-20", TODAY)).toBe(true);
    expect(validatePlannedSessionScheduleDate("2026-05-20", TODAY)).toEqual({ ok: true });
  });

  it("solo aplica a planificación manual, no al registro histórico de estudio", () => {
    const past = "2026-01-10";
    expect(canSchedulePlannedSessionOnDate(past, TODAY)).toBe(false);
    expect(validatePlannedSessionScheduleDate(past, TODAY).ok).toBe(false);
  });
});
