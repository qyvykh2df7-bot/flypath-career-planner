import { describe, expect, it } from "vitest";
import {
  formatRecoveryStepForDisplay,
  formatRecoverySummaryForDisplay,
} from "./recovery-display";

describe("recovery-display", () => {
  it("shortens known step titles", () => {
    const { title } = formatRecoveryStepForDisplay({
      id: "1",
      title: "Reduce temporalmente a 2 asignaturas activas",
      description: "Durante los próximos 7 días, evita abrir más asignaturas.",
      actionType: "reduce_subjects",
    });
    expect(title).toBe("Cierra a 2 asignaturas");
  });

  it("preserves practical summary text", () => {
    const text =
      "Durante los próximos 7 días el plan añadirá unas 5 sesiones en tu calendario.";
    expect(formatRecoverySummaryForDisplay(text)).toBe(text);
  });
});
