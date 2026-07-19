import { isSupabaseSchoolsEnabled } from "@/lib/schools/schoolCatalogConfig";
import { PUBLIC_SCHOOL_ENTRY_KEY_SET } from "@/lib/schools/public-school-contract";
import {
  getComparableSchools,
  isSchoolComparable,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

export { isSupabaseSchoolsEnabled };

/**
 * Fuente síncrona legacy (schoolsSpain.ts filtrado). Usar como fallback inmediato
 * y cuando la variable de entorno no está activa.
 */
export function getComparableSchoolsSync(): SchoolEntry[] {
  return getComparableSchools();
}

/**
 * Fuente para el comparador /schools.
 * - Sin flag: schoolsSpain.ts (mismo que `getComparableSchools()`).
 * - Con flag: API pública con DTO cerrado, con fallback a schoolsSpain.ts.
 */
export async function loadComparableSchoolsForComparator(): Promise<SchoolEntry[]> {
  const legacy = getComparableSchools();

  if (!isSupabaseSchoolsEnabled()) {
    return legacy;
  }

  try {
    const response = await fetch("/api/schools/catalog", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Public school catalog unavailable");

    const payload: unknown = await response.json();
    if (!isPublicSchoolCatalogPayload(payload)) {
      throw new Error("Public school catalog payload is invalid");
    }

    return payload.schools.filter(isSchoolComparable);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[FlyPath] Supabase schools load failed", error);
    }
    return legacy;
  }
}

function isPublicSchoolCatalogPayload(value: unknown): value is { schools: SchoolEntry[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const schools = (value as { schools?: unknown }).schools;
  return Array.isArray(schools) && schools.every(isPublicSchoolEntry);
}

function isPublicSchoolEntry(value: unknown): value is SchoolEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    Object.keys(row).every((key) => PUBLIC_SCHOOL_ENTRY_KEY_SET.has(key)) &&
    typeof row.id === "string" &&
    typeof row.slug === "string" &&
    typeof row.name === "string" &&
    typeof row.routeType === "string" &&
    typeof row.dataStatus === "string" &&
    !Object.prototype.hasOwnProperty.call(row, "internal_notes") &&
    !Object.prototype.hasOwnProperty.call(row, "school_entry_snapshot") &&
    !Object.prototype.hasOwnProperty.call(row, "comparator_exclusion_note") &&
    !Object.prototype.hasOwnProperty.call(row, "comparatorExclusionNote")
  );
}
