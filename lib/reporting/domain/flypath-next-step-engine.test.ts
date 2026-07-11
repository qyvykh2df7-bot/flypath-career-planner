import { describe, expect, it } from "vitest";
import { pickFlyPathNextSteps, type PickFlyPathNextStepsInput } from "./flypath-next-step-engine";

const baseInput = {
  profile: {
    class1: "si" as const,
    objetivo: "aerolinea" as const,
    ingles: "alto" as const,
    preocupacionIngles: "no" as const,
    financiacion: "confirmada" as const,
  },
  route: { recommended: "Integrada" as const, principalBlock: "Ningún bloqueo crítico" },
  decisionReadiness: { decision: "Listo para decidir con condiciones", faltanDatos: [] as string[] },
  schoolsCount: 2,
  verifiedSchoolsCount: 1,
  costInputs: { atplTheory: 0 },
  costs: { riesgoFinanciero: "Bajo", coverage: 90 },
  riskDiagnosis: [{ label: "Riesgo médico", nivel: "Bajo" }],
} satisfies PickFlyPathNextStepsInput;

describe("flypath-next-step-engine", () => {
  it("nunca recomienda Comparador (escuelas) como principal", () => {
    const scenarios: PickFlyPathNextStepsInput[] = [
      {
        ...baseInput,
        profile: { ...baseInput.profile, class1: "no" as const, objetivo: "no_lo_se" as const },
        route: { recommended: "Preparación" as const, principalBlock: "x" },
        schoolsCount: 0,
        verifiedSchoolsCount: 0,
        decisionReadiness: { decision: "No estás listo para pagar", faltanDatos: ["falta contrato"] },
      },
      {
        ...baseInput,
        profile: { ...baseInput.profile, ingles: "bajo" as const },
        riskDiagnosis: [{ label: "Riesgo de inglés", nivel: "Alto" }],
      },
      {
        ...baseInput,
        decisionReadiness: { decision: "No estás listo para pagar", faltanDatos: ["a", "b"] },
        schoolsCount: 1,
        verifiedSchoolsCount: 0,
        costs: { riesgoFinanciero: "Alto", coverage: 40 },
      },
      {
        ...baseInput,
        costInputs: { atplTheory: 120 },
        decisionReadiness: { decision: "Listo para decidir con condiciones", faltanDatos: ["repaso ATPL"] },
      },
    ];

    for (const input of scenarios) {
      const { primary } = pickFlyPathNextSteps(input);
      expect(["guia", "mentoria", "ingles"]).toContain(primary);
      expect(primary).not.toBe("escuelas");
    }
  });

  it("mantiene Mentoría, Guía e Inglés como principales según contexto", () => {
    expect(
      pickFlyPathNextSteps({
        ...baseInput,
        profile: { ...baseInput.profile, class1: "no", objetivo: "no_lo_se" },
        route: { recommended: "Preparación", principalBlock: "x" },
        schoolsCount: 2,
        verifiedSchoolsCount: 2,
        decisionReadiness: { decision: "Listo para decidir con condiciones", faltanDatos: [] },
      }).primary,
    ).toBe("guia");

    expect(
      pickFlyPathNextSteps({
        ...baseInput,
        decisionReadiness: { decision: "No estás listo para pagar", faltanDatos: ["x", "y"] },
        schoolsCount: 1,
        costs: { riesgoFinanciero: "Alto", coverage: 50 },
      }).primary,
    ).toBe("mentoria");

    expect(
      pickFlyPathNextSteps({
        ...baseInput,
        profile: { ...baseInput.profile, ingles: "bajo" },
        riskDiagnosis: [{ label: "Riesgo de inglés", nivel: "Alto" }],
      }).primary,
    ).toBe("ingles");
  });

  it("solo recomienda productos FlyPath activos como secundarias", () => {
    const { primary, secondaryIds } = pickFlyPathNextSteps({
      ...baseInput,
      costInputs: { atplTheory: 200 },
      decisionReadiness: {
        decision: "Listo para decidir con condiciones",
        faltanDatos: ["repaso asignatura ATPL"],
      },
    });

    expect(["guia", "mentoria", "ingles"]).toContain(primary);
    for (const id of secondaryIds) {
      expect(["guia", "mentoria", "ingles", "escuelas"]).toContain(id);
    }
  });
});
