/** Activa la fuente remota segura del catálogo público cuando se configura explícitamente. */
export function isSupabaseSchoolsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_SUPABASE_SCHOOLS === "true";
}
