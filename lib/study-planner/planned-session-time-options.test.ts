import { describe, expect, it } from "vitest";
import {
  normalizePlannedSessionStartTime,
  PLANNED_SESSION_START_TIME_OPTIONS,
} from "./planned-session-time-options";

describe("planned-session-time-options", () => {
  it("includes 06:00 through 23:00 every 30 minutes", () => {
    expect(PLANNED_SESSION_START_TIME_OPTIONS[0]).toBe("06:00");
    expect(PLANNED_SESSION_START_TIME_OPTIONS.at(-1)).toBe("23:00");
    expect(PLANNED_SESSION_START_TIME_OPTIONS).toContain("09:30");
    expect(PLANNED_SESSION_START_TIME_OPTIONS).not.toContain("23:30");
  });

  it("keeps valid option values unchanged", () => {
    expect(normalizePlannedSessionStartTime("14:30")).toBe("14:30");
  });

  it("rounds legacy times to the nearest 30-minute slot", () => {
    expect(normalizePlannedSessionStartTime("09:15")).toBe("09:30");
    expect(normalizePlannedSessionStartTime("09:14")).toBe("09:00");
    expect(normalizePlannedSessionStartTime("9:00")).toBe("09:00");
  });

  it("clamps out-of-range times into the selectable window", () => {
    expect(normalizePlannedSessionStartTime("05:00")).toBe("06:00");
    expect(normalizePlannedSessionStartTime("23:45")).toBe("23:00");
  });

  it("falls back when the value is not a time", () => {
    expect(normalizePlannedSessionStartTime("9")).toBe("09:00");
    expect(normalizePlannedSessionStartTime("", "10:00")).toBe("10:00");
  });
});
