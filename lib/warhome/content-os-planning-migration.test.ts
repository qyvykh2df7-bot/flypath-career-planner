import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260729130000_add_content_os_roster_and_ai_planner.sql",
  ),
  "utf8",
);

describe("Content OS roster and planner migration", () => {
  it("crea roster y propuestas separadas del calendario", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.content_availability_slots",
    );
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.content_planning_proposals",
    );
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.content_planning_proposal_events",
    );
    expect(migration).toContain(
      "CHECK (availability_type IN ('work', 'rest', 'travel', 'recording_available'))",
    );
    expect(migration).toContain(
      "CREATE TRIGGER content_availability_slots_prevent_conflict",
    );
    expect(migration).toContain("content_os_availability_conflict");
  });

  it("solo materializa eventos al aprobar mediante una RPC atómica", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.review_content_os_planning_proposal",
    );
    expect(migration).toContain("IF p_decision = 'approved' THEN");
    expect(migration).toContain("INSERT INTO public.content_calendar_events");
    expect(migration).toContain("'ai'");
    expect(migration).toContain("'approved'");
    expect(migration).toContain(
      "ON CONFLICT (source_proposal_event_id) WHERE source_proposal_event_id IS NOT NULL",
    );
    expect(migration).toContain("IF proposal.status = p_decision THEN");
    expect(migration).toContain("content_os_proposal_event_conflict");
    expect(migration).toContain("content_os_proposal_calendar_conflict");
    expect(migration).toContain("JOIN public.content_calendar_events AS calendar_event");
    expect(migration).toContain(
      "CREATE TRIGGER content_calendar_events_prevent_ai_conflict",
    );
  });

  it("protege ambas RPC con autorización Warhome y service_role", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM public.admin_users");
    expect(migration).toContain("role IN ('admin', 'owner')");
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.create_content_os_planning_proposal",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.review_content_os_planning_proposal",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.claim_content_os_planning_generation",
    );
  });

  it("mantiene RLS cerrada y no persiste prompts ni payloads del proveedor", () => {
    for (const table of [
      "content_availability_slots",
      "content_planning_proposals",
      "content_planning_proposal_events",
      "content_planning_generation_throttles",
    ]) {
      expect(migration).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
      expect(migration).toContain(
        `REVOKE ALL ON public.${table} FROM PUBLIC, anon, authenticated`,
      );
    }
    expect(migration).not.toMatch(/prompt|provider_payload|api_key|secret/i);
  });
});
