import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712110000_create_aerocomms_progress_persistence.sql"),
  "utf8",
);

describe("20260712110000 AeroComms persistence migration", () => {
  it("creates the closed, account-owned persistence model with RLS", () => {
    for (const table of [
      "aerocomms_progress",
      "aerocomms_exercise_progress",
      "aerocomms_mission_progress",
      "aerocomms_skill_stats",
      "aerocomms_sessions",
      "aerocomms_sync_receipts",
    ]) {
      expect(migration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }

    expect(migration).toContain("REFERENCES auth.users(id) ON DELETE CASCADE");
    expect(migration).toContain("UNIQUE (user_id, client_session_id)");
    expect(migration).toContain("ready-for-radio");
    expect(migration).not.toContain("'rfr'");
  });

  it("keeps browser writes behind a service-only transactional RPC", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.apply_aerocomms_progress_sync");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.apply_aerocomms_progress_sync");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("INSERT INTO public.aerocomms_sync_receipts");
    expect(migration).toContain("ON CONFLICT (user_id, operation_id) DO NOTHING");
    expect(migration).toContain("v_existing_payload_hash IS DISTINCT FROM md5(p_payload::text)");
    expect(migration).toContain("AeroComms sync operation payload mismatch");
    expect((migration.match(/v_new_scored_count integer/g) ?? [])).toHaveLength(1);
    expect(migration).toContain("score_sum integer NOT NULL DEFAULT 0");
  });

  it("derives post-import aggregates from newly inserted session facts", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("IF v_initial_import THEN");
    expect(migration).toContain("attempt_count = public.aerocomms_mission_progress.attempt_count + EXCLUDED.attempt_count");
    expect(migration).not.toContain("attempt_count = GREATEST(public.aerocomms_mission_progress.attempt_count, EXCLUDED.attempt_count)");
    expect(migration).toContain("jsonb_array_elements_text(incoming.skill_ids)");
    expect(migration).toContain("activity_dates");
    expect(migration).toContain("legacy_streak_days");
    expect(migration).toContain("legacy_last_activity_date");
    expect(migration).toContain("score_sum = score_sum + v_new_score_sum");
    expect(migration).not.toContain("accuracy * scored_session_count");
  });

  it("persists resets and reads historic content without hiding prior versions", () => {
    expect(migration).toContain("reset_at timestamptz NULL");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.reset_aerocomms_progress");
    expect(migration).toContain("DELETE FROM public.aerocomms_sessions WHERE user_id = p_user_id");
    expect(migration).toContain("item.occurred_at > v_reset_at");
    expect(migration).toContain("AeroComms reset operation payload mismatch");
    expect(migration).not.toContain("ep.user_id = p.user_id AND ep.content_version = p.content_version");
    expect(migration).not.toContain("mp.user_id = p.user_id AND mp.content_version = p.content_version");

    expect(migration).not.toContain("subscription_id");
    expect(migration).not.toContain("entitlement_id");
    expect(migration).not.toContain("stripe_");
    expect(migration).not.toContain("transcript_text");
  });
});
