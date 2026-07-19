import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712140000_create_school_reviews_backend.sql"),
  "utf8",
);
const atomicModerationMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712150000_make_school_review_moderation_atomic.sql"),
  "utf8",
);

describe("school reviews migration", () => {
  it("creates private review tables with closed lifecycle and private identity", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.school_reviews");
    expect(migration).toContain("REFERENCES public.schools (school_id) ON DELETE RESTRICT");
    expect(migration).toContain("author_email_hash ~ '^[0-9a-f]{64}$'");
    expect(migration).toContain("school_reviews_active_school_email_unique");
    expect(migration).toContain("school_reviews_active_school_user_unique");
    expect(migration).toContain("awaiting_email_verification");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.school_review_tokens");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.school_review_versions");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.school_review_moderation_events");
  });

  it("allows the verification email job without manufacturing a lead", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS school_review_id uuid");
    expect(migration).toContain("school_review_verification");
    expect(migration).toContain("lead_id IS NULL AND school_review_id IS NOT NULL");
    expect(migration).not.toMatch(/INSERT\s+INTO\s+public\.leads/i);
    expect(migration).not.toMatch(/INSERT\s+INTO\s+public\.email_subscriptions/i);
  });

  it("keeps all raw review tables private to service_role", () => {
    for (const table of ["school_reviews", "school_review_tokens", "school_review_versions", "school_review_moderation_events"]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT SELECT, INSERT, UPDATE ON public.school_reviews, public.school_review_tokens TO service_role");
    expect(migration).toContain("GRANT SELECT, INSERT ON public.school_review_versions, public.school_review_moderation_events TO service_role");
  });

  it("makes the review state update and append-only moderation audit atomic", () => {
    expect(atomicModerationMigration).toContain("CREATE OR REPLACE FUNCTION public.moderate_school_review_atomically");
    expect(atomicModerationMigration).toContain("SECURITY DEFINER");
    expect(atomicModerationMigration).toContain("SET search_path = public, pg_temp");
    expect(atomicModerationMigration).toContain("FOR UPDATE");
    expect(atomicModerationMigration).toContain("UPDATE public.school_reviews");
    expect(atomicModerationMigration).toContain("INSERT INTO public.school_review_moderation_events");
    expect(atomicModerationMigration).toContain("already_applied");
    expect(atomicModerationMigration).toContain("state_conflict");
    expect(atomicModerationMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(atomicModerationMigration).toContain(") TO service_role");
  });
});
