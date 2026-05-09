import { supabase } from "@/lib/supabaseClient";

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
};

const SCHOOL_FIELDS =
  "school_id, slug, name, country, city, main_base, other_bases, website_url, logo_url, image_category, school_type, status, data_status, last_updated_at, public_notes, internal_notes";

const PROGRAM_FIELDS =
  "program_id, school_id, program_name, route_type, program_category, is_main_program, advertised_price_eur, estimated_real_cost_eur, duration_months, flight_hours, theory_hours, language, bases, fleet, simulators, entry_requirements, minimum_age, medical_required, english_required, status";

const MODULE_FIELDS =
  "module_id, school_id, program_id, module_name, module_order, price_eur, price_notes, is_required_for_route, source_url";

const COSTS_FIELDS =
  "cost_id, program_id, school_id, contract_available_before_payment, refund_policy_available, refund_policy_summary, payment_schedule_available, payment_schedule_summary, deposit_or_enrollment_fee_eur, financing_available, financing_summary, exam_fees_included, skill_tests_included, license_issue_fees_included, admin_fees_included, vat_included, price_year, price_validity_notes";

const EXTRAS_FIELDS =
  "extras_id, program_id, school_id, exam_fees_status, exam_fees_notes, skill_tests_status, skill_tests_notes, materials_status, materials_notes, uniform_status, uniform_notes, headset_status, headset_notes, ipad_status, ipad_notes, accommodation_status, accommodation_notes, transport_status, transport_notes, medical_status, medical_notes, insurance_status, insurance_notes";

const RISK_FLAG_FIELDS =
  "risk_id, school_id, program_id, risk_category, risk_level, risk_title, risk_text, question_to_school, source_url, status";

const SOURCE_FIELDS =
  "source_id, school_id, program_id, source_type, source_title, source_url, accessed_at, published_date, notes, reliability";

function pickMainProgram(programs: SupabaseProgramRow[]): SupabaseProgramRow | null {
  if (programs.length === 0) return null;
  const flagged = programs.find((p) => p.is_main_program === true);
  if (flagged) return flagged;
  return programs[0] ?? null;
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
  const { data: schoolsData, error: schoolsError } = await supabase
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

  const { data: programsData, error: programsError } = await supabase
    .from("programs")
    .select(PROGRAM_FIELDS)
    .in("school_id", schoolIds)
    .eq("status", "active");

  if (programsError) {
    throw new Error(`Supabase programs error: ${programsError.message}`);
  }

  const programsBySchool = new Map<string, SupabaseProgramRow[]>();
  for (const program of (programsData ?? []) as SupabaseProgramRow[]) {
    const existing = programsBySchool.get(program.school_id) ?? [];
    existing.push(program);
    programsBySchool.set(program.school_id, existing);
  }

  return schools.map((school) => {
    const programs = programsBySchool.get(school.school_id) ?? [];
    return {
      school,
      mainProgram: pickMainProgram(programs),
      programs,
    };
  });
}

/**
 * Devuelve la escuela activa con ese `slug` y sus programas activos. `null` si no existe
 * o si su `status` no es `"active"`.
 */
export async function getSchoolBySlug(slug: string): Promise<SupabaseSchoolWithMainProgram | null> {
  const { data: schoolsData, error: schoolsError } = await supabase
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

  const { data: programsData, error: programsError } = await supabase
    .from("programs")
    .select(PROGRAM_FIELDS)
    .eq("school_id", school.school_id)
    .eq("status", "active");

  if (programsError) {
    throw new Error(`Supabase getSchoolBySlug (programs) error: ${programsError.message}`);
  }
  const programs = (programsData ?? []) as SupabaseProgramRow[];

  return {
    school,
    mainProgram: pickMainProgram(programs),
    programs,
  };
}

/** Devuelve los programas activos de una escuela (`status = "active"`). */
export async function getProgramsBySchoolId(schoolId: string): Promise<SupabaseProgramRow[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(PROGRAM_FIELDS)
    .eq("school_id", schoolId)
    .eq("status", "active");

  if (error) throw new Error(`Supabase getProgramsBySchoolId error: ${error.message}`);
  return (data ?? []) as SupabaseProgramRow[];
}

/** Devuelve los módulos de un programa, ordenados por `module_order`. */
export async function getModulesByProgramId(programId: string): Promise<SupabaseModuleRow[]> {
  const { data, error } = await supabase
    .from("modular_modules")
    .select(MODULE_FIELDS)
    .eq("program_id", programId)
    .order("module_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Supabase getModulesByProgramId error: ${error.message}`);
  return (data ?? []) as SupabaseModuleRow[];
}

/** Devuelve la fila de `costs_and_payments` para un programa, o `null` si no existe. */
export async function getCostsByProgramId(programId: string): Promise<SupabaseCostsRow | null> {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("risk_flags")
    .select(RISK_FLAG_FIELDS)
    .eq("school_id", schoolId)
    .eq("status", "active");

  if (error) throw new Error(`Supabase getRiskFlagsBySchoolId error: ${error.message}`);
  return (data ?? []) as SupabaseRiskFlagRow[];
}

/** Devuelve risk flags asociados a un programa concreto con `status = "active"`. */
export async function getRiskFlagsByProgramId(programId: string): Promise<SupabaseRiskFlagRow[]> {
  const { data, error } = await supabase
    .from("risk_flags")
    .select(RISK_FLAG_FIELDS)
    .eq("program_id", programId)
    .eq("status", "active");

  if (error) throw new Error(`Supabase getRiskFlagsByProgramId error: ${error.message}`);
  return (data ?? []) as SupabaseRiskFlagRow[];
}

/** Devuelve fuentes asociadas a una escuela. */
export async function getSourcesBySchoolId(schoolId: string): Promise<SupabaseSourceRow[]> {
  const { data, error } = await supabase
    .from("sources")
    .select(SOURCE_FIELDS)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Supabase getSourcesBySchoolId error: ${error.message}`);
  return (data ?? []) as SupabaseSourceRow[];
}

/** Devuelve fuentes asociadas a un programa concreto. */
export async function getSourcesByProgramId(programId: string): Promise<SupabaseSourceRow[]> {
  const { data, error } = await supabase
    .from("sources")
    .select(SOURCE_FIELDS)
    .eq("program_id", programId);

  if (error) throw new Error(`Supabase getSourcesByProgramId error: ${error.message}`);
  return (data ?? []) as SupabaseSourceRow[];
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
  const { data: schoolsData, error: schoolError } = await supabase
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
      supabase.from("costs_and_payments").select(COSTS_FIELDS).in("program_id", programIds),
      supabase.from("extras").select(EXTRAS_FIELDS).in("program_id", programIds),
      supabase
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

  const [riskFlags, sources] = await Promise.all([
    getRiskFlagsBySchoolId(school.school_id),
    getSourcesBySchoolId(school.school_id),
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
  };
}
