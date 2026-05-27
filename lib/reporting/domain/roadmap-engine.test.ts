import { describe, expect, it } from "vitest";
import { buildActionPlan } from "./roadmap-engine";

const baseSchool = {
  precioAnunciado: 0,
  contratoAntesPagar: "no_se" as const,
  reembolsoClaro: "no_se" as const,
  calendarioPagosClaro: "no_se" as const,
  mccIncluido: "no_se" as const,
  uprtIncluido: "no_se" as const,
  tasasIncluidas: "no_se" as const,
  skillTestsIncluidos: "no_se" as const,
  alojamientoIncluido: "no_se" as const,
};

describe("roadmap-engine", () => {
  it("devuelve buckets 7/30/90 días", () => {
    const plan = buildActionPlan({
      profile: { class1: "no", ingles: "bajo", necesitaTrabajar: "no" },
      costs: { brechaFinanciacion: 5000 },
      route: { recommended: "Preparación" },
      schools: [baseSchool],
      decisionReadiness: { decision: "No estás listo para pagar" },
    });

    expect(plan).toHaveProperty("sevenDays");
    expect(plan).toHaveProperty("thirtyDays");
    expect(plan).toHaveProperty("ninetyDays");
    expect(Array.isArray(plan.sevenDays)).toBe(true);
    expect(Array.isArray(plan.thirtyDays)).toBe(true);
    expect(Array.isArray(plan.ninetyDays)).toBe(true);
  });

  it("no devuelve arrays vacíos en perfil con bloqueos típicos", () => {
    const plan = buildActionPlan({
      profile: { class1: "no", ingles: "bajo", necesitaTrabajar: "si" },
      costs: { brechaFinanciacion: 10000 },
      route: { recommended: "Modular" },
      schools: [baseSchool, { ...baseSchool, precioAnunciado: 50000 }],
      decisionReadiness: { decision: "Puedes seguir investigando, pero no pagar" },
    });

    expect(plan.sevenDays.length).toBeGreaterThan(0);
    expect(plan.thirtyDays.length).toBeGreaterThan(0);
    expect(plan.ninetyDays.length).toBeGreaterThan(0);
  });
});
