import { describe, expect, it } from "vitest";
import {
  computeFlypathSchoolRecommendation,
  computeSchoolStats,
  schoolAnalysis,
} from "./school-engine";
import type { School } from "@/lib/reporting/types/shared";

const TOTAL_REALISTA = 150000;

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
    calendarioPagosClaro: "no_se",
    mccIncluido: "no_se",
    uprtIncluido: "no_se",
    tasasIncluidas: "no_se",
    skillTestsIncluidos: "no_se",
    alojamientoIncluido: "no_se",
    reembolsoClaro: "no_se",
    contratoAntesPagar: "no_se",
    flotaExplicada: "no_se",
    mantenimientoExplicado: "no_se",
    ratioAlumnoAvionConocido: "no_se",
    permiteHablarAlumnos: "no_se",
    careerSupport: "no_se",
    promesasEmpleo: "vagas",
    fuentePrecio: "no_verificado",
    fechaActualizacion: "2026-01-01",
    estadoVerificacion: "pendiente",
    enlaceReferencia: "test",
    notas: "",
    ...overrides,
  };
}

const clearSchool = makeSchool({
  id: 10,
  nombre: "Escuela Clara",
  precioAnunciado: 95000,
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
  promesasEmpleo: "ninguna",
  fuentePrecio: "web_oficial",
  estadoVerificacion: "verificado",
});

describe("school-engine", () => {
  it("0 escuelas: sin comparación ni mejor escuela", () => {
    const stats = computeSchoolStats([], TOTAL_REALISTA);
    const recommendation = computeFlypathSchoolRecommendation(stats.analyzed);

    expect(stats.analyzed).toHaveLength(0);
    expect(stats.verifiedCount).toBe(0);
    expect(stats.bestSchool).toBeNull();
    expect(recommendation.school).toBeNull();
    expect(recommendation.reason).toContain("al menos 2 escuelas");
  });

  it("1 escuela: comparación insuficiente", () => {
    const stats = computeSchoolStats([clearSchool], TOTAL_REALISTA);
    const recommendation = computeFlypathSchoolRecommendation(stats.analyzed);

    expect(stats.analyzed).toHaveLength(1);
    expect(recommendation.school).toBeNull();
    expect(recommendation.reason).toContain("al menos 2 escuelas");
  });

  it("2 escuelas con documentación parcial: pendientes y red flags detectados", () => {
    const partial = makeSchool({ id: 2, nombre: "Parcial", estadoVerificacion: "parcialmente_verificado" });
    const stats = computeSchoolStats([partial, makeSchool({ id: 3, nombre: "Otra" })], TOTAL_REALISTA);
    const analysis = stats.analyzed[0]!.analysis;

    expect(stats.analyzed).toHaveLength(2);
    expect(analysis.preguntasPendientes.length).toBeGreaterThan(0);
    expect(analysis.redFlags.length).toBeGreaterThan(0);
  });

  it("escuela con contrato/precio/extras claros obtiene mejor encaje que escuela incompleta", () => {
    const weak = makeSchool({ id: 20, nombre: "Débil", precioAnunciado: 0 });
    const strong = clearSchool;
    const stats = computeSchoolStats([weak, strong], TOTAL_REALISTA);

    expect(stats.analyzed[1]!.analysis.encajeGeneral).toBeGreaterThan(
      stats.analyzed[0]!.analysis.encajeGeneral,
    );
    expect(stats.bestSchool?.school.nombre).toBe("Escuela Clara");
  });

  it("red flags comerciales/documentales en escuela con promesas vagas", () => {
    const analysis = schoolAnalysis(
      makeSchool({ promesasEmpleo: "vagas", contratoAntesPagar: "no" }),
      TOTAL_REALISTA,
    );

    expect(analysis.redFlags).toContain("Contrato no confirmado antes del pago.");
    expect(analysis.riesgoMarketing).toBeGreaterThan(55);
    expect(analysis.recomendacionPrudente).not.toBe("buena claridad documental");
  });

  it("recomendación con 2 escuelas documentadas mantiene copy histórico favorable", () => {
    const stats = computeSchoolStats(
      [clearSchool, { ...clearSchool, id: 11, nombre: "Escuela B" }],
      TOTAL_REALISTA,
    );
    const recommendation = computeFlypathSchoolRecommendation(stats.analyzed);

    expect(recommendation.school?.nombre).toBe("Escuela Clara");
    expect(recommendation.reason).toContain("opción más sólida");
    expect(recommendation.reason).toContain("confirmar precio, contrato, reembolso y calendario");
  });
});
