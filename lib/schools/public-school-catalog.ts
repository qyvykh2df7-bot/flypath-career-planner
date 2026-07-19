import "server-only";

import { getSupabaseSchoolEntries } from "@/lib/schoolMapper";
import {
  PUBLIC_SCHOOL_ENTRY_KEYS,
  type PublicSchoolEntry,
} from "@/lib/schools/public-school-contract";
import { isSchoolComparable } from "@/lib/schools/schoolUtils";
import type { SchoolEntry } from "@/types/schools";

/**
 * Contrato que puede cruzar el límite servidor-navegador. Las decisiones editoriales que
 * determinan si una escuela entra en el comparador se aplican en servidor y no se serializan.
 */
export type { PublicSchoolEntry } from "@/lib/schools/public-school-contract";

export function toPublicSchoolEntry(entry: SchoolEntry): PublicSchoolEntry {
  return Object.fromEntries(
    PUBLIC_SCHOOL_ENTRY_KEYS.flatMap((key) =>
      entry[key] === undefined ? [] : [[key, entry[key]]],
    ),
  ) as PublicSchoolEntry;
}

/**
 * Construye el catálogo público con el cliente de administración exclusivamente en servidor.
 * `getSupabaseSchoolEntries` puede consultar campos editoriales para componer la entrada, pero
 * esta frontera solo devuelve el contrato cerrado de `PublicSchoolEntry`.
 */
export async function getPublicSupabaseSchoolCatalog(): Promise<PublicSchoolEntry[]> {
  const entries = await getSupabaseSchoolEntries();
  return entries.filter(isSchoolComparable).map(toPublicSchoolEntry);
}

export async function getPublicSupabaseSchoolBySlug(
  slug: string,
): Promise<PublicSchoolEntry | undefined> {
  const entries = await getPublicSupabaseSchoolCatalog();
  return entries.find((entry) => entry.slug === slug);
}
