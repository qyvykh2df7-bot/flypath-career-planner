import type { Profile, RouteRecommendation } from "@/lib/reporting/types/shared";

function clampRouteScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

/**
 * Mantiene la heurística histórica de recomendación de ruta.
 * No modificar textos, umbrales ni pesos sin una migración explícita.
 */
export function computeRoute(profile: Profile): RouteRecommendation {
  let integrated = 35;
  let modular = 40;
  let prep = 25;
  const warnings: string[] = [];
  const conflicts: string[] = [];

  if (profile.edad < 18) {
    prep += 40;
    warnings.push("Perfil menor de edad: priorizar preparación y madurez operativa.");
  }
  if (profile.class1 !== "si") {
    prep += 45;
    integrated -= 20;
    warnings.push("Prioridad: confirma Clase 1 antes de comparar escuelas.");
  }
  if (profile.ingles === "bajo") {
    prep += 25;
    modular += 8;
    integrated -= 10;
    warnings.push("Inglés bajo: requiere preparación previa o ruta modular con condición.");
  }
  if (profile.dineroDisponible < 30000 && profile.financiacion === "no") {
    prep += 35;
    integrated -= 20;
    warnings.push("Presupuesto bajo y sin financiación confirmada.");
  }
  if (profile.necesitaTrabajar === "si") {
    modular += 20;
    integrated -= 20;
  }
  if (
    profile.dineroDisponible >= 70000 &&
    profile.class1 === "si" &&
    profile.ingles === "alto" &&
    profile.disponibilidad === "full-time"
  ) {
    integrated += 35;
  }
  if (profile.urgencia === "alta" && profile.necesitaTrabajar === "si") {
    conflicts.push("Quieres rapidez alta, pero necesitas trabajar durante la formación.");
  }
  if (profile.edad > 30 && profile.dineroDisponible >= 50000) {
    warnings.push("No se penaliza la edad; enfoca la decisión en coste de oportunidad.");
    integrated += 5;
  }
  if (profile.disponibilidad === "part-time") {
    modular += 8;
  } else {
    integrated += 8;
  }

  integrated = clampRouteScore(integrated);
  modular = clampRouteScore(modular);
  prep = clampRouteScore(prep);

  const ordered = [
    { key: "Integrada", score: integrated },
    { key: "Modular", score: modular },
    { key: "Preparación", score: prep },
  ].sort((a, b) => b.score - a.score);

  const recommended = ordered[0].key as RouteRecommendation["recommended"];
  const reasonMap: Record<RouteRecommendation["recommended"], string> = {
    Integrada: "Encaja por capacidad financiera y disponibilidad full-time.",
    Modular: "Encaja por flexibilidad y control de caja por fases.",
    "Preparación": "Ayuda a reducir riesgo antes de comprometer pagos altos.",
  };

  const principalBlock =
    profile.class1 !== "si"
      ? "Clase 1 no confirmada"
      : profile.ingles === "bajo"
        ? "Inglés operativo insuficiente"
        : profile.financiacion === "no" && profile.dineroDisponible < 30000
          ? "Brecha financiera crítica"
          : "Ningún bloqueo crítico";

  return {
    integrated,
    modular,
    prep,
    recommended,
    reason: reasonMap[recommended],
    warnings,
    conflicts,
    principalBlock,
  };
}
