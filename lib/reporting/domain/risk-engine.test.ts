import { describe, expect, it } from "vitest";
import {
  buildRiskDiagnosis,
  highestRiskLevel,
  mapRiskRowsForInformePdf,
  riskLevelFromScore,
} from "./risk-engine";

describe("risk-engine", () => {
  it("devuelve highestRiskLevel correcto según el peor riesgo", () => {
    expect(
      highestRiskLevel([
        { label: "A", nivel: "Bajo", explicacion: "", accion: "" },
        { label: "B", nivel: "Alto", explicacion: "", accion: "" },
      ]),
    ).toBe("Alto");
    expect(
      highestRiskLevel([{ label: "A", nivel: "Crítico", explicacion: "", accion: "" }]),
    ).toBe("Crítico");
    expect(highestRiskLevel([])).toBe("Bajo");
  });

  it("mantiene labels y niveles en buildRiskDiagnosis", () => {
    const rows = buildRiskDiagnosis({
      class1: "no",
      ingles: "bajo",
      riesgoFinanciero: "Alto",
      coverage: 45,
      schoolsCount: 1,
      verifiedCount: 0,
      routeConflicts: ["Conflicto de timing detectado"],
      bestSchoolAnalysis: null,
    });

    expect(rows.map((r) => r.label)).toEqual([
      "Riesgo médico",
      "Riesgo financiero",
      "Riesgo de inglés",
      "Riesgo documental",
      "Riesgo de marketing/promesas",
      "Riesgo de timing",
    ]);
    expect(rows[0]?.nivel).toBe("Crítico");
    expect(rows[1]?.nivel).toBe("Alto");
    expect(rows[2]?.nivel).toBe("Alto");
    expect(riskLevelFromScore(75)).toBe("Alto");
  });

  it("mapRiskRowsForInformePdf renombra labels de export sin perder nivel", () => {
    const mapped = mapRiskRowsForInformePdf([
      {
        label: "Riesgo de marketing/promesas",
        nivel: "Medio",
        explicacion: "x",
        accion: "Pedir por escrito alcance real de career support y límites.",
      },
    ]);
    expect(mapped[0]?.label).toBe("Riesgo comercial/marketing");
    expect(mapped[0]?.nivel).toBe("Medio");
  });
});
