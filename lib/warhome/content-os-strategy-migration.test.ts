import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260729140000_add_content_os_ai_strategist.sql",
  ),
  "utf8",
);

describe("Content OS AI strategist migration", () => {
  it("reutiliza el banco de ideas y añade metadatos estratégicos estructurados", () => {
    expect(migration).toContain("ALTER TABLE public.content_ideas");
    expect(migration).not.toContain(
      "CREATE TABLE IF NOT EXISTS public.content_strategy_proposals",
    );
    for (const field of [
      "strategy_idea",
      "strategy_hook",
      "strategy_platforms",
      "strategy_format",
      "strategy_product_key",
      "strategy_priority",
      "strategy_pillar",
    ]) {
      expect(migration).toContain(field);
    }
  });

  it("impide duplicados básicos y propuestas que eviten revisión", () => {
    expect(migration).toContain("content_ideas_strategy_fingerprint_unique");
    expect(migration).toContain("content_os_strategy_duplicate");
    expect(migration).toContain("idea.proposal_status <> 'approved'");
    expect(migration).toContain("content_os_idea_not_approved");
  });

  it("mantiene creación y revisión atómicas e idempotentes", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.create_content_os_strategy_proposals",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.review_content_os_strategy_proposal",
    );
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("IF idea.proposal_status = p_decision THEN");
    expect(migration).toContain("RETURN idea.id;");
  });

  it("cierra RLS y limita las RPC a service_role y admins Warhome", () => {
    expect(migration).toContain(
      "ALTER TABLE public.content_strategy_generation_throttles",
    );
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("FROM public.admin_users");
    expect(migration).toContain("role IN ('admin', 'owner')");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
  });

  it("no almacena prompts, respuestas crudas ni secretos", () => {
    expect(migration).not.toMatch(/raw_prompt|raw_response|provider_payload/i);
    expect(migration).not.toMatch(/api_key|password|secret/i);
  });
});
