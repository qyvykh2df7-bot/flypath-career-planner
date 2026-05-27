import type {
  ReadinessDecision,
  RoadmapPlan,
  RouteRecommendation,
  School,
  Profile,
} from "@/lib/reporting/types/shared";

export type RoadmapActionPlan = RoadmapPlan;

export type BuildActionPlanInput = {
  profile: Pick<Profile, "class1" | "ingles" | "necesitaTrabajar">;
  costs: {
    brechaFinanciacion: number;
  };
  route: Pick<RouteRecommendation, "recommended">;
  schools: Pick<
    School,
    | "precioAnunciado"
    | "contratoAntesPagar"
    | "reembolsoClaro"
    | "calendarioPagosClaro"
    | "mccIncluido"
    | "uprtIncluido"
    | "tasasIncluidas"
    | "skillTestsIncluidos"
    | "alojamientoIncluido"
  >[];
  decisionReadiness: {
    decision: ReadinessDecision;
  };
};

export function buildActionPlan(input: BuildActionPlanInput): RoadmapActionPlan {
  const { profile, costs, route, schools, decisionReadiness } = input;
  const sevenDays: string[] = [];
  const thirtyDays: string[] = [];
  const ninetyDays: string[] = [];

  const pushUnique = (bucket: string[], text: string) => {
    if (!bucket.includes(text)) bucket.push(text);
  };

  const hasPaymentClearSchool = schools.some(
    (school) =>
      school.contratoAntesPagar === "si" &&
      school.reembolsoClaro === "si" &&
      school.calendarioPagosClaro === "si",
  );

  const hasTwoDocumentedSchools =
    schools.filter(
      (school) =>
        school.precioAnunciado > 0 &&
        school.contratoAntesPagar === "si" &&
        school.reembolsoClaro === "si" &&
        school.calendarioPagosClaro === "si",
    ).length >= 2;

  const missingExtras: string[] = [];
  if (!schools.some((school) => school.mccIncluido === "si")) missingExtras.push("MCC/JOC");
  if (!schools.some((school) => school.uprtIncluido === "si")) missingExtras.push("Advanced UPRT");
  if (!schools.some((school) => school.tasasIncluidas === "si")) missingExtras.push("tasas");
  if (!schools.some((school) => school.skillTestsIncluidos === "si")) missingExtras.push("skill tests");
  if (!schools.some((school) => school.alojamientoIncluido === "si")) missingExtras.push("alojamiento");

  if (profile.class1 !== "si") {
    pushUnique(sevenDays, "Reservar o confirmar Clase 1 antes de comprometer pagos.");
    pushUnique(thirtyDays, "No firmar matrícula ni depósito hasta tener el resultado médico claro.");
    pushUnique(ninetyDays, "Recalcular ruta cuando la Clase 1 esté confirmada.");
  } else {
    pushUnique(sevenDays, "Guardar evidencia de Clase 1 y fecha de validez.");
  }

  if (profile.ingles === "bajo") {
    pushUnique(sevenDays, "Hacer una prueba realista de inglés aeronáutico y general.");
    pushUnique(thirtyDays, "Crear un plan intensivo de inglés antes de iniciar fases caras.");
    pushUnique(ninetyDays, "Reevaluar nivel de inglés antes de pagar una fase avanzada.");
  } else if (profile.ingles === "medio") {
    pushUnique(thirtyDays, "Practicar inglés aeronáutico y comunicaciones ATC semanalmente.");
  }

  if (costs.brechaFinanciacion > 0) {
    pushUnique(sevenDays, "Actualizar presupuesto máximo y brecha financiera real.");
    pushUnique(thirtyDays, "Cerrar financiación o ajustar ruta antes de comprometer pagos grandes.");
    pushUnique(ninetyDays, "Mantener un margen de seguridad financiero antes de avanzar a fases caras.");
  } else {
    pushUnique(
      sevenDays,
      "Confirmar que el dinero disponible cubre también extras y un margen de seguridad financiero.",
    );
    pushUnique(ninetyDays, "Mantener reserva para repeticiones, tasas y retrasos.");
  }

  if (schools.length < 2) {
    pushUnique(sevenDays, "Añadir al menos 2 escuelas comparables.");
    pushUnique(thirtyDays, "Pedir desglose por escrito a cada escuela candidata.");
  } else {
    pushUnique(sevenDays, "Revisar puntos a validar de las escuelas comparadas.");
    pushUnique(thirtyDays, "Confirmar por escrito contrato, reembolso y calendario de pagos.");
  }

  if (!hasPaymentClearSchool) {
    pushUnique(sevenDays, "Pedir contrato, política de reembolso y calendario de pagos antes de decidir.");
  }

  if (route.recommended === "Preparación") {
    pushUnique(thirtyDays, "Resolver bloqueos principales antes de elegir escuela.");
    pushUnique(ninetyDays, "Recalcular ruta cuando Clase 1, inglés y financiación estén más claros.");
  } else if (route.recommended === "Modular") {
    pushUnique(thirtyDays, "Comparar escenarios modular e integrado con el mismo coste total.");
    pushUnique(ninetyDays, "Planificar fases por orden y evitar pagos adelantados innecesarios.");
  } else if (route.recommended === "Integrada") {
    pushUnique(thirtyDays, "Validar que la ruta integrada encaja con disponibilidad full-time y financiación.");
    pushUnique(
      ninetyDays,
      "No avanzar con integrada sin contrato completo y calendario de pagos por escrito.",
    );
  }

  if (profile.necesitaTrabajar === "si") {
    pushUnique(thirtyDays, "Alinear la ruta con el trabajo actual y horas reales disponibles por semana.");
  }

  if (decisionReadiness.decision === "Listo para decidir con condiciones") {
    pushUnique(sevenDays, "Preparar carpeta con contrato, precio final, extras incluidos y condiciones.");
    pushUnique(thirtyDays, "Comparar la escuela elegida con al menos una alternativa real antes de pagar.");
    pushUnique(ninetyDays, "Transferir dinero solo si todas las condiciones finales están por escrito.");
  }

  if (schools.length >= 2 && !hasTwoDocumentedSchools) {
    pushUnique(
      thirtyDays,
      "Completar precio, contrato, reembolso y calendario de pagos en al menos 2 escuelas.",
    );
  }

  if (missingExtras.length > 0) {
    pushUnique(thirtyDays, `Confirmar por escrito si están incluidos: ${missingExtras.join(", ")}.`);
  }

  return {
    sevenDays: sevenDays.slice(0, 4),
    thirtyDays: thirtyDays.slice(0, 4),
    ninetyDays: ninetyDays.slice(0, 4),
  };
}
