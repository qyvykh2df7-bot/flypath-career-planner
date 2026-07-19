import "server-only";

import { getPublicSupabaseSchoolBySlug } from "@/lib/schools/public-school-catalog";
import { isSupabaseSchoolsEnabled } from "@/lib/schools/schoolCatalogConfig";
import { getComparableSchoolBySlug } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

/** Ficha pública SSR. Conserva el dataset local si la fuente remota segura no está activa o falla. */
export async function loadComparableSchoolBySlug(
  slug: string,
): Promise<SchoolEntry | undefined> {
  const legacy = getComparableSchoolBySlug(slug);

  if (!isSupabaseSchoolsEnabled()) return legacy;

  try {
    return (await getPublicSupabaseSchoolBySlug(slug)) ?? legacy;
  } catch {
    return legacy;
  }
}
