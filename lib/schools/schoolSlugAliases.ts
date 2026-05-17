/**
 * Slug en schoolsSpain.ts → slug en Supabase (mismo mapa que el seed de paridad).
 * La auditoría y el mapper usan el inverso para emparejar entradas.
 */
export const SCHOOL_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "one-air": "oneair",
  "flyschool-air-academy": "flyschool",
  "airpull-aviation-academy": "airpull",
  "world-aviation-ato": "world-aviation",
  "panamedia-escuela-de-pilotos": "panamedia",
};

/** Slug local (schoolsSpain) → slug en BD. */
export function resolveSupabaseSlugForLocal(localSlug: string): string {
  return SCHOOL_SLUG_ALIASES[localSlug] ?? localSlug;
}

/** Slug en BD → slug local si existe alias conocido. */
export function localSlugFromSupabaseSlug(supabaseSlug: string): string | undefined {
  for (const [localSlug, dbSlug] of Object.entries(SCHOOL_SLUG_ALIASES)) {
    if (dbSlug === supabaseSlug) return localSlug;
  }
  return undefined;
}
