import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getSchoolSupabase() {
  return getSupabaseAdmin();
}

/** Forma cruda de una fila de la tabla `schools` en Supabase. */
export type SupabaseSchoolRow = {
  school_id: string;
  slug: string;
  name: string;
  country: string | null;
  city: string | null;
  main_base: string | null;
  other_bases: string | null;
  website_url: string | null;
  logo_url: string | null;
  image_category: string | null;
  school_type: string | null;
  status: string | null;
  data_status: string | null;
  last_updated_at: string | null;
  public_notes: string | null;
  internal_notes: string | null;
  legacy_entry_id: string | null;
  ato_name: string | null;
  associated_university: string | null;
  short_description: string | null;
  listing_card_summary: string | null;
  data_confidence: string | null;
  excluded_from_public_comparator: boolean | null;
  comparator_exclusion_note: string | null;
  aircraft_availability: string | null;
  student_aircraft_ratio: string | null;
  instructor_student_ratio: string | null;
  job_support_summary: string | null;
  employment_claims_type: string | null;
  school_entry_snapshot: unknown | null;
};

/** Forma cruda de una fila de la tabla `programs` en Supabase. */
export type SupabaseProgramRow = {
  program_id: string;
  school_id: string;
  program_name: string | null;
  route_type: string | null;
  program_category: string | null;
  is_main_program: boolean | null;
  advertised_price_eur: number | null;
  estimated_real_cost_eur: number | null;
  duration_months: number | null;
  flight_hours: number | null;
  theory_hours: number | null;
  language: string | null;
  bases: string | null;
  fleet: string | null;
  simulators: string | null;
  entry_requirements: string | null;
  minimum_age: number | null;
  medical_required: string | null;
  english_required: string | null;
  status: string | null;
  comparator_fleet_summary: string | null;
};

export type SupabaseSchoolWithMainProgram = {
  school: SupabaseSchoolRow;
  mainProgram: SupabaseProgramRow | null;
  /** Todos los programas activos de la escuela. Útil para fases siguientes (modular_modules, costs, extras). */
  programs: SupabaseProgramRow[];
};

/** Forma cruda de una fila de la tabla `modular_modules`. */
export type SupabaseModuleRow = {
  module_id: string;
  school_id: string;
  program_id: string;
  module_name: string | null;
  module_order: number | null;
  price_eur: number | null;
  price_notes: string | null;
  is_required_for_route: boolean | null;
  source_url: string | null;
};

/** Forma cruda de una fila de la tabla `costs_and_payments`. */
export type SupabaseCostsRow = {
  cost_id: string;
  program_id: string;
  school_id: string;
  contract_available_before_payment: string | null;
  refund_policy_available: string | null;
  refund_policy_summary: string | null;
  payment_schedule_available: string | null;
  payment_schedule_summary: string | null;
  deposit_or_enrollment_fee_eur: number | null;
  financing_available: string | null;
  financing_summary: string | null;
  exam_fees_included: string | null;
  skill_tests_included: string | null;
  license_issue_fees_included: string | null;
  admin_fees_included: string | null;
  vat_included: string | null;
  price_year: number | null;
  price_validity_notes: string | null;
};

/** Forma cruda de una fila de la tabla `extras`. */
export type SupabaseExtrasRow = {
  extras_id: string;
  program_id: string;
  school_id: string;
  exam_fees_status: string | null;
  exam_fees_notes: string | null;
  skill_tests_status: string | null;
  skill_tests_notes: string | null;
  materials_status: string | null;
  materials_notes: string | null;
  uniform_status: string | null;
  uniform_notes: string | null;
  headset_status: string | null;
  headset_notes: string | null;
  ipad_status: string | null;
  ipad_notes: string | null;
  accommodation_status: string | null;
  accommodation_notes: string | null;
  transport_status: string | null;
  transport_notes: string | null;
  medical_status: string | null;
  medical_notes: string | null;
  insurance_status: string | null;
  insurance_notes: string | null;
  mcc_joc_status: string | null;
  mcc_joc_notes: string | null;
  advanced_uprt_status: string | null;
  advanced_uprt_notes: string | null;
};

/** Fila de `school_scores`. */
export type SupabaseSchoolScoresRow = {
  school_id: string;
  document_transparency: number;
  cost_clarity: number;
  financial_risk: number;
  commercial_risk: number;
  operational_solidity: number;
  data_confidence_score: number;
  updated_at: string | null;
};

/** Fila de `school_text_list_items`. */
export type SupabaseSchoolTextListItemRow = {
  item_id: string;
  school_id: string;
  list_type: "red_flag" | "pending_data" | "key_question";
  sort_index: number;
  item_text: string;
};

/** Fila de `university_tracks`. */
export type SupabaseUniversityTrackRow = {
  track_id: string;
  school_id: string;
  university_name: string;
  degree_type: string;
  degree_name: string;
  academic_duration_years: number;
  ects: number;
  license_included_mode: string;
  actual_license_outcome: string;
  partner_ato: string;
  academic_cost_eur: number;
  flight_cost_eur: number;
  total_estimated_cost_eur: number;
  class1_failure_policy: string;
  updated_at: string | null;
};

/** Forma cruda de una fila de la tabla `risk_flags`. */
export type SupabaseRiskFlagRow = {
  risk_id: string;
  school_id: string;
  program_id: string | null;
  risk_category: string | null;
  risk_level: string | null;
  risk_title: string | null;
  risk_text: string | null;
  question_to_school: string | null;
  source_url: string | null;
  status: string | null;
};

/** Forma cruda de una fila de la tabla `sources`. */
export type SupabaseSourceRow = {
  source_id: string;
  school_id: string;
  program_id: string | null;
  source_type: string | null;
  source_title: string | null;
  source_url: string | null;
  accessed_at: string | null;
  published_date: string | null;
  notes: string | null;
  reliability: string | null;
};

/** Perfil completo de una escuela combinando todas las tablas relacionadas. */
export type FullSchoolProfile = {
  school: SupabaseSchoolRow;
  programs: SupabaseProgramRow[];
  /** Programa principal (preferentemente `is_main_program=true`, fallback al primero). */
  mainProgram: SupabaseProgramRow | null;
  costsByProgramId: Record<string, SupabaseCostsRow>;
  extrasByProgramId: Record<string, SupabaseExtrasRow>;
  modulesByProgramId: Record<string, SupabaseModuleRow[]>;
  /** Solo risk flags con `status = "active"` (a nivel escuela y/o programa). */
  riskFlags: SupabaseRiskFlagRow[];
  sources: SupabaseSourceRow[];
  schoolScores: SupabaseSchoolScoresRow | null;
  schoolTextListItems: SupabaseSchoolTextListItemRow[];
  universityTrack: SupabaseUniversityTrackRow | null;
};

const SCHOOL_FIELDS =
  "school_id, slug, name, country, city, main_base, other_bases, website_url, logo_url, image_category, school_type, status, data_status, last_updated_at, public_notes, internal_notes, legacy_entry_id, ato_name, associated_university, short_description, listing_card_summary, data_confidence, excluded_from_public_comparator, comparator_exclusion_note, aircraft_availability, student_aircraft_ratio, instructor_student_ratio, job_support_summary, employment_claims_type, school_entry_snapshot";

const PROGRAM_FIELDS =
  "program_id, school_id, program_name, route_type, program_category, is_main_program, advertised_price_eur, estimated_real_cost_eur, duration_months, flight_hours, theory_hours, language, bases, fleet, simulators, entry_requirements, minimum_age, medical_required, english_required, status, comparator_fleet_summary";

const MODULE_FIELDS =
  "module_id, school_id, program_id, module_name, module_order, price_eur, price_notes, is_required_for_route, source_url";

const COSTS_FIELDS =
  "cost_id, program_id, school_id, contract_available_before_payment, refund_policy_available, refund_policy_summary, payment_schedule_available, payment_schedule_summary, deposit_or_enrollment_fee_eur, financing_available, financing_summary, exam_fees_included, skill_tests_included, license_issue_fees_included, admin_fees_included, vat_included, price_year, price_validity_notes";

const EXTRAS_FIELDS =
  "extras_id, program_id, school_id, exam_fees_status, exam_fees_notes, skill_tests_status, skill_tests_notes, materials_status, materials_notes, uniform_status, uniform_notes, headset_status, headset_notes, ipad_status, ipad_notes, accommodation_status, accommodation_notes, transport_status, transport_notes, medical_status, medical_notes, insurance_status, insurance_notes, mcc_joc_status, mcc_joc_notes, advanced_uprt_status, advanced_uprt_notes";

const SCHOOL_SCORES_FIELDS =
  "school_id, document_transparency, cost_clarity, financial_risk, commercial_risk, operational_solidity, data_confidence_score, updated_at";

const SCHOOL_TEXT_LIST_FIELDS = "item_id, school_id, list_type, sort_index, item_text";

const UNIVERSITY_TRACK_FIELDS =
  "track_id, school_id, university_name, degree_type, degree_name, academic_duration_years, ects, license_included_mode, actual_license_outcome, partner_ato, academic_cost_eur, flight_cost_eur, total_estimated_cost_eur, class1_failure_policy, updated_at";

const RISK_FLAG_FIELDS =
  "risk_id, school_id, program_id, risk_category, risk_level, risk_title, risk_text, question_to_school, source_url, status";

const SOURCE_FIELDS =
  "source_id, school_id, program_id, source_type, source_title, source_url, accessed_at, published_date, notes, reliability";

/** Orden estable para elegir programa principal: main primero, luego nombre. */
export function sortProgramsForMainPick(programs: SupabaseProgramRow[]): SupabaseProgramRow[] {
  return [...programs].sort((a, b) => {
    const mainA = a.is_main_program === true ? 1 : 0;
    const mainB = b.is_main_program === true ? 1 : 0;
    if (mainB !== mainA) return mainB - mainA;
    return (a.program_name ?? "").localeCompare(b.program_name ?? "", "es", { sensitivity: "base" });
  });
}

function isIntegratedRouteType(routeType: string | null | undefined): boolean {
  const rt = (routeType ?? "").trim().toLowerCase();
  return rt === "integrated" || rt === "integrated_modular";
}

/**
 * Elige el programa principal entre filas ya filtradas por `status = active` y ordenadas
 * con {@link sortProgramsForMainPick}.
 */
export function pickMainProgram(programs: SupabaseProgramRow[]): SupabaseProgramRow | null {
  const sorted = sortProgramsForMainPick(programs);
  if (sorted.length === 0) return null;

  const flagged = sorted.filter((p) => p.is_main_program === true);

  if (flagged.length === 1) return flagged[0]!;

  if (flagged.length === 0) {
    const fallback = sorted[0]!;
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[FlyPath] pickMainProgram: sin is_main_program; usando primer programa activo",
        {
          program_id: fallback.program_id,
          program_name: fallback.program_name ?? "",
        },
      );
    }
    return fallback;
  }

  const integrated = flagged.filter((p) => isIntegratedRouteType(p.route_type));
  const chosen = integrated[0] ?? flagged[0]!;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[FlyPath] pickMainProgram: varios is_main_program; priorizando integrado si existe",
      {
        main_program_count: flagged.length,
        program_id: chosen.program_id,
        program_name: chosen.program_name ?? "",
        route_type: chosen.route_type ?? "",
      },
    );
  }
  return chosen;
}

/**
 * Devuelve todas las escuelas con `status="active"` ordenadas por nombre, junto a sus
 * programas activos y el programa principal (preferentemente el marcado como
 * `is_main_program=true`, si no existe se usa el primero disponible).
 *
 * Las escuelas borradas/inactivas en Supabase (Aerotec, Aerofan, Global Training Aviation,
 * etc.) quedan automáticamente fuera porque su `status` no es `"active"` o no existen en la
 * tabla. No se filtran en el cliente.
 */
export async function getComparableSchoolsFromSupabase(): Promise<SupabaseSchoolWithMainProgram[]> {
  const { data: schoolsData, error: schoolsError } = await getSchoolSupabase()
    .from("schools")
    .select(SCHOOL_FIELDS)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (schoolsError) {
    throw new Error(`Supabase getComparableSchoolsFromSupabase error: ${schoolsError.message}`);
  }
  const schools = (schoolsData ?? []) as SupabaseSchoolRow[];
  if (schools.length === 0) return [];

  const schoolIds = schools.map((s) => s.school_id);

  const { data: programsData, error: programsError } = await getSchoolSupabase()
    .from("programs")
    .select(PROGRAM_FIELDS)
    .in("school_id", schoolIds)
    .eq("status", "active")
    .order("is_main_program", { ascending: false })
    .order("program_name", { ascending: true });

  if (programsError) {
    throw new Error(`Supabase programs error: ${programsError.message}`);
  }

  const programsBySchool = new Map<string, SupabaseProgramRow[]>();
  for (const program of (programsData ?? []) as SupabaseProgramRow[]) {
    const existing = programsBySchool.get(program.school_id) ?? [];
    existing.push(program);
    programsBySchool.set(program.school_id, existing);
  }
  for (const [schoolId, programs] of programsBySchool) {
    programsBySchool.set(schoolId, sortProgramsForMainPick(programs));
  }

  return schools.map((school) => {
    const programs = programsBySchool.get(school.school_id) ?? [];
    const mainProgram = pickMainProgram(programs);
    return {
      school,
      mainProgram,
      programs,
    };
  });
}

/**
 * Devuelve la escuela activa con ese `slug` y sus programas activos. `null` si no existe
 * o si su `status` no es `"active"`.
 */
export async function getSchoolBySlug(slug: string): Promise<SupabaseSchoolWithMainProgram | null> {
  const { data: schoolsData, error: schoolsError } = await getSchoolSupabase()
    .from("schools")
    .select(SCHOOL_FIELDS)
    .eq("slug", slug)
    .eq("status", "active")
    .limit(1);

  if (schoolsError) {
    throw new Error(`Supabase getSchoolBySlug error: ${schoolsError.message}`);
  }
  const schools = (schoolsData ?? []) as SupabaseSchoolRow[];
  if (schools.length === 0) return null;

  const school = schools[0];

  const programs = await getProgramsBySchoolId(school.school_id);
  const mainProgram = pickMainProgram(programs);

  return {
    school,
    mainProgram,
    programs,
  };
}

/** Devuelve los programas activos de una escuela (`status = "active"`). */
export async function getProgramsBySchoolId(schoolId: string): Promise<SupabaseProgramRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("programs")
    .select(PROGRAM_FIELDS)
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("is_main_program", { ascending: false })
    .order("program_name", { ascending: true });

  if (error) throw new Error(`Supabase getProgramsBySchoolId error: ${error.message}`);
  return sortProgramsForMainPick((data ?? []) as SupabaseProgramRow[]);
}

/** Devuelve los módulos de un programa, ordenados por `module_order`. */
export async function getModulesByProgramId(programId: string): Promise<SupabaseModuleRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("modular_modules")
    .select(MODULE_FIELDS)
    .eq("program_id", programId)
    .order("module_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Supabase getModulesByProgramId error: ${error.message}`);
  return (data ?? []) as SupabaseModuleRow[];
}

/** Devuelve la fila de `costs_and_payments` para un programa, o `null` si no existe. */
export async function getCostsByProgramId(programId: string): Promise<SupabaseCostsRow | null> {
  const { data, error } = await getSchoolSupabase()
    .from("costs_and_payments")
    .select(COSTS_FIELDS)
    .eq("program_id", programId)
    .limit(1);

  if (error) throw new Error(`Supabase getCostsByProgramId error: ${error.message}`);
  const rows = (data ?? []) as SupabaseCostsRow[];
  return rows[0] ?? null;
}

/** Devuelve la fila de `extras` para un programa, o `null` si no existe. */
export async function getExtrasByProgramId(programId: string): Promise<SupabaseExtrasRow | null> {
  const { data, error } = await getSchoolSupabase()
    .from("extras")
    .select(EXTRAS_FIELDS)
    .eq("program_id", programId)
    .limit(1);

  if (error) throw new Error(`Supabase getExtrasByProgramId error: ${error.message}`);
  const rows = (data ?? []) as SupabaseExtrasRow[];
  return rows[0] ?? null;
}

/** Devuelve risk flags de una escuela con `status = "active"`. Incluye los que también tengan `program_id`. */
export async function getRiskFlagsBySchoolId(schoolId: string): Promise<SupabaseRiskFlagRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("risk_flags")
    .select(RISK_FLAG_FIELDS)
    .eq("school_id", schoolId)
    .eq("status", "active");

  if (error) throw new Error(`Supabase getRiskFlagsBySchoolId error: ${error.message}`);
  return (data ?? []) as SupabaseRiskFlagRow[];
}

/** Devuelve risk flags asociados a un programa concreto con `status = "active"`. */
export async function getRiskFlagsByProgramId(programId: string): Promise<SupabaseRiskFlagRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("risk_flags")
    .select(RISK_FLAG_FIELDS)
    .eq("program_id", programId)
    .eq("status", "active");

  if (error) throw new Error(`Supabase getRiskFlagsByProgramId error: ${error.message}`);
  return (data ?? []) as SupabaseRiskFlagRow[];
}

/** Devuelve fuentes asociadas a una escuela. */
export async function getSourcesBySchoolId(schoolId: string): Promise<SupabaseSourceRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("sources")
    .select(SOURCE_FIELDS)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Supabase getSourcesBySchoolId error: ${error.message}`);
  return (data ?? []) as SupabaseSourceRow[];
}

/** Devuelve fuentes asociadas a un programa concreto. */
export async function getSourcesByProgramId(programId: string): Promise<SupabaseSourceRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("sources")
    .select(SOURCE_FIELDS)
    .eq("program_id", programId);

  if (error) throw new Error(`Supabase getSourcesByProgramId error: ${error.message}`);
  return (data ?? []) as SupabaseSourceRow[];
}

export async function getSchoolScoresBySchoolId(
  schoolId: string,
): Promise<SupabaseSchoolScoresRow | null> {
  const { data, error } = await getSchoolSupabase()
    .from("school_scores")
    .select(SCHOOL_SCORES_FIELDS)
    .eq("school_id", schoolId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase getSchoolScoresBySchoolId error: ${error.message}`);
  return (data as SupabaseSchoolScoresRow | null) ?? null;
}

export async function getSchoolTextListItemsBySchoolId(
  schoolId: string,
): Promise<SupabaseSchoolTextListItemRow[]> {
  const { data, error } = await getSchoolSupabase()
    .from("school_text_list_items")
    .select(SCHOOL_TEXT_LIST_FIELDS)
    .eq("school_id", schoolId)
    .order("list_type", { ascending: true })
    .order("sort_index", { ascending: true });

  if (error) throw new Error(`Supabase getSchoolTextListItemsBySchoolId error: ${error.message}`);
  return (data ?? []) as SupabaseSchoolTextListItemRow[];
}

export async function getUniversityTrackBySchoolId(
  schoolId: string,
): Promise<SupabaseUniversityTrackRow | null> {
  const { data, error } = await getSchoolSupabase()
    .from("university_tracks")
    .select(UNIVERSITY_TRACK_FIELDS)
    .eq("school_id", schoolId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase getUniversityTrackBySchoolId error: ${error.message}`);
  return (data as SupabaseUniversityTrackRow | null) ?? null;
}

/**
 * Agrega school + programs + costs + extras + módulos + risk_flags + sources en un solo objeto.
 *
 * - Solo escuelas con `status = "active"`.
 * - Solo programas con `status = "active"`.
 * - Solo risk flags con `status = "active"` (a nivel escuela; los program-level se incluyen porque
 *   `risk_flags.school_id` siempre apunta a la escuela y filtramos por escuela).
 * - Si no hay programas, los mapas relacionados (`costsByProgramId`, `extrasByProgramId`,
 *   `modulesByProgramId`) salen vacíos.
 * - Devuelve `null` si la escuela no existe o no está activa.
 */
export async function getFullSchoolProfileBySlug(slug: string): Promise<FullSchoolProfile | null> {
  const { data: schoolsData, error: schoolError } = await getSchoolSupabase()
    .from("schools")
    .select(SCHOOL_FIELDS)
    .eq("slug", slug)
    .eq("status", "active")
    .limit(1);

  if (schoolError) {
    throw new Error(`Supabase getFullSchoolProfileBySlug (school) error: ${schoolError.message}`);
  }
  const schools = (schoolsData ?? []) as SupabaseSchoolRow[];
  if (schools.length === 0) return null;

  const school = schools[0];

  const programs = await getProgramsBySchoolId(school.school_id);
  const mainProgram = pickMainProgram(programs);
  const programIds = programs.map((p) => p.program_id);

  let costsByProgramId: Record<string, SupabaseCostsRow> = {};
  let extrasByProgramId: Record<string, SupabaseExtrasRow> = {};
  let modulesByProgramId: Record<string, SupabaseModuleRow[]> = {};

  if (programIds.length > 0) {
    const [costsRes, extrasRes, modulesRes] = await Promise.all([
      getSchoolSupabase().from("costs_and_payments").select(COSTS_FIELDS).in("program_id", programIds),
      getSchoolSupabase().from("extras").select(EXTRAS_FIELDS).in("program_id", programIds),
      getSchoolSupabase()
        .from("modular_modules")
        .select(MODULE_FIELDS)
        .in("program_id", programIds)
        .order("module_order", { ascending: true, nullsFirst: false }),
    ]);

    if (costsRes.error) {
      throw new Error(`Supabase costs_and_payments error: ${costsRes.error.message}`);
    }
    if (extrasRes.error) {
      throw new Error(`Supabase extras error: ${extrasRes.error.message}`);
    }
    if (modulesRes.error) {
      throw new Error(`Supabase modular_modules error: ${modulesRes.error.message}`);
    }

    costsByProgramId = ((costsRes.data ?? []) as SupabaseCostsRow[]).reduce<
      Record<string, SupabaseCostsRow>
    >((acc, row) => {
      acc[row.program_id] = row;
      return acc;
    }, {});

    extrasByProgramId = ((extrasRes.data ?? []) as SupabaseExtrasRow[]).reduce<
      Record<string, SupabaseExtrasRow>
    >((acc, row) => {
      acc[row.program_id] = row;
      return acc;
    }, {});

    modulesByProgramId = ((modulesRes.data ?? []) as SupabaseModuleRow[]).reduce<
      Record<string, SupabaseModuleRow[]>
    >((acc, row) => {
      const list = acc[row.program_id] ?? [];
      list.push(row);
      acc[row.program_id] = list;
      return acc;
    }, {});
  }

  const [riskFlags, sources, schoolScores, schoolTextListItems, universityTrack] =
    await Promise.all([
      getRiskFlagsBySchoolId(school.school_id),
      getSourcesBySchoolId(school.school_id),
      getSchoolScoresBySchoolId(school.school_id),
      getSchoolTextListItemsBySchoolId(school.school_id),
      getUniversityTrackBySchoolId(school.school_id),
    ]);

  return {
    school,
    programs,
    mainProgram,
    costsByProgramId,
    extrasByProgramId,
    modulesByProgramId,
    riskFlags,
    sources,
    schoolScores,
    schoolTextListItems,
    universityTrack,
  };
}

/** Perfil completo localizado por `schools.legacy_entry_id` (paridad schoolsSpain `id`). */
export async function getFullSchoolProfileByLegacyEntryId(
  legacyEntryId: string,
): Promise<FullSchoolProfile | null> {
  const { data, error } = await getSchoolSupabase()
    .from("schools")
    .select("slug")
    .eq("legacy_entry_id", legacyEntryId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Supabase getFullSchoolProfileByLegacyEntryId error: ${error.message}`,
    );
  }

  const slug = (data as { slug: string } | null)?.slug;
  if (!slug) return null;
  return getFullSchoolProfileBySlug(slug);
}
