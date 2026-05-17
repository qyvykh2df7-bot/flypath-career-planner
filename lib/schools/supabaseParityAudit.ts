import type { SchoolEntry } from "@/types/schools";

/** Campos escalares/objeto comparados entre schoolsSpain y Supabase (arrays aparte). */
export const PARITY_SCALAR_FIELDS = [
  "id",
  "slug",
  "name",
  "routeType",
  "country",
  "city",
  "baseAirport",
  "atoName",
  "associatedUniversity",
  "shortDescription",
  "listingCardSummary",
  "dataStatus",
  "dataConfidence",
  "lastUpdatedAt",
  "advertisedPriceEUR",
  "flypathEstimatedRealCostEUR",
  "depositOrEnrollmentFeeEUR",
  "paymentScheduleSummary",
  "refundPolicySummary",
  "contractAvailableBeforePayment",
  "financingAvailable",
  "examFeesIncluded",
  "skillTestsIncluded",
  "trainingMaterialsIncluded",
  "accommodationIncluded",
  "fleetSummary",
  "aircraftAvailability",
  "studentAircraftRatio",
  "instructorStudentRatio",
  "languageOfInstruction",
  "programDurationMonths",
  "class1Requirement",
  "jobSupportSummary",
  "employmentClaimsType",
  "scores.documentTransparency",
  "scores.costClarity",
  "scores.financialRisk",
  "scores.commercialRisk",
  "scores.operationalSolidity",
  "scores.dataConfidenceScore",
  "universityTrack",
] as const;

export const PARITY_ARRAY_FIELDS = ["redFlags", "pendingData", "keyQuestions"] as const;

export type SchoolParityStatus = "ok" | "differences" | "missing_in_supabase" | "missing_in_local";

export type ScalarFieldDiff = {
  field: string;
  status: "equal" | "different" | "missing_in_supabase" | "missing_in_local";
  localValue: unknown;
  supabaseValue: unknown;
};

export type ArrayFieldDiff = {
  field: string;
  localCount: number;
  supabaseCount: number;
  matchingCount: number;
  onlyInLocal: string[];
  onlyInSupabase: string[];
};

export type SchoolParityRow = {
  slug: string;
  name: string;
  status: SchoolParityStatus;
  equalCount: number;
  differentCount: number;
  missingInSupabaseFields: string[];
  differentFields: ScalarFieldDiff[];
  arrayDiffs: ArrayFieldDiff[];
  observations: string[];
};

export type ProblematicFieldStat = {
  field: string;
  diffCount: number;
  missingInSupabaseCount: number;
};

export type ParityAuditReport = {
  generatedAt: string;
  localTotal: number;
  supabaseTotal: number;
  matchedSlugCount: number;
  onlyInLocalSlugs: string[];
  onlyInSupabaseSlugs: string[];
  parityPercent: number;
  problematicFields: ProblematicFieldStat[];
  schools: SchoolParityRow[];
};

function getNestedValue(entry: SchoolEntry, path: string): unknown {
  if (path === "universityTrack") {
    return entry.universityTrack ?? undefined;
  }
  if (path.startsWith("scores.")) {
    const key = path.slice("scores.".length) as keyof SchoolEntry["scores"];
    return entry.scores[key];
  }
  return (entry as Record<string, unknown>)[path];
}

function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (isMissingValue(a) && isMissingValue(b)) return true;
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

function formatValue(value: unknown): string {
  if (isMissingValue(value)) return "(ausente)";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && value.length > 120) {
    return `${value.slice(0, 117)}…`;
  }
  return String(value);
}

function compareScalarField(
  field: string,
  local: SchoolEntry | undefined,
  supabase: SchoolEntry | undefined,
): ScalarFieldDiff {
  if (!local && supabase) {
    return {
      field,
      status: "missing_in_local",
      localValue: undefined,
      supabaseValue: getNestedValue(supabase, field),
    };
  }
  if (local && !supabase) {
    return {
      field,
      status: "missing_in_supabase",
      localValue: getNestedValue(local, field),
      supabaseValue: undefined,
    };
  }

  const localValue = local ? getNestedValue(local, field) : undefined;
  const supabaseValue = supabase ? getNestedValue(supabase, field) : undefined;

  const localMissing = isMissingValue(localValue);
  const supabaseMissing = isMissingValue(supabaseValue);

  if (localMissing && supabaseMissing) {
    return { field, status: "equal", localValue, supabaseValue };
  }
  if (localMissing && !supabaseMissing) {
    return { field, status: "different", localValue, supabaseValue };
  }
  if (!localMissing && supabaseMissing) {
    return { field, status: "missing_in_supabase", localValue, supabaseValue };
  }
  if (valuesEqual(localValue, supabaseValue)) {
    return { field, status: "equal", localValue, supabaseValue };
  }
  return { field, status: "different", localValue, supabaseValue };
}

function compareArrayField(
  field: (typeof PARITY_ARRAY_FIELDS)[number],
  local: SchoolEntry | undefined,
  supabase: SchoolEntry | undefined,
): ArrayFieldDiff {
  const localArr = local?.[field] ?? [];
  const supabaseArr = supabase?.[field] ?? [];
  const localSet = new Set(localArr);
  const supabaseSet = new Set(supabaseArr);

  const onlyInLocal = localArr.filter((item) => !supabaseSet.has(item));
  const onlyInSupabase = supabaseArr.filter((item) => !localSet.has(item));
  const matchingCount = localArr.filter((item) => supabaseSet.has(item)).length;

  return {
    field,
    localCount: localArr.length,
    supabaseCount: supabaseArr.length,
    matchingCount,
    onlyInLocal,
    onlyInSupabase,
  };
}

function buildSchoolRow(
  slug: string,
  local: SchoolEntry | undefined,
  supabase: SchoolEntry | undefined,
): SchoolParityRow {
  const observations: string[] = [];
  let status: SchoolParityStatus = "ok";

  if (!local && supabase) {
    status = "missing_in_local";
    observations.push("Slug presente en Supabase pero no en schoolsSpain.ts");
  } else if (local && !supabase) {
    status = "missing_in_supabase";
    observations.push("Slug presente en schoolsSpain.ts pero no resuelto en Supabase");
  }

  const scalarDiffs = PARITY_SCALAR_FIELDS.map((field) =>
    compareScalarField(field, local, supabase),
  );

  const arrayDiffs = PARITY_ARRAY_FIELDS.map((field) =>
    compareArrayField(field, local, supabase),
  );

  let equalCount = 0;
  let differentCount = 0;
  const missingInSupabaseFields: string[] = [];
  const differentFields: ScalarFieldDiff[] = [];

  for (const diff of scalarDiffs) {
    if (diff.status === "equal") {
      equalCount += 1;
    } else if (diff.status === "missing_in_supabase") {
      differentCount += 1;
      missingInSupabaseFields.push(diff.field);
      differentFields.push(diff);
    } else if (diff.status === "different" || diff.status === "missing_in_local") {
      differentCount += 1;
      differentFields.push(diff);
    }
  }

  for (const arr of arrayDiffs) {
    const arraysMatch =
      arr.localCount === arr.supabaseCount &&
      arr.onlyInLocal.length === 0 &&
      arr.onlyInSupabase.length === 0;
    if (arraysMatch) {
      equalCount += 1;
    } else {
      differentCount += 1;
      if (arr.onlyInLocal.length > 0 || arr.supabaseCount === 0) {
        missingInSupabaseFields.push(`${arr.field} (contenido)`);
      }
      observations.push(
        `${arr.field}: local=${arr.localCount}, supabase=${arr.supabaseCount}, coincidencias=${arr.matchingCount}`,
      );
    }
  }

  if (status === "ok" && differentCount > 0) {
    status = "differences";
  }

  if (differentFields.length > 0 && status === "ok") {
    status = "differences";
  }

  const topDiffs = differentFields
    .filter((d) => d.status === "different")
    .slice(0, 3)
    .map((d) => `${d.field}: «${formatValue(d.localValue)}» vs «${formatValue(d.supabaseValue)}»`);
  observations.push(...topDiffs);

  return {
    slug,
    name: local?.name ?? supabase?.name ?? slug,
    status,
    equalCount,
    differentCount,
    missingInSupabaseFields,
    differentFields,
    arrayDiffs,
    observations: observations.filter(Boolean),
  };
}

function indexBySlug(entries: SchoolEntry[]): Map<string, SchoolEntry> {
  const map = new Map<string, SchoolEntry>();
  for (const entry of entries) {
    if (map.has(entry.slug)) {
      console.warn(`[parity-audit] slug duplicado en dataset: ${entry.slug}`);
    }
    map.set(entry.slug, entry);
  }
  return map;
}

export function runSupabaseParityAudit(
  localEntries: SchoolEntry[],
  supabaseEntries: SchoolEntry[],
): ParityAuditReport {
  const localBySlug = indexBySlug(localEntries);
  const supabaseBySlug = indexBySlug(supabaseEntries);

  const allSlugs = new Set([...localBySlug.keys(), ...supabaseBySlug.keys()]);
  const onlyInLocalSlugs = [...localBySlug.keys()].filter((s) => !supabaseBySlug.has(s)).sort();
  const onlyInSupabaseSlugs = [...supabaseBySlug.keys()].filter((s) => !localBySlug.has(s)).sort();
  const matchedSlugCount = [...allSlugs].filter(
    (s) => localBySlug.has(s) && supabaseBySlug.has(s),
  ).length;

  const schools = [...allSlugs]
    .sort()
    .map((slug) =>
      buildSchoolRow(slug, localBySlug.get(slug), supabaseBySlug.get(slug)),
    );

  const fieldProblemMap = new Map<string, ProblematicFieldStat>();

  const bump = (field: string, kind: "diff" | "missing") => {
    const current = fieldProblemMap.get(field) ?? {
      field,
      diffCount: 0,
      missingInSupabaseCount: 0,
    };
    if (kind === "diff") current.diffCount += 1;
    else current.missingInSupabaseCount += 1;
    fieldProblemMap.set(field, current);
  };

  for (const row of schools) {
    if (row.status === "missing_in_supabase") {
      bump("(escuela completa)", "missing");
      continue;
    }
    for (const diff of row.differentFields) {
      if (diff.status === "missing_in_supabase") bump(diff.field, "missing");
      else if (diff.status === "different") bump(diff.field, "diff");
    }
    for (const arr of row.arrayDiffs) {
      if (arr.onlyInLocal.length > 0 || arr.localCount !== arr.supabaseCount) {
        bump(arr.field, "diff");
      }
      if (arr.supabaseCount === 0 && arr.localCount > 0) {
        bump(arr.field, "missing");
      }
    }
  }

  const problematicFields = [...fieldProblemMap.values()].sort(
    (a, b) => b.diffCount + b.missingInSupabaseCount - (a.diffCount + a.missingInSupabaseCount),
  );

  const comparableFieldSlots =
    schools.filter((s) => s.status !== "missing_in_supabase" && s.status !== "missing_in_local")
      .length *
    (PARITY_SCALAR_FIELDS.length + PARITY_ARRAY_FIELDS.length);

  const totalEqual = schools.reduce((sum, s) => sum + s.equalCount, 0);
  const parityPercent =
    comparableFieldSlots > 0
      ? Math.round((totalEqual / comparableFieldSlots) * 1000) / 10
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    localTotal: localEntries.length,
    supabaseTotal: supabaseEntries.length,
    matchedSlugCount,
    onlyInLocalSlugs,
    onlyInSupabaseSlugs,
    parityPercent,
    problematicFields,
    schools,
  };
}

export function statusLabel(status: SchoolParityStatus): string {
  switch (status) {
    case "ok":
      return "OK";
    case "differences":
      return "Diferencias";
    case "missing_in_supabase":
      return "Falta en Supabase";
    case "missing_in_local":
      return "Falta en schoolsSpain";
    default:
      return status;
  }
}

export function statusBadgeClass(status: SchoolParityStatus): string {
  switch (status) {
    case "ok":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "differences":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "missing_in_supabase":
      return "bg-red-100 text-red-800 border-red-200";
    case "missing_in_local":
      return "bg-violet-100 text-violet-800 border-violet-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
