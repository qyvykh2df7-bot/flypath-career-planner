import { describe, expect, it } from "vitest";
import { computeDecisionReadiness } from "./readiness-engine";
import type {
  CostComputation,
  Profile,
  ReadinessSchoolAnalyzed,
  RouteRecommendation,
  School,
  SchoolAnalysisSummary,
} from "@/lib/reporting/types/shared";

const stubAnalysis: SchoolAnalysisSummary = {
  claridadCoste: 80,
  transparencia: 80,
  riesgoFinanciero: 30,
  riesgoOperacional: 30,
  riesgoMarketing: 30,
  verificacion: 85,
  encajeGeneral: 80,
  redFlags: [],
  preguntasPendientes: [],
  recomendacionPrudente: "buena claridad documental",
};

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: 1,
    nombre: "Escuela Test",
    pais: "ES",
    ciudad: "Madrid",
    programa: "integrado",
    precioAnunciado: 90000,
    duracionMeses: 18,
    depositoRequerido: 5000,
    calendarioPagosClaro: "si",
    mccIncluido: "si",
    uprtIncluido: "si",
    tasasIncluidas: "si",
    skillTestsIncluidos: "si",
    alojamientoIncluido: "si",
    reembolsoClaro: "si",
    contratoAntesPagar: "si",
    flotaExplicada: "si",
    mantenimientoExplicado: "si",
    ratioAlumnoAvionConocido: "si",
    permiteHablarAlumnos: "si",
    careerSupport: "si",
    promesasEmpleo: "ninguna",
    fuentePrecio: "web_oficial",
    fechaActualizacion: "2026-01-01",
    estadoVerificacion: "verificado",
    enlaceReferencia: "test",
    notas: "",
    ...overrides,
  };
}

function analyzed(school: School): ReadinessSchoolAnalyzed {
  return { school, analysis: stubAnalysis };
}

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
  dineroDisponible: 200000,
  ahorroMensual: 1500,
  financiacion: "confirmada",
  apoyoFamiliar: "no",
  inversionMaxima: 220000,
  toleranciaRiesgo: "media",
  disponibilidad: "full-time",
  horasSemana: 40,
  necesitaTrabajar: "no",
  movilidad: "europa",
  urgencia: "media",
  costEstimateSource: "flypath_base",
};

const goodCosts: CostComputation = {
  subtotalFormacion: 100000,
  subtotalExtras: 10000,
  subtotalVida: 20000,
  buffer: 19500,
  totalOptimista: 117000,
  totalRealista: 149500,
  totalConservador: 156000,
  brechaFinanciacion: 0,
  mesesCerrarBrecha: 0,
  coverage: 95,
  riskScore: 20,
  riesgoFinanciero: "Bajo",
};

const baseRoute: RouteRecommendation = {
  integrated: 70,
  modular: 50,
  prep: 30,
  recommended: "Integrada",
  reason: "test",
  warnings: [],
  conflicts: [],
  principalBlock: "Ningún bloqueo crítico",
};

function shouldPayNow(decision: string): boolean {
  return decision === "Listo para decidir con condiciones";
}

describe("readiness-engine", () => {
  it("Class 1 no validada: decisión prudente y shouldPayNow false", () => {
    const result = computeDecisionReadiness({
      profile: { ...baseProfile, class1: "no" },
      costs: goodCosts,
      route: baseRoute,
      schoolsAnalyzed: [analyzed(makeSchool({ id: 1 })), analyzed(makeSchool({ id: 2, nombre: "B" }))],
      bufferPct: 15,
    });

    expect(shouldPayNow(result.decision)).toBe(false);
    expect(result.decision).toBe("No estás listo para pagar");
    expect(result.bloqueosCriticos).toContain("Clase 1 no confirmado.");
    expect(result.showNoPaguesBadge).toBe(true);
  });

  it("presupuesto insuficiente: shouldPayNow false y faltantes financieros", () => {
    const result = computeDecisionReadiness({
      profile: { ...baseProfile, class1: "si", financiacion: "no", dineroDisponible: 10000 },
      costs: {
        ...goodCosts,
        brechaFinanciacion: 120000,
        coverage: 8,
        totalRealista: 130000,
      },
      route: baseRoute,
      schoolsAnalyzed: [analyzed(makeSchool())],
      bufferPct: 15,
    });

    expect(shouldPayNow(result.decision)).toBe(false);
    expect(
      result.bloqueosCriticos.some((b) => b.includes("financier") || b.includes("cobertura")),
    ).toBe(true);
    expect(result.proximosPasos.length).toBeGreaterThan(0);
  });

  it("menos de 2 escuelas: faltantes de comparación/documentación", () => {
    const result = computeDecisionReadiness({
      profile: baseProfile,
      costs: goodCosts,
      route: baseRoute,
      schoolsAnalyzed: [
        analyzed(
          makeSchool({
            estadoVerificacion: "no_verificado",
            contratoAntesPagar: "no",
            reembolsoClaro: "no",
            calendarioPagosClaro: "no",
            promesasEmpleo: "vagas",
          }),
        ),
      ],
      bufferPct: 15,
    });

    expect(result.faltanDatos).toContain("Comparar al menos 2 escuelas para decidir con criterio.");
    expect(result.proximosPasos).toContain("Comparar al menos 2 escuelas antes de tomar una decisión final.");
  });

  it("buen perfil + escuelas razonables: score alto y decisión favorable", () => {
    const result = computeDecisionReadiness({
      profile: baseProfile,
      costs: goodCosts,
      route: baseRoute,
      schoolsAnalyzed: [
        analyzed(makeSchool({ id: 1, nombre: "A" })),
        analyzed(makeSchool({ id: 2, nombre: "B" })),
      ],
      bufferPct: 15,
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.decision).toBe("Listo para decidir con condiciones");
    expect(shouldPayNow(result.decision)).toBe(true);
  });

  it("inglés bajo: aparece como faltante", () => {
    const result = computeDecisionReadiness({
      profile: { ...baseProfile, ingles: "bajo" },
      costs: goodCosts,
      route: baseRoute,
      schoolsAnalyzed: [analyzed(makeSchool()), analyzed(makeSchool({ id: 2 }))],
      bufferPct: 15,
    });

    expect(result.faltanDatos).toContain("Condición previa: mejorar inglés operativo.");
  });

  it("limpieza de mensajes: sin duplicados ni vacíos en faltanDatos", () => {
    const paymentClearSchool = makeSchool({
      id: 1,
      contratoAntesPagar: "si",
      reembolsoClaro: "si",
      calendarioPagosClaro: "si",
      estadoVerificacion: "verificado",
    });
    const result = computeDecisionReadiness({
      profile: baseProfile,
      costs: goodCosts,
      route: baseRoute,
      schoolsAnalyzed: [analyzed(paymentClearSchool), analyzed(makeSchool({ id: 2, nombre: "B" }))],
      bufferPct: 15,
    });

    const unique = new Set(result.faltanDatos);
    expect(unique.size).toBe(result.faltanDatos.length);
    expect(result.faltanDatos.every((item) => item.trim().length > 0)).toBe(true);
    expect(result.faltanDatos).not.toContain(
      "Falta al menos una escuela con contrato, reembolso y calendario de pagos claros.",
    );
  });
});
