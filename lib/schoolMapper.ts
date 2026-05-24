import { localSlugFromSupabaseSlug } from "@/lib/schools/schoolSlugAliases";
import {
  getComparableSchoolsFromSupabase,
  getFullSchoolProfileBySlug,
  type FullSchoolProfile,
  type SupabaseCostsRow,
  type SupabaseExtrasRow,
  type SupabaseModuleRow,
  type SupabaseProgramRow,
  type SupabaseRiskFlagRow,
  type SupabaseSchoolTextListItemRow,
  type SupabaseSchoolWithMainProgram,
  type SupabaseUniversityTrackRow,
} from "@/lib/schoolQueries";
import type {
  Availability,
  DataConfidence,
  DataStatus,
  EmploymentClaimsType,
  RouteType,
  SchoolEntry,
  UniversityTrack,
  YesNoOptionalUnknown,
  YesNoPartialUnknown,
} from "@/types/schools";

/**
 * Normaliza el valor `route_type` de Supabase a la unión `RouteType` que usa el comparador.
 *
 * Mapas explícitos:
 *  - "modular" → "modular"
 *  - "university_plus_license" → "university_plus_license"
 *  - "integrated", "integrated_modular", "advanced_training" y cualquier otro → "integrated"
 *    (caen al valor por defecto del comparador para no introducir un enum nuevo en esta fase MVP).
 */
export function normalizeRouteType(value: string | null | undefined): RouteType {
  if (value === "modular") return "modular";
  if (value === "university_plus_license") return "university_plus_license";
  return "integrated";
}

/** Normaliza `data_status` a la unión `DataStatus`. Cualquier valor desconocido → `"unknown"`. */
export function normalizeDataStatus(value: string | null | undefined): DataStatus {
  if (value === "verified" || value === "partial" || value === "unknown" || value === "demo") {
    return value;
  }
  return "unknown";
}

/**
 * Mapeo visual de los `*_status` de la tabla `extras` (y de `*_available`/`*_included` de
 * `costs_and_payments` cuando comparten vocabulario). Cualquier valor desconocido cae a
 * `"Pendiente de validar"` para no inventar.
 */
export function extrasStatusLabel(value: string | null | undefined): string {
  if (!value) return "Pendiente de validar";
  switch (value) {
    case "included":
    case "yes":
      return "Incluido";
    case "not_included":
    case "no":
      return "No incluido";
    case "partial":
      return "Parcial / confirmar con escuela";
    case "not_applicable":
      return "No aplica";
    case "unknown":
      return "Pendiente de validar";
    default:
      return value;
  }
}

/** Etiqueta legible para `risk_level` (`low | medium | high | critical`). */
export function riskLevelLabel(value: string | null | undefined): string {
  if (!value) return "—";
  switch (value) {
    case "low":
      return "Bajo";
    case "medium":
      return "Medio";
    case "high":
      return "Alto";
    case "critical":
      return "Crítico";
    default:
      return value;
  }
}

/** Etiqueta legible para `reliability` de `sources` (`low | medium | high`). */
export function reliabilityLabel(value: string | null | undefined): string {
  if (!value) return "—";
  switch (value) {
    case "low":
      return "Baja";
    case "medium":
      return "Media";
    case "high":
      return "Alta";
    default:
      return value;
  }
}

export function routeTypeRawLabel(value: string | null | undefined): string {
  if (!value) return "Pendiente de validar";
  if (value === "integrated") return "Integrada";
  if (value === "modular") return "Modular";
  if (value === "integrated_modular") return "Integrada + Modular";
  if (value === "university_plus_license") return "Universidad + Licencia";
  if (value === "advanced_training") return "Formación avanzada";
  return value;
}

/**
 * Devuelve el precio anunciado formateado en euros o `"Pendiente de validar"` si el dato es
 * `null`, `undefined`, no numérico finito o `<= 0`. Nunca debe imprimirse `0 €`, `NaN`, etc.
 */
export function formatAdvertisedPriceLabel(priceEur: number | null | undefined): string {
  if (
    priceEur == null ||
    typeof priceEur !== "number" ||
    !Number.isFinite(priceEur) ||
    priceEur <= 0
  ) {
    return "Pendiente de validar";
  }
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(priceEur);
}

/** Precios en `SchoolEntry`: null o <= 0 se guardan como 0; la UI usa helpers para el texto. */
function priceToSchoolEntryField(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return 0;
}

function fleetSummaryFromProgram(program: SupabaseProgramRow | null): string {
  if (!program) return "";
  const fleet = program.fleet?.trim() ?? "";
  const sim = program.simulators?.trim() ?? "";
  if (fleet && sim) return `${fleet} · ${sim}`;
  return fleet || sim;
}

function fleetSummaryFromProfile(mainProgram: SupabaseProgramRow | null): string {
  const comparator = mainProgram?.comparator_fleet_summary?.trim() ?? "";
  if (comparator) return comparator;
  return fleetSummaryFromProgram(mainProgram);
}

function normalizeDataConfidence(value: string | null | undefined): DataConfidence | null {
  if (value === "high" || value === "medium" || value === "low") return value;
  return null;
}

function normalizeAvailability(value: string | null | undefined): Availability {
  if (value === "high" || value === "medium" || value === "low" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function normalizeEmploymentClaimsType(value: string | null | undefined): EmploymentClaimsType {
  const v = (value ?? "").trim();
  if (
    v === "none" ||
    v === "vague" ||
    v === "clear_non_guaranteed" ||
    v === "guaranteed_claimed" ||
    v === "unknown"
  ) {
    return v;
  }
  return "unknown";
}

function mapExtrasStatusToYesNoOptional(raw: string | null | undefined): YesNoOptionalUnknown {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "included" || v === "yes") return "yes";
  if (v === "not_included" || v === "no") return "no";
  if (v === "not_applicable") return "optional";
  return "unknown";
}

function scoreOrZero(value: number | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

function buildTextListsFromParityItems(
  items: SupabaseSchoolTextListItemRow[],
): { redFlags: string[]; pendingData: string[]; keyQuestions: string[] } {
  const redFlags: string[] = [];
  const pendingData: string[] = [];
  const keyQuestions: string[] = [];

  const sorted = [...items].sort((a, b) => {
    if (a.list_type !== b.list_type) return a.list_type.localeCompare(b.list_type);
    return a.sort_index - b.sort_index;
  });

  for (const row of sorted) {
    const text = row.item_text?.trim() ?? "";
    if (!text) continue;
    if (row.list_type === "red_flag") redFlags.push(text);
    else if (row.list_type === "pending_data") pendingData.push(text);
    else if (row.list_type === "key_question") keyQuestions.push(text);
  }

  return { redFlags, pendingData, keyQuestions };
}

function universityTrackFromRow(row: SupabaseUniversityTrackRow): UniversityTrack {
  return {
    universityName: row.university_name,
    degreeType: row.degree_type,
    degreeName: row.degree_name,
    academicDurationYears: Number(row.academic_duration_years),
    ects: row.ects,
    licenseIncludedMode: row.license_included_mode,
    actualLicenseOutcome: row.actual_license_outcome,
    partnerAto: row.partner_ato,
    academicCostEUR: row.academic_cost_eur,
    flightCostEUR: row.flight_cost_eur,
    totalEstimatedCostEUR: row.total_estimated_cost_eur,
    class1FailurePolicy: row.class1_failure_policy,
  };
}

function resolveEntrySlug(dbSlug: string): string {
  return localSlugFromSupabaseSlug(dbSlug) ?? dbSlug;
}

/** Texto opcional alineado con schoolsSpain.ts: vacío en BD → `""`, nunca `undefined`. */
function optionalSchoolTextField(value: string | null | undefined): string {
  if (value == null) return "";
  return value.trim();
}

function mapContractAvailableBeforePayment(
  raw: string | null | undefined,
): YesNoPartialUnknown {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "yes") return "yes";
  if (v === "no") return "no";
  if (v === "partial") return "partial";
  if (v === "unknown" || v === "") return "unknown";
  return "unknown";
}

function mapFinancingAvailable(raw: string | null | undefined): "yes" | "no" | "unknown" {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "yes") return "yes";
  if (v === "no") return "no";
  return "unknown";
}

/** `examFeesIncluded` / `skillTestsIncluded` / `trainingMaterialsIncluded`: solo yes | no | unknown */
function mapExtrasStatusToYesNoUnknown(raw: string | null | undefined): "yes" | "no" | "unknown" {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "included" || v === "yes") return "yes";
  if (v === "not_included" || v === "no") return "no";
  return "unknown";
}

function mapAccommodationStatus(raw: string | null | undefined): YesNoOptionalUnknown {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "included" || v === "yes") return "yes";
  if (v === "not_included" || v === "no") return "no";
  if (v === "not_applicable") return "optional";
  return "unknown";
}

/**
 * `dataConfidenceScore` provisional según `data_status` de la escuela.
 * TODO: sustituir por reglas reales (costs claros, fuentes, cobertura de campos, etc.).
 */
function dataConfidenceScoreFromDataStatus(status: DataStatus): number {
  switch (status) {
    case "verified":
      return 80;
    case "partial":
      return 50;
    case "unknown":
      return 25;
    case "demo":
      return 10;
    default:
      return 25;
  }
}

/** Deriva `dataConfidence` del score provisional hasta tener reglas propias. */
function dataConfidenceFromScore(score: number): DataConfidence {
  if (score >= 75) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const PENDING_RISK_CATEGORIES = new Set([
  "payment",
  "source",
  "route",
  "included_extras",
  "contract",
]);

function normalizeDedupeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function pushUnique(out: string[], seen: Set<string>, value: string | null | undefined): void {
  if (value == null) return;
  const t = value.trim();
  if (!t) return;
  const key = normalizeDedupeKey(t);
  if (seen.has(key)) return;
  seen.add(key);
  out.push(t);
}

/**
 * Risk flags relevantes al programa principal: sin `program_id` o con `program_id` del main program.
 */
function filterRiskFlagsForMainProgram(
  flags: SupabaseRiskFlagRow[],
  mainProgramId: string | null,
): SupabaseRiskFlagRow[] {
  return flags.filter((f) => {
    if (!f.program_id) return true;
    if (!mainProgramId) return true;
    return f.program_id === mainProgramId;
  });
}

function buildRiskDerivedLists(
  flags: SupabaseRiskFlagRow[],
): { redFlags: string[]; pendingData: string[]; keyQuestions: string[] } {
  const redFlags: string[] = [];
  const pendingData: string[] = [];
  const keyQuestions: string[] = [];
  const seenRed = new Set<string>();
  const seenPending = new Set<string>();
  const seenQuestions = new Set<string>();

  for (const f of flags) {
    const alertText = (f.risk_text?.trim() || f.risk_title?.trim() || "").trim();
    if (alertText) pushUnique(redFlags, seenRed, alertText);

    pushUnique(keyQuestions, seenQuestions, f.question_to_school?.trim() || null);

    const cat = (f.risk_category ?? "").trim().toLowerCase();
    if (cat && PENDING_RISK_CATEGORIES.has(cat)) {
      const pendingLine =
        f.risk_title?.trim() && f.risk_text?.trim()
          ? `${f.risk_title.trim()}: ${f.risk_text.trim()}`
          : f.risk_text?.trim() || f.risk_title?.trim() || null;
      pushUnique(pendingData, seenPending, pendingLine);
    }
  }

  return { redFlags, pendingData, keyQuestions };
}

/**
 * Convierte un perfil completo de Supabase en un `SchoolEntry` lo más completo posible.
 *
 * `sources` y `modulesByProgramId` entran en el perfil para futuras extensiones; hoy no tienen
 * campos dedicados en `SchoolEntry` y no se inventan propiedades nuevas.
 */
export function mapSupabaseProfileToSchoolEntry(profile: FullSchoolProfile): SchoolEntry {
  const {
    school,
    mainProgram,
    costsByProgramId,
    extrasByProgramId,
    riskFlags,
    schoolScores,
    schoolTextListItems,
    universityTrack,
  } = profile;

  const programId = mainProgram?.program_id ?? null;
  const costs: SupabaseCostsRow | null = programId ? costsByProgramId[programId] ?? null : null;
  const extras: SupabaseExtrasRow | null = programId ? extrasByProgramId[programId] ?? null : null;

  const dataStatus = normalizeDataStatus(school.data_status);
  const fallbackDataConfidenceScore = dataConfidenceScoreFromDataStatus(dataStatus);
  const storedDataConfidence = normalizeDataConfidence(school.data_confidence);

  const parityLists = buildTextListsFromParityItems(schoolTextListItems);
  const hasParityLists =
    parityLists.redFlags.length > 0 ||
    parityLists.pendingData.length > 0 ||
    parityLists.keyQuestions.length > 0;

  const filteredFlags = filterRiskFlagsForMainProgram(riskFlags, programId);
  const riskDerivedLists = buildRiskDerivedLists(filteredFlags);
  const { redFlags, pendingData, keyQuestions } = hasParityLists ? parityLists : riskDerivedLists;

  const scoresFromDb = schoolScores
    ? {
        documentTransparency: scoreOrZero(schoolScores.document_transparency),
        costClarity: scoreOrZero(schoolScores.cost_clarity),
        financialRisk: scoreOrZero(schoolScores.financial_risk),
        commercialRisk: scoreOrZero(schoolScores.commercial_risk),
        operationalSolidity: scoreOrZero(schoolScores.operational_solidity),
        dataConfidenceScore: scoreOrZero(schoolScores.data_confidence_score),
      }
    : null;

  const dataConfidenceScore =
    scoresFromDb?.dataConfidenceScore ?? fallbackDataConfidenceScore;

  const advertisedPriceEUR = priceToSchoolEntryField(mainProgram?.advertised_price_eur ?? null);
  const flypathEstimatedRealCostEUR = priceToSchoolEntryField(
    mainProgram?.estimated_real_cost_eur ?? null,
  );

  return {
    id: school.legacy_entry_id?.trim() || school.school_id,
    slug: resolveEntrySlug(school.slug),
    name: school.name,
    routeType: normalizeRouteType(mainProgram?.route_type ?? null),
    country: school.country ?? "",
    city: school.city ?? "",
    baseAirport: school.main_base ?? "",
    atoName: school.ato_name?.trim() || school.name,
    associatedUniversity: school.associated_university?.trim() || undefined,
    shortDescription: school.short_description?.trim() || school.public_notes?.trim() || "",
    listingCardSummary:
      school.listing_card_summary?.trim() ||
      school.short_description?.trim() ||
      school.public_notes?.trim() ||
      undefined,
    dataStatus,
    lastUpdatedAt: school.last_updated_at ?? "",
    dataConfidence:
      storedDataConfidence ?? dataConfidenceFromScore(dataConfidenceScore),

    advertisedPriceEUR,
    flypathEstimatedRealCostEUR,
    depositOrEnrollmentFeeEUR: priceToSchoolEntryField(costs?.deposit_or_enrollment_fee_eur ?? null),
    paymentScheduleSummary: costs?.payment_schedule_summary?.trim() ?? "",
    refundPolicySummary: costs?.refund_policy_summary?.trim() ?? "",
    contractAvailableBeforePayment: mapContractAvailableBeforePayment(
      costs?.contract_available_before_payment,
    ),
    financingAvailable: mapFinancingAvailable(costs?.financing_available),

    mccJocIncluded: mapExtrasStatusToYesNoOptional(extras?.mcc_joc_status),
    advancedUprtIncluded: mapExtrasStatusToYesNoOptional(extras?.advanced_uprt_status),
    examFeesIncluded: mapExtrasStatusToYesNoUnknown(extras?.exam_fees_status),
    skillTestsIncluded: mapExtrasStatusToYesNoUnknown(extras?.skill_tests_status),
    trainingMaterialsIncluded: mapExtrasStatusToYesNoUnknown(extras?.materials_status),
    accommodationIncluded: mapAccommodationStatus(extras?.accommodation_status),

    fleetSummary: fleetSummaryFromProfile(mainProgram),
    aircraftAvailability: normalizeAvailability(school.aircraft_availability),
    studentAircraftRatio: optionalSchoolTextField(school.student_aircraft_ratio),
    instructorStudentRatio: optionalSchoolTextField(school.instructor_student_ratio),
    languageOfInstruction: mainProgram?.language ?? "",
    programDurationMonths:
      typeof mainProgram?.duration_months === "number" && Number.isFinite(mainProgram.duration_months)
        ? mainProgram.duration_months
        : 0,
    class1Requirement: mainProgram?.medical_required?.trim() ?? "",

    jobSupportSummary: school.job_support_summary?.trim() ?? "",
    employmentClaimsType: normalizeEmploymentClaimsType(school.employment_claims_type),

    scores: scoresFromDb ?? {
      documentTransparency: 0,
      costClarity: 0,
      financialRisk: 0,
      commercialRisk: 0,
      operationalSolidity: 0,
      dataConfidenceScore: fallbackDataConfidenceScore,
    },
    redFlags,
    pendingData,
    keyQuestions,

    excludedFromPublicComparator: school.excluded_from_public_comparator ?? false,
    comparatorExclusionNote: school.comparator_exclusion_note?.trim() || undefined,
    universityTrack: universityTrack ? universityTrackFromRow(universityTrack) : undefined,
  };
}

export type SupabaseSchoolEntriesPayload = {
  entries: SchoolEntry[];
  /** Perfil completo por slug (misma lista que `entries`). Para módulos modulares y futuras extensiones sin refetch. */
  profilesBySlug: Record<string, FullSchoolProfile>;
};

/**
 * Carga todas las escuelas activas, obtiene el perfil completo por slug y devuelve entradas +
 * mapa de perfiles por slug (una sola pasada por escuela; evita refetch al comparar).
 */
export async function getSupabaseSchoolEntriesWithProfiles(): Promise<SupabaseSchoolEntriesPayload> {
  const rows = await getComparableSchoolsFromSupabase();
  const entries: SchoolEntry[] = [];
  const profilesBySlug: Record<string, FullSchoolProfile> = {};

  for (const { school } of rows) {
    const profile = await getFullSchoolProfileBySlug(school.slug);
    if (!profile) continue;
    entries.push(mapSupabaseProfileToSchoolEntry(profile));
    profilesBySlug[school.slug] = profile;
  }

  return { entries, profilesBySlug };
}

/**
 * @deprecated Preferir `getSupabaseSchoolEntriesWithProfiles` cuando haga falta `modulesByProgramId`.
 */
export async function getSupabaseSchoolEntries(): Promise<SchoolEntry[]> {
  const { entries } = await getSupabaseSchoolEntriesWithProfiles();
  return entries;
}

/** Programas de un perfil que deben mostrar bloque de módulos + filas ordenadas desde `modular_modules`. */
export type ModularProgramModulesGroup = {
  programId: string;
  programName: string;
  routeTypeRaw: string | null;
  modules: SupabaseModuleRow[];
};

/**
 * Extrae grupos programa → módulos para la comparación temporal.
 *
 * Incluye un programa si:
 * - tiene filas en `modular_modules`, o
 * - `route_type` es modular o integrated_modular (catálogo modular explícito).
 *
 * Los módulos se ordenan por `module_order` ascendente (null al final).
 */
export function getModularProgramGroupsFromProfile(
  profile: FullSchoolProfile | null | undefined,
): ModularProgramModulesGroup[] {
  if (!profile) return [];

  const { programs, modulesByProgramId } = profile;
  const groups: ModularProgramModulesGroup[] = [];

  for (const p of programs) {
    const rawRt = p.route_type ?? null;
    const rt = (rawRt ?? "").trim().toLowerCase();
    const modularFamily = rt === "modular" || rt === "integrated_modular";
    const mods = modulesByProgramId[p.program_id] ?? [];
    if (!modularFamily && mods.length === 0) continue;

    const sorted = [...mods].sort((a, b) => {
      const ao = a.module_order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.module_order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return (a.module_name ?? "").localeCompare(b.module_name ?? "", "es");
    });

    groups.push({
      programId: p.program_id,
      programName: (p.program_name ?? "").trim() || "Programa sin nombre",
      routeTypeRaw: rawRt,
      modules: sorted,
    });
  }

  return groups;
}

/**
 * Mapea una fila Supabase + programa principal **sin** costs/extras/risk agregados (perfil parcial).
 * Preferir `mapSupabaseProfileToSchoolEntry` cuando exista `FullSchoolProfile`.
 */
export function mapSupabaseSchoolToSchoolEntry(row: SupabaseSchoolWithMainProgram): SchoolEntry {
  return mapSupabaseProfileToSchoolEntry({
    school: row.school,
    programs: row.programs,
    mainProgram: row.mainProgram,
    costsByProgramId: {},
    extrasByProgramId: {},
    modulesByProgramId: {},
    riskFlags: [],
    sources: [],
    schoolScores: null,
    schoolTextListItems: [],
    universityTrack: null,
  });
}
