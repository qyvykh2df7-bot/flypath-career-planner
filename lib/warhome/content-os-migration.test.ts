import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260729120000_create_content_os_pilotfeliu_mvp.sql",
  ),
  "utf8",
);

describe("Content OS migration", () => {
  it("reutiliza content_items y crea solo las entidades operativas que faltan", () => {
    expect(migration).toContain("ALTER TABLE public.content_items");
    expect(migration).not.toContain("CREATE TABLE IF NOT EXISTS public.content_items");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.content_ideas");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.content_calendar_events");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.content_metrics");
  });

  it("mantiene estados, plataformas, objetivos y eventos en conjuntos cerrados", () => {
    expect(migration).toContain("'tiktok_pilotfeliu'");
    expect(migration).toContain("'instagram_flypath'");
    expect(migration).toContain("'growth', 'community', 'authority', 'conversion'");
    expect(migration).toContain("'new', 'approved', 'production', 'published', 'discarded'");
    expect(migration).toContain("'record', 'edit', 'publish'");
    expect(migration).toContain("CHECK (ends_at > starts_at)");
    expect(migration).toContain("UNIQUE (content_item_id, recorded_on)");
  });

  it("aísla los eventos en el workspace privado y alinea límites con el contrato", () => {
    expect(migration).toContain("workspace_key text NOT NULL DEFAULT 'pilotfeliu'");
    expect(migration).toContain("content_calendar_events_workspace_key_check");
    expect(migration).toContain("content_calendar_events_workspace_starts_at_idx");
    expect(migration).toContain("content_calendar_events_content_item_workspace_fkey");
    expect(migration).toContain("REFERENCES public.content_items (id, workspace_key)");
    expect(migration).toContain("char_length(title) <= 160");
    expect(migration).toContain("char_length(script) <= 30000");
    expect(migration).toContain("char_length(notes) <= 10000");
    expect(migration).toContain("views <= 1000000000");
  });

  it("protege las constraints nombradas ante una reejecución nominal", () => {
    expect(migration).toContain("PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS");
    expect(migration).toContain("conrelid = 'public.content_items'::regclass");
    expect(migration).toContain("content_items_source_idea_id_fkey");
  });

  it("cierra RLS y ACL a clientes Supabase", () => {
    for (const table of ["content_ideas", "content_calendar_events", "content_metrics"]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(migration).toContain(
        `REVOKE ALL ON public.${table} FROM PUBLIC, anon, authenticated`,
      );
      expect(migration).toContain(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.${table} TO service_role`,
      );
    }
  });

  it("protege la promoción atómica para Warhome y service_role", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM public.admin_users");
    expect(migration).toContain("role IN ('admin', 'owner')");
    expect(migration).toContain("content_os_idea_discarded");
    expect(migration.indexOf("IF existing_item_id IS NOT NULL THEN")).toBeLessThan(
      migration.indexOf("content_os_idea_discarded"),
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.promote_content_os_idea(uuid, uuid)",
    );
    expect(migration).toContain("TO service_role");
  });

  it("no abre policies para anon o authenticated ni almacena secretos", () => {
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]+TO\s+(anon|authenticated)/i);
    expect(migration).not.toMatch(/token|secret|password|api_key/i);
  });
});
