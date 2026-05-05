import { schoolsDataset } from "@/lib/schools/data";
import type { DataConfidence, RouteType, SchoolEntry } from "@/types/schools";

export type SchoolsFilters = {
  query: string;
  routeType: RouteType | "all";
  city: string | "all";
  maxAdvertisedPrice: number;
  dataConfidence: DataConfidence | "all";
};

export function getSchoolBySlug(slug: string): SchoolEntry | undefined {
  return schoolsDataset.find((s) => s.slug === slug);
}

export function getCities(entries: SchoolEntry[]): string[] {
  return Array.from(new Set(entries.map((e) => e.city))).sort((a, b) => a.localeCompare(b, "es"));
}

export function getPriceGap(entry: SchoolEntry): number {
  return entry.flypathEstimatedRealCostEUR - entry.advertisedPriceEUR;
}

export function filterSchools(entries: SchoolEntry[], filters: SchoolsFilters): SchoolEntry[] {
  const query = filters.query.trim().toLowerCase();
  return entries.filter((entry) => {
    const queryMatch =
      query.length === 0 ||
      `${entry.name} ${entry.city} ${entry.baseAirport}`.toLowerCase().includes(query);
    const routeMatch = filters.routeType === "all" || entry.routeType === filters.routeType;
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
  const lowestGap = withGap.sort((a, b) => a.gap - b.gap)[0].school;
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

