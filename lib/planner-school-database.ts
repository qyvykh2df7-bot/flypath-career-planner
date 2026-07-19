import { getComparableSchools, getSchoolBySlug } from "@/lib/schools/schoolUtils";
import type { School, YesNoUnknown } from "@/lib/reporting/types/shared";
import type { DataStatus, SchoolEntry } from "@/types/schools";

export type PlannerProgramOption = {
  key: string;
  label: string;
  programa: School["programa"];
  precioAnunciado: number;
  duracionMeses: number;
};

const MULTI_PROGRAM_SLUGS = new Set([
  "european-flyers",
  "adventia-usal",
  "one-air",
  "eas-barcelona",
  "fte-jerez",
  "cesda-urv",
  "barcelona-flight-school",
  "mediterranean-flight-school",
  "quality-fly",
  "aerodynamics-academy",
  "baa-training-spain",
  "panamedia-escuela-de-pilotos",
  "flyschool-air-academy",
  "world-aviation-ato",
  "airpull-aviation-academy",
  "flyby-aviation-academy",
  "aero-link-flight-academy",
  "aeroflota-del-noroeste-afn",
  "canavia-flight-school",
  "corflight-school",
  "leading-edge-aviation-leap-alhama",
]);

const MODULAR_PRICE_BY_SLUG: Partial<Record<string, number>> = {
  "european-flyers": 56425,
  "adventia-usal": 72470,
  "eas-barcelona": 78500,
  "fte-jerez": 89900,
  "barcelona-flight-school": 62400,
  "baa-training-spain": 72400,
  "panamedia-escuela-de-pilotos": 68900,
  "aerodynamics-academy": 55200,
  "canavia-flight-school": 79900,
  "corflight-school": 68500,
};

const UNIVERSITY_PRICE_BY_SLUG: Partial<Record<string, number>> = {
  "adventia-usal": 72470,
  "flyby-aviation-academy": 95000,
};

export function getPlannerSchoolCatalog(): SchoolEntry[] {
  return [...getComparableSchools()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export function supportsPlannerMultiProgram(slug: string): boolean {
  return MULTI_PROGRAM_SLUGS.has(slug);
}

export function parsePlannerSchoolLink(enlaceReferencia: string): { slug: string; profileKey: string } | null {
  if (!enlaceReferencia.startsWith("comparador:")) return null;
  const parts = enlaceReferencia.slice("comparador:".length).split(":");
  if (!parts[0]) return null;
  return { slug: parts[0], profileKey: parts[1] || "default" };
}

export function buildPlannerSchoolLink(slug: string, profileKey: string): string {
  return `comparador:${slug}:${profileKey}`;
}

function modularPriceForEntry(entry: SchoolEntry): number {
  return (
    MODULAR_PRICE_BY_SLUG[entry.slug] ??
    (entry.flypathEstimatedRealCostEUR > 0 ? entry.flypathEstimatedRealCostEUR : entry.advertisedPriceEUR)
  );
}

function universityPriceForEntry(entry: SchoolEntry): number {
  return UNIVERSITY_PRICE_BY_SLUG[entry.slug] ?? entry.advertisedPriceEUR;
}

export function getProgramOptionsForEntry(entry: SchoolEntry): PlannerProgramOption[] {
  const options: PlannerProgramOption[] = [];
  const add = (key: string, label: string, programa: School["programa"], price: number, months: number) => {
    if (options.some((o) => o.key === key)) return;
    options.push({
      key,
      label,
      programa,
      precioAnunciado: Math.max(0, price),
      duracionMeses: months > 0 ? months : entry.programDurationMonths || 18,
    });
  };

  if (entry.slug === "cesda-urv") {
    add("degree", "Carrera universitaria", "no_lo_se", entry.advertisedPriceEUR, entry.programDurationMonths);
    return options;
  }

  if (entry.routeType === "modular" && !supportsPlannerMultiProgram(entry.slug)) {
    add("modular", "Modular", "modular", entry.advertisedPriceEUR, entry.programDurationMonths);
    return options;
  }

  if (entry.routeType === "integrated" || supportsPlannerMultiProgram(entry.slug)) {
    add("integrated", "Integrado", "integrado", entry.advertisedPriceEUR, entry.programDurationMonths);
  }

  if (supportsPlannerMultiProgram(entry.slug)) {
    add("modular", "Modular", "modular", modularPriceForEntry(entry), entry.programDurationMonths);
  }

  if (entry.routeType === "university_plus_license" || entry.universityTrack || entry.slug === "adventia-usal") {
    add("university", "Carrera universitaria", "no_lo_se", universityPriceForEntry(entry), entry.programDurationMonths);
  }

  if (options.length === 0) {
    const label =
      entry.routeType === "integrated"
        ? "Integrado"
        : entry.routeType === "modular"
          ? "Modular"
          : "Carrera universitaria";
    const programa =
      entry.routeType === "integrated" ? "integrado" : entry.routeType === "modular" ? "modular" : "no_lo_se";
    add("default", label, programa, entry.advertisedPriceEUR, entry.programDurationMonths);
  }

  return options;
}

function mapYesNoOptionalUnknownToPlanner(value: "yes" | "no" | "optional" | "unknown"): YesNoUnknown {
  if (value === "yes") return "si";
  if (value === "no") return "no";
  return "no_se";
}

function mapYesNoUnknownToPlanner(value: "yes" | "no" | "unknown"): YesNoUnknown {
  if (value === "yes") return "si";
  if (value === "no") return "no";
  return "no_se";
}

function mapYesNoPartialUnknownToPlanner(value: "yes" | "no" | "partial" | "unknown"): YesNoUnknown {
  if (value === "yes") return "si";
  if (value === "no") return "no";
  return "no_se";
}

function mapEmploymentClaimsToPlanner(value: SchoolEntry["employmentClaimsType"]): School["promesasEmpleo"] {
  if (value === "none") return "ninguna";
  if (value === "vague") return "vagas";
  if (value === "clear_non_guaranteed") return "claras_no_garantizadas";
  if (value === "guaranteed_claimed") return "garantia_contractual";
  return "no_se";
}

export function mapDataStatusToEstadoVerificacion(dataStatus: DataStatus): School["estadoVerificacion"] {
  if (dataStatus === "verified") return "verificado";
  if (dataStatus === "partial") return "parcialmente_verificado";
  if (dataStatus === "unknown") return "pendiente";
  return "no_verificado";
}

/** Estado efectivo: catálogo FlyPath si aplica, si no el guardado en la escuela. */
export function resolvePlannerSchoolEstadoVerificacion(school: School): School["estadoVerificacion"] {
  const link = parsePlannerSchoolLink(school.enlaceReferencia);
  if (link) {
    const entry = getSchoolBySlug(link.slug);
    if (entry) return mapDataStatusToEstadoVerificacion(entry.dataStatus);
  }
  return school.estadoVerificacion;
}

export function isPlannerSchoolVerificada(school: School): boolean {
  return resolvePlannerSchoolEstadoVerificacion(school) === "verificado";
}

/** Mapea escuela FlyPath + programa elegido al modelo School del planner. */
export function mapEntryOptionToPlannerSchool(
  source: SchoolEntry,
  option: PlannerProgramOption,
  id: number,
): School {
  const paymentText = source.paymentScheduleSummary.trim().toLowerCase();
  const refundText = source.refundPolicySummary.trim().toLowerCase();
  const supportText = source.jobSupportSummary.trim().toLowerCase();

  const calendarioPagosClaro: YesNoUnknown = paymentText.length > 0 ? "si" : "no_se";
  const reembolsoClaro: YesNoUnknown =
    refundText.includes("sin") || refundText.includes("no ")
      ? "no"
      : refundText.length > 0
        ? "si"
        : "no_se";
  const careerSupport: YesNoUnknown = supportText.length > 0 ? "si" : "no_se";

  return {
    id,
    nombre: source.name,
    pais: source.country,
    ciudad: source.city,
    programa: option.programa,
    precioAnunciado: option.precioAnunciado,
    duracionMeses: option.duracionMeses,
    depositoRequerido: source.depositOrEnrollmentFeeEUR,
    calendarioPagosClaro,
    mccIncluido: mapYesNoOptionalUnknownToPlanner(source.mccJocIncluded),
    uprtIncluido: mapYesNoOptionalUnknownToPlanner(source.advancedUprtIncluded),
    tasasIncluidas: mapYesNoUnknownToPlanner(source.examFeesIncluded),
    skillTestsIncluidos: mapYesNoUnknownToPlanner(source.skillTestsIncluded),
    alojamientoIncluido: mapYesNoOptionalUnknownToPlanner(source.accommodationIncluded),
    reembolsoClaro,
    contratoAntesPagar: mapYesNoPartialUnknownToPlanner(source.contractAvailableBeforePayment),
    flotaExplicada: source.fleetSummary.trim().length > 0 ? "si" : "no_se",
    mantenimientoExplicado: "no_se",
    ratioAlumnoAvionConocido: source.studentAircraftRatio ? "si" : "no_se",
    permiteHablarAlumnos: "no_se",
    careerSupport,
    promesasEmpleo: mapEmploymentClaimsToPlanner(source.employmentClaimsType),
    fuentePrecio: "no_verificado",
    fechaActualizacion: source.lastUpdatedAt,
    estadoVerificacion: mapDataStatusToEstadoVerificacion(source.dataStatus),
    enlaceReferencia: buildPlannerSchoolLink(source.slug, option.key),
    notas: `FlyPath · ${option.label}`,
  };
}

/** Compat: importación legacy desde comparador sin programa explícito. */
export function mapComparatorSchoolToPlannerSchool(source: SchoolEntry, id: number): School {
  const options = getProgramOptionsForEntry(source);
  const preferred = options[0]!;
  return mapEntryOptionToPlannerSchool(source, preferred, id);
}

export function programaDisplayLabel(programa: School["programa"]): string {
  if (programa === "integrado") return "Integrado";
  if (programa === "modular") return "Modular";
  if (programa === "cadet") return "Cadet";
  return "No definido";
}

/** Etiqueta para pill de programa en cards (alineada con switches de BD). */
export function schoolProgramPillLabel(programa: School["programa"]): string {
  if (programa === "integrado") return "Integrado";
  if (programa === "modular") return "Modular";
  if (programa === "cadet") return "Cadet";
  if (programa === "no_lo_se") return "Carrera universitaria";
  return "No definido";
}

export function isPlannerFlypathDatabaseSchool(school: School): boolean {
  return Boolean(parsePlannerSchoolLink(school.enlaceReferencia));
}

/** Contador «Verificadas»: escuelas con estado de verificación = verificado (FlyPath o manual). */
export function countPlannerVerifiedSchools(schools: School[]): number {
  return schools.filter(isPlannerSchoolVerificada).length;
}

export function plannerSchoolReviewsHref(slug: string | null): string {
  if (!slug) return "/opiniones-escuelas";
  return `/opiniones-escuelas?school=${encodeURIComponent(slug)}`;
}

/** Etiqueta del KPI «Fuente de datos» en la pestaña Escuelas. */
export function plannerSchoolsDataSourceLabel(schools: School[]): string {
  if (schools.length === 0) return "—";
  const hasDb = schools.some(isPlannerFlypathDatabaseSchool);
  const hasManual = schools.some((school) => !isPlannerFlypathDatabaseSchool(school));
  if (hasDb && hasManual) return "FlyPath + manual";
  if (hasDb) return "Base FlyPath";
  if (hasManual) return "Manual";
  return "—";
}

export function schoolCardEstadoLabel(school: School): string {
  return isPlannerSchoolVerificada(school) ? "VERIFICADA" : "PENDIENTE";
}
