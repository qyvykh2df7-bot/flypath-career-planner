import { describe, expect, it } from "vitest";
import { computeCosts } from "./cost-engine";
import type { CostInputs, Profile } from "@/lib/reporting/types/shared";

const baseProfile: Profile = {
  nombre: "Test",
  edad: 24,
  pais: "ES",
  situacionLaboral: "estudiante",
  objetivo: "aerolinea",
  class1: "si",
  class2: "si",
  ingles: "alto",
  icaoLevel: "5",
  preocupacionIngles: "no",
  dineroDisponible: 120000,
  ahorroMensual: 1500,
  financiacion: "confirmada",
  apoyoFamiliar: "no",
  inversionMaxima: 130000,
  toleranciaRiesgo: "media",
  disponibilidad: "full-time",
  horasSemana: 40,
  necesitaTrabajar: "no",
  movilidad: "europa",
  urgencia: "media",
  costEstimateSource: "flypath_base",
};

const baseCosts: CostInputs = {
  ppl: 15000,
  nightRating: 3000,
  atplTheory: 14000,
  hourBuilding: 18000,
  cpl: 23000,
  mep: 7000,
  ir: 20000,
  mccJoc: 6000,
  advancedUprt: 2500,
  class1Medical: 400,
  tasasExamenes: 1500,
  skillTests: 2500,
  equipo: 500,
  headset: 350,
  ipadAppsCartas: 1200,
  uniformeMaterial: 600,
  repeticiones: 2500,
  typeRatingOpcional: 0,
  alojamiento: 12000,
  transporte: 3500,
  comida: 5000,
  otrosGastosVida: 3000,
  bufferPct: 15,
};

describe("cost-engine", () => {
  it("presupuesto suficiente: cobertura alta, brecha baja y riesgo bajo", () => {
    const result = computeCosts(baseCosts, { ...baseProfile, dineroDisponible: 200000 });
    expect(result.coverage).toBeGreaterThanOrEqual(70);
    expect(result.brechaFinanciacion).toBe(0);
    expect(result.riesgoFinanciero).toBe("Bajo");
  });

  it("presupuesto limitado: brecha significativa y riesgo medio/alto", () => {
    const result = computeCosts(
      { ...baseCosts, bufferPct: 10 },
      { ...baseProfile, dineroDisponible: 60000, financiacion: "posible", toleranciaRiesgo: "baja" },
    );
    expect(result.brechaFinanciacion).toBeGreaterThan(20000);
    expect(result.coverage).toBeLessThan(75);
    expect(["Medio", "Alto"]).toContain(result.riesgoFinanciero);
  });

  it("presupuesto muy bajo: brecha alta y riesgo alto/crítico", () => {
    const result = computeCosts(
      { ...baseCosts, bufferPct: 8 },
      { ...baseProfile, dineroDisponible: 10000, financiacion: "no", toleranciaRiesgo: "baja" },
    );
    expect(result.brechaFinanciacion).toBeGreaterThan(80000);
    expect(["Alto", "Crítico"]).toContain(result.riesgoFinanciero);
  });

  it("user_approx: respeta importes aproximados y fallback de nightRating", () => {
    const approxLike = {
      ...baseCosts,
      ppl: 10000,
      atplTheory: 12000,
      hourBuilding: 15000,
      cpl: 18000,
      mep: 5000,
      ir: 17000,
      mccJoc: 5500,
      advancedUprt: 2000,
      class1Medical: 300,
      tasasExamenes: 1000,
      skillTests: 1500,
      headset: 300,
      ipadAppsCartas: 800,
      uniformeMaterial: 400,
      repeticiones: 1200,
      typeRatingOpcional: 0,
      alojamiento: 8000,
      transporte: 2500,
      comida: 4000,
      otrosGastosVida: 2000,
      bufferPct: 12,
      nightRating: undefined,
    } as unknown as CostInputs;
    const result = computeCosts(approxLike, { ...baseProfile, dineroDisponible: 70000 });
    const expectedFormacion =
      10000 + 3000 + 12000 + 15000 + 18000 + 5000 + 17000 + 5500 + 2000;
    expect(result.subtotalFormacion).toBe(expectedFormacion);
  });

  it("buffers: mantiene optimista < realista < conservador", () => {
    const result = computeCosts(baseCosts, baseProfile);
    expect(result.totalOptimista).toBeLessThan(result.totalRealista);
    expect(result.totalRealista).toBeLessThan(result.totalConservador);
  });

  it("meses de brecha: cálculo estable, sin NaN y no negativo", () => {
    const withGap = computeCosts(
      baseCosts,
      { ...baseProfile, dineroDisponible: 30000, ahorroMensual: 1000 },
    );
    expect(Number.isNaN(withGap.mesesCerrarBrecha)).toBe(false);
    expect(withGap.mesesCerrarBrecha).toBeGreaterThanOrEqual(0);

    const noSavings = computeCosts(
      baseCosts,
      { ...baseProfile, dineroDisponible: 30000, ahorroMensual: 0 },
    );
    expect(noSavings.mesesCerrarBrecha).toBe(0);

    const noGap = computeCosts(baseCosts, { ...baseProfile, dineroDisponible: 999999 });
    expect(noGap.mesesCerrarBrecha).toBe(0);
  });
});
