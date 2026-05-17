/**
 * Seed de paridad exacta: schoolsSpain.ts → Supabase
 *
 * ⚠️  SOLO uso local / servidor. Nunca en frontend.
 * ⚠️  Por defecto DRY-RUN (no escribe). Para escribir:
 *       WRITE_TO_SUPABASE=true npx tsx scripts/seed-school-entry-parity-from-spain.ts
 *
 * Variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL          — URL del proyecto
 *   SUPABASE_SERVICE_ROLE_KEY         — obligatoria para escritura (bypass RLS)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY     — solo lectura en dry-run (opcional)
 *
 * Prerrequisitos:
 *   1. Ejecutar supabase/migrations/20260517120000_school_entry_parity_schema.sql
 *   2. Escuelas ya existentes en `schools` (slug exacto o vía SCHOOL_SLUG_ALIASES)
 *
 * No modifica schoolsSpain.ts ni el comparador en /schools.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { schoolsSpainDataset } from "../lib/schools/schoolsSpain";
import type { SchoolEntry, UniversityTrack, YesNoOptionalUnknown } from "../types/schools";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WRITE_TO_SUPABASE = process.env.WRITE_TO_SUPABASE === "true";
const ROOT = resolve(__dirname, "..");

/**
 * Si es true, el seed también sobrescribe `schools.name` con `entry.name`.
 * Por defecto false: evita cambiar marcas visibles en BD sin decisión explícita.
 */
const SYNC_DISPLAY_NAME = true;

/** Slug en schoolsSpain.ts → slug real en Supabase (no modifica el slug público de BD). */
const SCHOOL_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "one-air": "oneair",
  "flyschool-air-academy": "flyschool",
  "airpull-aviation-academy": "airpull",
  "world-aviation-ato": "world-aviation",
  "panamedia-escuela-de-pilotos": "panamedia",
};

type ListType = "red_flag" | "pending_data" | "key_question";

type SchoolRow = {
  school_id: string;
  slug: string;
  name: string;
  main_base: string | null;
  city: string | null;
};

type ProcessResult = {
  slug: string;
  name: string;
  status: "ok" | "skipped_not_in_supabase" | "error";
  schoolId?: string;
  supabaseSlug?: string;
  resolvedViaAlias?: boolean;
  mainProgramId?: string;
  fieldsUpdated: string[];
  errors: string[];
  /** Preview: el valor en BD difiere del que aplicaría el patch visual. */
  visualWouldChange?: {
    main_base: boolean;
    city: boolean;
    /** Solo true si SYNC_DISPLAY_NAME está activo y el nombre difiere. */
    name: boolean;
    /** Si SYNC_DISPLAY_NAME=true, el nombre en BD difiere de entry.name. */
    nameIfSynced: boolean;
  };
};

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function createSupabaseClient(): SupabaseClient {
  loadEnvFile(resolve(ROOT, ".env.local"));
  loadEnvFile(resolve(ROOT, ".env"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en el entorno o .env.local");
  }

  const key = WRITE_TO_SUPABASE
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      WRITE_TO_SUPABASE
        ? "Falta SUPABASE_SERVICE_ROLE_KEY (requerida para escritura)"
        : "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (WRITE_TO_SUPABASE && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "WRITE_TO_SUPABASE=true requiere SUPABASE_SERVICE_ROLE_KEY. No uses anon key para seed.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Mappers TS → Supabase vocab
// ---------------------------------------------------------------------------

function yesNoUnknownToExtrasStatus(value: "yes" | "no" | "unknown"): string {
  if (value === "yes") return "included";
  if (value === "no") return "not_included";
  return "unknown";
}

function yesNoOptionalToExtrasStatus(value: YesNoOptionalUnknown): string {
  if (value === "yes") return "included";
  if (value === "no") return "not_included";
  if (value === "optional") return "not_applicable";
  return "unknown";
}

function listTypeFromEntryField(field: "redFlags" | "pendingData" | "keyQuestions"): ListType {
  switch (field) {
    case "redFlags":
      return "red_flag";
    case "pendingData":
      return "pending_data";
    case "keyQuestions":
      return "key_question";
  }
}

function pickMainProgram<T extends { is_main_program: boolean | null }>(programs: T[]): T | null {
  if (programs.length === 0) return null;
  return programs.find((p) => p.is_main_program === true) ?? programs[0] ?? null;
}

// ---------------------------------------------------------------------------
// DB operations
// ---------------------------------------------------------------------------

function normalizeCompareText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

async function fetchSchoolBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<SchoolRow | null> {
  const { data, error } = await supabase
    .from("schools")
    .select("school_id, slug, name, main_base, city")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`schools[${slug}]: ${error.message}`);
  return data as SchoolRow | null;
}

async function resolveSchoolForEntry(
  supabase: SupabaseClient,
  entrySlug: string,
): Promise<{
  school: SchoolRow | null;
  resolvedSlug: string;
  usedAlias: boolean;
}> {
  const exact = await fetchSchoolBySlug(supabase, entrySlug);
  if (exact) {
    return { school: exact, resolvedSlug: entrySlug, usedAlias: false };
  }

  const aliasSlug = SCHOOL_SLUG_ALIASES[entrySlug];
  if (aliasSlug) {
    const viaAlias = await fetchSchoolBySlug(supabase, aliasSlug);
    if (viaAlias) {
      return { school: viaAlias, resolvedSlug: aliasSlug, usedAlias: true };
    }
  }

  return { school: null, resolvedSlug: entrySlug, usedAlias: false };
}

async function fetchMainProgram(
  supabase: SupabaseClient,
  schoolId: string,
): Promise<{ program_id: string } | null> {
  const { data, error } = await supabase
    .from("programs")
    .select("program_id, is_main_program, status")
    .eq("school_id", schoolId)
    .eq("status", "active");

  if (error) throw new Error(`programs: ${error.message}`);
  const main = pickMainProgram(data ?? []);
  return main ? { program_id: main.program_id } : null;
}

async function processEntry(
  supabase: SupabaseClient,
  entry: SchoolEntry,
): Promise<ProcessResult> {
  const result: ProcessResult = {
    slug: entry.slug,
    name: entry.name,
    status: "ok",
    fieldsUpdated: [],
    errors: [],
  };

  const { school, usedAlias } = await resolveSchoolForEntry(supabase, entry.slug);
  if (!school) {
    result.status = "skipped_not_in_supabase";
    result.errors.push("No existe fila en schools con este slug ni con alias conocido");
    return result;
  }

  result.schoolId = school.school_id;
  result.supabaseSlug = school.slug;
  result.resolvedViaAlias = usedAlias;

  const schoolPatch: Record<string, unknown> = {
    legacy_entry_id: entry.id,
    ato_name: entry.atoName,
    associated_university: entry.associatedUniversity ?? null,
    short_description: entry.shortDescription,
    listing_card_summary: entry.listingCardSummary ?? null,
    data_confidence: entry.dataConfidence,
    data_status: entry.dataStatus,
    last_updated_at: entry.lastUpdatedAt,
    excluded_from_public_comparator: entry.excludedFromPublicComparator ?? false,
    comparator_exclusion_note: entry.comparatorExclusionNote ?? null,
    aircraft_availability: entry.aircraftAvailability,
    student_aircraft_ratio: entry.studentAircraftRatio ?? null,
    instructor_student_ratio: entry.instructorStudentRatio ?? null,
    job_support_summary: entry.jobSupportSummary,
    employment_claims_type: entry.employmentClaimsType,
    school_entry_snapshot: entry,
    main_base: entry.baseAirport || null,
    city: entry.city || null,
  };

  if (SYNC_DISPLAY_NAME) {
    schoolPatch.name = entry.name;
  }

  const nameIfSynced =
    normalizeCompareText(school.name) !== normalizeCompareText(entry.name);

  result.visualWouldChange = {
    main_base:
      normalizeCompareText(school.main_base) !== normalizeCompareText(entry.baseAirport),
    city: normalizeCompareText(school.city) !== normalizeCompareText(entry.city),
    name: SYNC_DISPLAY_NAME && nameIfSynced,
    nameIfSynced,
  };

  if (WRITE_TO_SUPABASE) {
    const { error } = await supabase.from("schools").update(schoolPatch).eq("school_id", school.school_id);
    if (error) result.errors.push(`schools update: ${error.message}`);
    else result.fieldsUpdated.push("schools");
  } else {
    result.fieldsUpdated.push("schools (dry-run)");
  }

  const mainProgram = await fetchMainProgram(supabase, school.school_id);
  if (!mainProgram) {
    result.errors.push("Sin programa principal activo (programs.is_main_program / status=active)");
    return result;
  }

  result.mainProgramId = mainProgram.program_id;

  const programPatch = {
    route_type: entry.routeType,
    advertised_price_eur: entry.advertisedPriceEUR > 0 ? entry.advertisedPriceEUR : null,
    estimated_real_cost_eur:
      entry.flypathEstimatedRealCostEUR > 0 ? entry.flypathEstimatedRealCostEUR : null,
    duration_months: entry.programDurationMonths > 0 ? entry.programDurationMonths : null,
    language: entry.languageOfInstruction || null,
    medical_required: entry.class1Requirement || null,
    comparator_fleet_summary: entry.fleetSummary || null,
  };

  if (WRITE_TO_SUPABASE) {
    const { error } = await supabase
      .from("programs")
      .update(programPatch)
      .eq("program_id", mainProgram.program_id);
    if (error) result.errors.push(`programs update: ${error.message}`);
    else result.fieldsUpdated.push("programs");
  } else {
    result.fieldsUpdated.push("programs (dry-run)");
  }

  const costsPatch = {
    deposit_or_enrollment_fee_eur:
      entry.depositOrEnrollmentFeeEUR > 0 ? entry.depositOrEnrollmentFeeEUR : null,
    payment_schedule_summary: entry.paymentScheduleSummary || null,
    refund_policy_summary: entry.refundPolicySummary || null,
    contract_available_before_payment: entry.contractAvailableBeforePayment,
    financing_available: entry.financingAvailable,
  };

  if (WRITE_TO_SUPABASE) {
    const { data: existingCosts } = await supabase
      .from("costs_and_payments")
      .select("cost_id")
      .eq("program_id", mainProgram.program_id)
      .limit(1)
      .maybeSingle();

    if (existingCosts?.cost_id) {
      const { error } = await supabase
        .from("costs_and_payments")
        .update(costsPatch)
        .eq("cost_id", existingCosts.cost_id);
      if (error) result.errors.push(`costs_and_payments update: ${error.message}`);
      else result.fieldsUpdated.push("costs_and_payments");
    } else {
      result.errors.push("costs_and_payments: fila inexistente para programa principal (no se inserta en este script)");
    }
  } else {
    result.fieldsUpdated.push("costs_and_payments (dry-run)");
  }

  const extrasPatch = {
    exam_fees_status: yesNoUnknownToExtrasStatus(entry.examFeesIncluded),
    skill_tests_status: yesNoUnknownToExtrasStatus(entry.skillTestsIncluded),
    materials_status: yesNoUnknownToExtrasStatus(entry.trainingMaterialsIncluded),
    accommodation_status: yesNoOptionalToExtrasStatus(entry.accommodationIncluded),
    mcc_joc_status: yesNoOptionalToExtrasStatus(entry.mccJocIncluded),
    advanced_uprt_status: yesNoOptionalToExtrasStatus(entry.advancedUprtIncluded),
  };

  if (WRITE_TO_SUPABASE) {
    const { data: existingExtras } = await supabase
      .from("extras")
      .select("extras_id")
      .eq("program_id", mainProgram.program_id)
      .limit(1)
      .maybeSingle();

    if (existingExtras?.extras_id) {
      const { error } = await supabase
        .from("extras")
        .update(extrasPatch)
        .eq("extras_id", existingExtras.extras_id);
      if (error) result.errors.push(`extras update: ${error.message}`);
      else result.fieldsUpdated.push("extras");
    } else {
      result.errors.push("extras: fila inexistente para programa principal (no se inserta en este script)");
    }
  } else {
    result.fieldsUpdated.push("extras (dry-run)");
  }

  const scoresRow = {
    school_id: school.school_id,
    document_transparency: entry.scores.documentTransparency,
    cost_clarity: entry.scores.costClarity,
    financial_risk: entry.scores.financialRisk,
    commercial_risk: entry.scores.commercialRisk,
    operational_solidity: entry.scores.operationalSolidity,
    data_confidence_score: entry.scores.dataConfidenceScore,
    updated_at: new Date().toISOString(),
  };

  if (WRITE_TO_SUPABASE) {
    const { error } = await supabase.from("school_scores").upsert(scoresRow, { onConflict: "school_id" });
    if (error) result.errors.push(`school_scores upsert: ${error.message}`);
    else result.fieldsUpdated.push("school_scores");
  } else {
    result.fieldsUpdated.push("school_scores (dry-run)");
  }

  const listFields = [
    { field: "redFlags" as const, items: entry.redFlags },
    { field: "pendingData" as const, items: entry.pendingData },
    { field: "keyQuestions" as const, items: entry.keyQuestions },
  ];

  for (const { field, items } of listFields) {
    const listType = listTypeFromEntryField(field);
    if (WRITE_TO_SUPABASE) {
      const { error: delError } = await supabase
        .from("school_text_list_items")
        .delete()
        .eq("school_id", school.school_id)
        .eq("list_type", listType);
      if (delError) {
        result.errors.push(`${listType} delete: ${delError.message}`);
        continue;
      }
      if (items.length > 0) {
        const rows = items.map((item_text, sort_index) => ({
          school_id: school.school_id,
          list_type: listType,
          sort_index,
          item_text,
        }));
        const { error: insError } = await supabase.from("school_text_list_items").insert(rows);
        if (insError) result.errors.push(`${listType} insert: ${insError.message}`);
        else result.fieldsUpdated.push(`school_text_list_items:${listType}(${items.length})`);
      }
    } else {
      result.fieldsUpdated.push(`school_text_list_items:${listType} (${items.length}, dry-run)`);
    }
  }

  if (entry.universityTrack) {
    const trackRow = universityTrackToRow(school.school_id, entry.universityTrack);
    if (WRITE_TO_SUPABASE) {
      const { error } = await supabase
        .from("university_tracks")
        .upsert(trackRow, { onConflict: "school_id" });
      if (error) result.errors.push(`university_tracks upsert: ${error.message}`);
      else result.fieldsUpdated.push("university_tracks");
    } else {
      result.fieldsUpdated.push("university_tracks (dry-run)");
    }
  }

  if (result.errors.length > 0 && result.status === "ok") {
    result.status = "error";
  }

  return result;
}

function universityTrackToRow(schoolId: string, track: UniversityTrack) {
  return {
    school_id: schoolId,
    university_name: track.universityName,
    degree_type: track.degreeType,
    degree_name: track.degreeName,
    academic_duration_years: track.academicDurationYears,
    ects: track.ects,
    license_included_mode: track.licenseIncludedMode,
    actual_license_outcome: track.actualLicenseOutcome,
    partner_ato: track.partnerAto,
    academic_cost_eur: track.academicCostEUR,
    flight_cost_eur: track.flightCostEUR,
    total_estimated_cost_eur: track.totalEstimatedCostEUR,
    class1_failure_policy: track.class1FailurePolicy,
    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("═".repeat(72));
  console.log("FlyPath — seed paridad schoolsSpain.ts → Supabase");
  console.log(`Modo: ${WRITE_TO_SUPABASE ? "ESCRITURA (WRITE_TO_SUPABASE=true)" : "DRY-RUN (solo lectura/resumen)"}`);
  console.log("═".repeat(72));

  if (!WRITE_TO_SUPABASE) {
    console.log("\n⚠️  No se escribirá en Supabase. Para escritura real:");
    console.log("    WRITE_TO_SUPABASE=true SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-school-entry-parity-from-spain.ts\n");
  } else {
    console.log("\n⚠️  ESCRITURA ACTIVA. Usa staging y backup antes de producción.\n");
  }

  const supabase = createSupabaseClient();
  const results: ProcessResult[] = [];

  for (const entry of schoolsSpainDataset) {
    try {
      const result = await processEntry(supabase, entry);
      results.push(result);
      const icon =
        result.status === "ok" ? "✓" : result.status === "skipped_not_in_supabase" ? "○" : "✗";
      const aliasNote =
        result.resolvedViaAlias && result.supabaseSlug
          ? ` [alias → ${result.supabaseSlug}]`
          : "";
      console.log(
        `${icon} ${entry.slug}${aliasNote} — ${result.fieldsUpdated.join(", ") || "sin cambios"}${
          result.errors.length ? ` | errores: ${result.errors.join("; ")}` : ""
        }`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        slug: entry.slug,
        name: entry.name,
        status: "error",
        fieldsUpdated: [],
        errors: [message],
      });
      console.log(`✗ ${entry.slug} — excepción: ${message}`);
    }
  }

  const processed = results.filter((r) => r.status === "ok").length;
  const missing = results.filter((r) => r.status === "skipped_not_in_supabase");
  const errored = results.filter((r) => r.status === "error");

  console.log("\n" + "─".repeat(72));
  console.log("RESUMEN FINAL");
  console.log("─".repeat(72));
  console.log(`Entradas en schoolsSpain.ts:     ${schoolsSpainDataset.length}`);
  console.log(`Procesadas (slug encontrado):    ${processed}`);
  console.log(`No encontradas en Supabase:      ${missing.length}`);
  console.log(`Con errores:                     ${errored.length}`);

  if (missing.length > 0) {
    console.log("\nSlugs solo en schoolsSpain.ts:");
    for (const m of missing) {
      console.log(`  - ${m.slug} (${m.name})`);
    }
  }

  if (errored.length > 0) {
    console.log("\nEscuelas con errores:");
    for (const e of errored) {
      console.log(`  - ${e.slug}: ${e.errors.join("; ")}`);
    }
  }

  const okResults = results.filter((r) => r.status === "ok");
  const mainBaseChanges = okResults.filter((r) => r.visualWouldChange?.main_base);
  const cityChanges = okResults.filter((r) => r.visualWouldChange?.city);
  const nameChanges = okResults.filter((r) => r.visualWouldChange?.name);

  console.log("\n" + "─".repeat(72));
  console.log("PREVIEW CAMPOS VISUALES (schools.main_base / city / name)");
  console.log("─".repeat(72));
  console.log(`SYNC_DISPLAY_NAME:                 ${SYNC_DISPLAY_NAME}`);
  console.log(`main_base cambiaría:               ${mainBaseChanges.length} escuelas`);
  console.log(`city cambiaría:                    ${cityChanges.length} escuelas`);
  console.log(
    `name cambiaría (solo si flag true): ${nameChanges.length} escuelas`,
  );

  if (mainBaseChanges.length > 0) {
    console.log("\nmain_base (entry.baseAirport → schools.main_base):");
    for (const r of mainBaseChanges) {
      console.log(`  - ${r.slug}${r.supabaseSlug && r.supabaseSlug !== r.slug ? ` [${r.supabaseSlug}]` : ""}`);
    }
  }

  if (cityChanges.length > 0) {
    console.log("\ncity (entry.city → schools.city):");
    for (const r of cityChanges) {
      console.log(`  - ${r.slug}${r.supabaseSlug && r.supabaseSlug !== r.slug ? ` [${r.supabaseSlug}]` : ""}`);
    }
  }

  if (SYNC_DISPLAY_NAME && nameChanges.length > 0) {
    console.log("\nname (entry.name → schools.name):");
    for (const r of nameChanges) {
      console.log(`  - ${r.slug}: «${r.name}»`);
    }
  } else if (!SYNC_DISPLAY_NAME) {
    const nameIfEnabled = okResults.filter((r) => r.visualWouldChange?.nameIfSynced);
    console.log(
      `\nname (SYNC_DISPLAY_NAME=false, no se escribe): ${nameIfEnabled.length} escuelas cambiarían si activas el flag`,
    );
    for (const r of nameIfEnabled) {
      console.log(`  - ${r.slug}: entry «${r.name}»`);
    }
  }

  console.log("\nSiguiente paso tras migración + seed:");
  console.log("  1. Abrir http://localhost:3000/supabase-parity-audit");
  console.log("  2. Actualizar mapSupabaseProfileToSchoolEntry (otra PR)");
  console.log("═".repeat(72));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
