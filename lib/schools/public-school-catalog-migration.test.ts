import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260712130000_harden_public_school_catalog_access.sql"),
  "utf8",
);

describe("20260712130000_harden_public_school_catalog_access", () => {
  it("protege todas las tablas base y conserva lectura solo para service_role", () => {
    for (const table of [
      "schools",
      "programs",
      "modular_modules",
      "costs_and_payments",
      "extras",
      "risk_flags",
      "sources",
      "school_scores",
      "school_text_list_items",
      "university_tracks",
    ]) {
      expect(migration).toContain(`'${table}'`);
    }

    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.%I TO service_role");
    expect(migration).toContain("DROP POLICY IF EXISTS %I ON public.%I");
  });

  it("documenta que las columnas editoriales no deben salir de las tablas brutas", () => {
    expect(migration).toMatch(/RLS restricts rows, not\s*--\s*columns/i);
    expect(migration).toContain("DTO público cerrado");
  });
});
