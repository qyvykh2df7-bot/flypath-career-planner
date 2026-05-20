import { describe, expect, it } from "vitest";
import { formatWeeklyBlockPosition } from "./dashboard-week-pace";

describe("formatWeeklyBlockPosition", () => {
  it("devuelve bloque siguiente 1-based", () => {
    expect(formatWeeklyBlockPosition(0, 13)).toBe("Bloque 1 de 13");
    expect(formatWeeklyBlockPosition(3, 13)).toBe("Bloque 4 de 13");
  });

  it("sin plan no devuelve línea", () => {
    expect(formatWeeklyBlockPosition(0, 0)).toBeUndefined();
  });
});
