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

  it("clips long summary to first sentence", () => {
    const s = formatRecoverySummaryForDisplay(
      "Primero limpia la base. Segunda frase que no debería salir entera si es muy larga.",
    );
    expect(s).toBe("Primero limpia la base.");
  });
});
