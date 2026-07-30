import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260729150000_add_content_os_brand_dna_and_historical_library.sql",
  ),
  "utf8",
);

describe("Content OS Brand DNA and historical library migration", () => {
  it("crea un único Brand DNA privado y conserva el catálogo existente", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.content_brand_profiles",
    );
    expect(migration).toContain("workspace_key text PRIMARY KEY");
    expect(migration).toContain("CHECK (workspace_key = 'pilotfeliu')");
    expect(migration).toContain("ON CONFLICT (workspace_key) DO NOTHING");
    expect(migration).not.toContain(
      "CREATE TABLE IF NOT EXISTS public.content_items",
    );
  });

  it("separa piezas futuras e históricas y admite la métrica de guardados", () => {
    expect(migration).toContain(
      "ADD COLUMN IF NOT EXISTS content_origin text NOT NULL DEFAULT 'planned'",
    );
    expect(migration).toContain(
      "content_origin IN ('planned', 'historical')",
    );
    expect(migration).toContain("status = 'published'");
    expect(migration).toContain(
      "ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0",
    );
  });

  it("importa publicación y métricas en una única RPC autorizada", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.import_content_os_historical_item",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM public.admin_users");
    expect(migration).toContain("role IN ('admin', 'owner')");
    expect(migration).toContain("INSERT INTO public.content_items");
    expect(migration).toContain("INSERT INTO public.content_metrics");
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.upsert_content_os_brand_profile",
    );
  });

  it("mantiene RLS cerrada y ejecución exclusiva de service_role", () => {
    expect(migration).toContain(
      "ALTER TABLE public.content_brand_profiles ENABLE ROW LEVEL SECURITY",
    );
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]+TO\s+(anon|authenticated)/i);
  });
});
