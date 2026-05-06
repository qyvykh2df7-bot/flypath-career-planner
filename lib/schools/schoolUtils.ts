import { schoolsSpainDataset } from "@/lib/schools/schoolsSpain";
import type { Availability, DataConfidence, DataStatus, RouteType, SchoolEntry } from "@/types/schools";

export type SchoolsFilters = {
  query: string;
  routeType: RouteType | "all";
  city: string | "all";
  maxAdvertisedPrice: number;
  dataConfidence: DataConfidence | "all";
};

export function getAllSchools(): SchoolEntry[] {
  return schoolsSpainDataset;
}

export function getSchoolBySlug(slug: string): SchoolEntry | undefined {
  return schoolsSpainDataset.find((s) => s.slug === slug);
}

export function getSchoolsByIds(ids: string[]): SchoolEntry[] {
  const idSet = new Set(ids);
  return schoolsSpainDataset.filter((school) => idSet.has(school.id));
}

export function getSchoolInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDataConfidence(value: DataConfidence): string {
  if (value === "high") return "alta";
  if (value === "medium") return "media";
  return "baja";
}

export function getCities(entries: SchoolEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.city))).sort((a, b) => a.localeCompare(b, "es"));
}

export function getPriceGap(entry: SchoolEntry): number {
  if (entry.advertisedPriceEUR <= 0 || entry.flypathEstimatedRealCostEUR <= 0) return NaN;
  return entry.flypathEstimatedRealCostEUR - entry.advertisedPriceEUR;
}

export function filterSchools(entries: SchoolEntry[], filters: SchoolsFilters): SchoolEntry[] {
  const query = filters.query.trim().toLowerCase();
  return entries.filter((entry) => {
    const routeType = entry.routeType as RouteType | "mixed";
    const queryMatch =
      query.length === 0 ||
      `${entry.name} ${entry.city} ${entry.baseAirport}`.toLowerCase().includes(query);
    const routeMatch =
      filters.routeType === "all" ||
      (filters.routeType === "modular" &&
        (routeType === "modular" || routeType === "mixed")) ||
      (filters.routeType === "integrated" &&
        (routeType === "integrated" ||
          routeType === "university_plus_license" ||
          routeType === "mixed")) ||
      (filters.routeType === "university_plus_license" &&
        routeType === "university_plus_license");
    const cityMatch = filters.city === "all" || entry.city === filters.city;
    const priceMatch = entry.advertisedPriceEUR <= filters.maxAdvertisedPrice;
    const confidenceMatch =
      filters.dataConfidence === "all" || entry.dataConfidence === filters.dataConfidence;
    return queryMatch && routeMatch && cityMatch && priceMatch && confidenceMatch;
  });
}

export function summarizeComparison(entries: SchoolEntry[]) {
  if (entries.length < 2) return null;
  const withGap = entries.map((e) => ({ school: e, gap: getPriceGap(e) }));
  const bestCostClarity = [...entries].sort(
    (a, b) => b.scores.costClarity - a.scores.costClarity,
  )[0];
  const bestTransparency = [...entries].sort(
    (a, b) => b.scores.documentTransparency - a.scores.documentTransparency,
  )[0];
  const lowestGap =
    withGap
      .filter((item) => Number.isFinite(item.gap))
      .sort((a, b) => a.gap - b.gap)[0]?.school ?? entries[0];
  const mostPending = [...entries].sort((a, b) => b.pendingData.length - a.pendingData.length)[0];

  return {
    bestCostClarity,
    bestTransparency,
    lowestGap,
    mostPending,
  };
}

export function routeTypeLabel(type: RouteType): string {
  if (type === "integrated") return "Escuela integrada";
  if (type === "modular") return "Ruta modular";
  return "Universidad / Grado + licencia";
}

export function confidenceLabel(confidence: DataConfidence): string {
  if (confidence === "high") return "Alta";
  if (confidence === "medium") return "Media";
  return "Baja";
}

/**
 * Guía interna FlyPath para asignar dataConfidence/dataConfidenceScore.
 *
 * - high (alta): 80-90
 *   Usar solo con fuente oficial actualizada + precio vigente + incluidos/excluidos claros +
 *   contrato/condiciones antes de pagar + calendario de pagos + reembolso + bases/duracion/flota/requisitos.
 *
 * - medium (media): 60-75
 *   Hay bastantes datos oficiales públicos, pero faltan elementos críticos para decidir pago
 *   (p. ej. contrato completo, calendario de pagos, depósito/matrícula, política de reembolso,
 *   vigencia exacta del precio o condiciones de reintentos).
 *
 * - low (baja): 30-55
 *   La escuela existe y hay algunos datos oficiales, pero la parte económica/contractual/incluidos
 *   sigue incompleta.
 *
 * - muy baja: 0-30
 *   Apenas hay datos verificables.
 */
export const FLYPATH_DATA_CONFIDENCE_SCORE_GUIDE = {
  high: { min: 80, max: 90 },
  medium: { min: 60, max: 75 },
  low: { min: 30, max: 55 },
  veryLow: { min: 0, max: 30 },
} as const;

export function getConfidenceScoreBand(confidence: DataConfidence): { min: number; max: number } {
  if (confidence === "high") return FLYPATH_DATA_CONFIDENCE_SCORE_GUIDE.high;
  if (confidence === "medium") return FLYPATH_DATA_CONFIDENCE_SCORE_GUIDE.medium;
  return FLYPATH_DATA_CONFIDENCE_SCORE_GUIDE.low;
}

export function availabilityLabel(level: Availability): string {
  if (level === "high") return "Alta";
  if (level === "medium") return "Media";
  if (level === "low") return "Baja";
  return "Desconocido";
}

export function dataStatusLabel(status: DataStatus | "pending" | "minimal"): string {
  if (status === "partial") return "En revisión";
  if (status === "unknown" || status === "pending") return "Pendiente";
  if (status === "minimal") return "Datos mínimos";
  if (status === "verified") return "Verificada";
  return "Demo";
}
