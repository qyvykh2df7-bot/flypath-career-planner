import { resolveSupabaseSlugForLocal } from "@/lib/schools/schoolSlugAliases";
import { getSupabaseSchoolEntries } from "@/lib/schoolMapper";
import {
  getComparableSchoolBySlug,
  getComparableSchools,
  isSchoolComparable,
} from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

/** `true` cuando /schools debe intentar cargar escuelas desde Supabase. */
export function isSupabaseSchoolsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS === "true";
}

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
 * - Con flag: Supabase vía `getSupabaseSchoolEntries()`, con fallback a schoolsSpain.ts.
 */
export async function loadComparableSchoolsForComparator(): Promise<SchoolEntry[]> {
  const legacy = getComparableSchools();

  if (!isSupabaseSchoolsEnabled()) {
    return legacy;
  }

  try {
    const entries = await getSupabaseSchoolEntries();
    return entries.filter(isSchoolComparable);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[FlyPath] Supabase schools load failed", error);
    }
    return legacy;
  }
}

/**
 * Ficha individual /schools/[slug].
 * - Sin flag: `getComparableSchoolBySlug` (schoolsSpain.ts).
 * - Con flag: Supabase por slug, alias de slug o `legacy_entry_id`; fallback a schoolsSpain.ts.
 */
export async function loadComparableSchoolBySlug(
  slug: string,
): Promise<SchoolEntry | undefined> {
  const legacy = getComparableSchoolBySlug(slug);

  if (!isSupabaseSchoolsEnabled()) {
    return legacy;
  }

  try {
    const { getFullSchoolProfileBySlug, getFullSchoolProfileByLegacyEntryId } =
      await import("@/lib/schoolQueries");
    const { mapSupabaseProfileToSchoolEntry } = await import("@/lib/schoolMapper");

    const dbSlug = resolveSupabaseSlugForLocal(slug);
    let profile =
      (await getFullSchoolProfileBySlug(dbSlug)) ??
      (slug !== dbSlug ? await getFullSchoolProfileBySlug(slug) : null);

    if (!profile && legacy) {
      profile = await getFullSchoolProfileByLegacyEntryId(legacy.id);
    }

    if (profile) {
      const entry = mapSupabaseProfileToSchoolEntry(profile);
      if (!isSchoolComparable(entry)) {
        return legacy;
      }
      return entry.slug === slug ? entry : { ...entry, slug };
    }

    if (process.env.NODE_ENV !== "production" && !legacy) {
      console.warn(`[FlyPath] /schools/${slug} not found in Supabase`);
    }

    return legacy;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[FlyPath] /schools/${slug} Supabase load failed`, error);
    }
    return legacy;
  }
}
