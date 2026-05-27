import { describe, expect, it } from "vitest";
import { computeRoute } from "./route-engine";
import type { Profile } from "@/lib/reporting/types/shared";

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
  dineroDisponible: 80000,
  ahorroMensual: 1000,
  financiacion: "confirmada",
  apoyoFamiliar: "no",
  inversionMaxima: 90000,
  toleranciaRiesgo: "media",
  disponibilidad: "full-time",
  horasSemana: 40,
  necesitaTrabajar: "no",
  movilidad: "europa",
  urgencia: "media",
  costEstimateSource: "flypath_base",
};

describe("route-engine", () => {
  it("usuario joven con presupuesto alto permite integrada", () => {
    const route = computeRoute(baseProfile);
    expect(route.recommended).toBe("Integrada");
    expect(route.reason).toBe("Encaja por capacidad financiera y disponibilidad full-time.");
  });

  it("usuario con trabajo y presupuesto limitado recomienda modular", () => {
    const route = computeRoute({
      ...baseProfile,
      dineroDisponible: 25000,
      financiacion: "confirmada",
      necesitaTrabajar: "si",
      disponibilidad: "part-time",
    });
    expect(route.recommended).toBe("Modular");
    expect(route.reason).toBe("Encaja por flexibilidad y control de caja por fases.");
  });

  it("usuario sin Class 1 detecta bloqueo principal", () => {
    const route = computeRoute({
      ...baseProfile,
      class1: "no",
    });
    expect(route.principalBlock).toBe("Clase 1 no confirmada");
    expect(route.warnings).toContain("Prioridad: confirma Clase 1 antes de comparar escuelas.");
  });

  it("usuario con inglés bajo mantiene warning y recomendación actual", () => {
    const route = computeRoute({
      ...baseProfile,
      ingles: "bajo",
    });
    expect(route.recommended).toBe("Preparación");
    expect(route.warnings).toContain(
      "Inglés bajo: requiere preparación previa o ruta modular con condición.",
    );
    expect(route.principalBlock).toBe("Inglés operativo insuficiente");
  });

  it("usuario con presupuesto muy bajo detecta riesgo financiero crítico", () => {
    const route = computeRoute({
      ...baseProfile,
      dineroDisponible: 10000,
      financiacion: "no",
    });
    expect(route.warnings).toContain("Presupuesto bajo y sin financiación confirmada.");
    expect(route.principalBlock).toBe("Brecha financiera crítica");
  });
});
