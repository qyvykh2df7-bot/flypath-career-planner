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

/** Escuelas que pueden mostrarse en /schools y compararse (ruta profesional comparable). */
export function isSchoolComparable(entry: SchoolEntry): boolean {
  return entry.excludedFromPublicComparator !== true;
}

export function getComparableSchools(): SchoolEntry[] {
  return schoolsSpainDataset.filter(isSchoolComparable);
}

export function getSchoolBySlug(slug: string): SchoolEntry | undefined {
  return schoolsSpainDataset.find((s) => s.slug === slug);
}

/** Slug resuelto solo si la escuela es comparable en FlyPath (evita fichas públicas de entradas internas/excluidas). */
export function getComparableSchoolBySlug(slug: string): SchoolEntry | undefined {
  const school = getSchoolBySlug(slug);
  if (!school || !isSchoolComparable(school)) return undefined;
  return school;
}

export function getSchoolsByIds(ids: string[]): SchoolEntry[] {
  const idSet = new Set(ids);
  return schoolsSpainDataset.filter((school) => idSet.has(school.id));
}

export function getSchoolInitials(name: string): string {
  // If the name has parenthetical text, prefer outside-parentheses tokens.
  // Fallback to full name when parentheses contain the only usable words.
  const outsideParentheses = name.replace(/\([^)]*\)/g, " ");
  const source = outsideParentheses.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().length > 0
    ? outsideParentheses
    : name;

  return source
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDataConfidence(value: DataConfidence): string {
  if (value === "high") return "alta";
  if (value === "medium") return "media";
  return "baja";
}

/**
 * Bases / ciudades INDIVIDUALES por escuela, para uso interno del filtro de ciudad y del dropdown.
 *
 * - Solo se sobreescribe cuando la escuela tiene más de una base (texto visible "Madrid / Mallorca",
 *   "Gran Canaria · Tenerife", etc.) o cuando hay que añadir una base que no figura literalmente
 *   en `entry.city` pero sí en `baseAirport` (ej. CESDA opera en Reus + Lleida; European Flyers en
 *   Madrid + Alicante).
 * - Para escuelas con una sola base, NO añadir entrada y se cae al fallback `[entry.city]`.
 * - El texto visible de ubicación en las cards SIGUE usando `entry.city` (no se altera).
 */
const SCHOOL_CITIES_BY_SLUG: Record<string, readonly string[]> = {
  "european-flyers": ["Madrid", "Alicante"],
  "cesda-urv": ["Reus", "Lleida"],
  "flyby-aviation-academy": ["Burgos", "Logroño"],
  "canavia-flight-school": ["Gran Canaria", "Tenerife"],
  "flyschool-air-academy": ["Madrid", "Mallorca"],
  "world-aviation-ato": ["Málaga", "Madrid"],
  "panamedia-escuela-de-pilotos": ["Mallorca", "Valencia", "Castellón"],
  "airpull-aviation-academy": ["Requena"],
};

/** Ciudades/bases individuales asociadas a una escuela (lista normalizada para filtros). */
export function getSchoolCities(entry: SchoolEntry): readonly string[] {
  const override = SCHOOL_CITIES_BY_SLUG[entry.slug];
  if (override && override.length > 0) return override;
  return [entry.city];
}

/**
 * Lista única y ordenada de ciudades para el dropdown del filtro.
 * Se construye a partir de la unión de `getSchoolCities()` de las escuelas pasadas.
 */
export function getCities(entries: SchoolEntry[]): string[] {
  const all = new Set<string>();
  for (const entry of entries) {
    for (const city of getSchoolCities(entry)) all.add(city);
  }
  return Array.from(all).sort((a, b) => a.localeCompare(b, "es"));
}

export function getPriceGap(entry: SchoolEntry): number {
  if (entry.advertisedPriceEUR <= 0 || entry.flypathEstimatedRealCostEUR <= 0) return NaN;
  return entry.flypathEstimatedRealCostEUR - entry.advertisedPriceEUR;
}

/** Slugs agrupados como “escuelas principales” en el listado /schools (resto: pendientes de revisión). */
export const FLYPATH_MAIN_LISTING_SCHOOL_SLUG_ORDER: readonly string[] = [
  "adventia-usal",
  "european-flyers",
  "one-air",
  "eas-barcelona",
  "barcelona-flight-school",
  "cesda-urv",
  "fte-jerez",
  "quality-fly",
  "flyby-aviation-academy",
  "flyschool-air-academy",
  "airpull-aviation-academy",
  "world-aviation-ato",
  "panamedia-escuela-de-pilotos",
  "aerodynamics-academy",
  "mediterranean-flight-school",
  "baa-training-spain",
  "canavia-flight-school",
  "aero-link-flight-academy",
  "aeroflota-del-noroeste-afn",
  "corflight-school",
  "leading-edge-aviation-leap-alhama",
] as const;

const mainListingSlugIndex = new Map(
  FLYPATH_MAIN_LISTING_SCHOOL_SLUG_ORDER.map((slug, index) => [slug, index]),
);

export function isMainListingSchool(entry: SchoolEntry): boolean {
  return mainListingSlugIndex.has(entry.slug);
}

export function sortMainListingSchools(entries: SchoolEntry[]): SchoolEntry[] {
  return [...entries].sort(
    (a, b) =>
      (mainListingSlugIndex.get(a.slug) ?? 999) - (mainListingSlugIndex.get(b.slug) ?? 999),
  );
}

/** Texto del cuerpo de la card del listado (no altera fichas ni comparador). */
export function schoolListingCardBody(entry: SchoolEntry): string {
  return entry.listingCardSummary ?? entry.shortDescription;
}

/** Categoría visual usada para elegir la imagen de fondo de la franja superior de la card. */
export type SchoolCardVisualCategory = "integrated" | "modular" | "mixed" | "cadet_airline";

/**
 * Asignación explícita de imagen de fondo de card. Mapeo solicitado por producto:
 * - cadet-airline.jpg ÚNICAMENTE para Adventia y CESDA.
 * - integrado.jpg, modular.jpg y mixto.jpg para el resto, según rutas publicadas.
 */
const SCHOOL_CARD_CADET_AIRLINE_SLUGS = new Set<string>(["adventia-usal", "cesda-urv"]);

const SCHOOL_CARD_MIXED_SLUGS = new Set<string>([
  "european-flyers",
  "one-air",
  "eas-barcelona",
  "fte-jerez",
  "barcelona-flight-school",
  "aerodynamics-academy",
  "baa-training-spain",
  "panamedia-escuela-de-pilotos",
  "aeroflota-del-noroeste-afn",
  "canavia-flight-school",
  "corflight-school",
  "flyby-aviation-academy",
  "flyschool-air-academy",
]);

const SCHOOL_CARD_INTEGRATED_SLUGS = new Set<string>([
  "quality-fly",
  "airpull-aviation-academy",
  "aero-link-flight-academy",
  "leading-edge-aviation-leap-alhama",
]);

const SCHOOL_CARD_MODULAR_SLUGS = new Set<string>([
  "mediterranean-flight-school",
  "world-aviation-ato",
]);

export function getSchoolCardVisualCategory(entry: SchoolEntry): SchoolCardVisualCategory {
  if (SCHOOL_CARD_CADET_AIRLINE_SLUGS.has(entry.slug)) return "cadet_airline";
  if (SCHOOL_CARD_MIXED_SLUGS.has(entry.slug)) return "mixed";
  if (SCHOOL_CARD_INTEGRATED_SLUGS.has(entry.slug)) return "integrated";
  if (SCHOOL_CARD_MODULAR_SLUGS.has(entry.slug)) return "modular";
  // Fallback para entidades no mapeadas (pendientes de revisión): usar routeType.
  if (entry.routeType === "modular") return "modular";
  if (entry.routeType === "university_plus_license") return "mixed";
  return "integrated";
}

export function getSchoolCardBackgroundUrl(entry: SchoolEntry): string {
  const category = getSchoolCardVisualCategory(entry);
  if (category === "modular") return "/school-card-bg/modular.jpg";
  if (category === "mixed") return "/school-card-bg/mixto.jpg";
  if (category === "cadet_airline") return "/school-card-bg/cadet-airline.jpg";
  return "/school-card-bg/integrado.jpg";
}

/** Solo las escuelas principales pueden añadirse a comparación desde la card del listado. */
export function schoolAllowsListingComparison(entry: SchoolEntry): boolean {
  return isMainListingSchool(entry);
}

/** Una escuela ofrece "Universidad / Grado + licencia" si su routeType es ese o si tiene universidad asociada. */
function offersUniversityDegreeWithLicense(entry: SchoolEntry): boolean {
  if (entry.routeType === "university_plus_license") return true;
  const associated = (entry.associatedUniversity ?? "").trim();
  return associated.length > 0;
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
        offersUniversityDegreeWithLicense(entry));
    const cityMatch =
      filters.city === "all" || getSchoolCities(entry).includes(filters.city);
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
