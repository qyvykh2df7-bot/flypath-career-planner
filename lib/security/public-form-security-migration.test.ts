import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260712320000_harden_public_forms_and_marketing_opt_in.sql"),
  "utf8",
);

describe("public form security migration", () => {
  it("keeps rate limiting and marketing confirmation private and server-only", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.public_form_rate_limits");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.email_marketing_confirmation_tokens");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.consume_public_form_rate_limit");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.consume_public_form_rate_limit(text, text) TO service_role");
  });

  it("contains the approved quotas and cleanup strategy", () => {
    expect(migration).toContain("WHEN 'newsletter_ip' THEN v_limit := 3; v_window_seconds := 3600");
    expect(migration).toContain("WHEN 'career_planner_email' THEN v_limit := 3; v_window_seconds := 86400");
    expect(migration).toContain("WHEN 'school_review_identity' THEN v_limit := 5; v_window_seconds := 86400");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.purge_public_form_security_data()");
    expect(migration).toContain("now() - interval '30 days'");
  });
});
