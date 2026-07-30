import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260729160000_add_content_os_tiktok_intelligence.sql",
  ),
  "utf8",
);

describe("Content OS TikTok migration", () => {
  it("mantiene conexión y staging separados de la biblioteca confirmada", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.content_tiktok_connections",
    );
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.content_tiktok_videos",
    );
    expect(migration).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS content_tiktok_videos_workspace_video_uidx",
    );
    expect(migration).toContain("analysis_status = 'pending_review'");
    expect(migration).toContain("analysis_status = 'confirmed'");
    expect(migration).toContain("'historical'");
  });

  it("protege tokens y datos privados con RLS y service role", () => {
    for (const table of [
      "content_tiktok_connections",
      "content_tiktok_videos",
    ]) {
      expect(migration).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
      expect(migration).toContain(
        `REVOKE ALL ON public.${table}\n  FROM PUBLIC, anon, authenticated`,
      );
    }
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("TO service_role");
  });

  it("mantiene revisión atómica e idempotencia por vídeo", () => {
    expect(migration).toContain(
      "ON CONFLICT (workspace_key, tiktok_video_id) DO UPDATE",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.review_content_os_tiktok_analysis",
    );
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("content_os_admin_required");
  });

  it("limita reintentos IA y conserva métricas TikTok inexistentes como NULL", () => {
    expect(migration).toContain("analysis_attempt_count integer NOT NULL DEFAULT 0");
    expect(migration).toContain("analysis_next_retry_at timestamptz");
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mark_content_os_tiktok_analysis_failed",
    );
    expect(migration).toContain("analysis_attempt_count + 1 < 3");
    expect(migration).toContain("ALTER COLUMN views DROP NOT NULL");
    expect(migration).toContain("source_video.views,");
  });

  it("protege el refresco y la sincronización con leases distribuidos", () => {
    for (const functionName of [
      "claim_content_os_tiktok_sync",
      "release_content_os_tiktok_sync",
      "claim_content_os_tiktok_token_refresh",
      "save_content_os_tiktok_refreshed_tokens",
      "release_content_os_tiktok_token_refresh",
    ]) {
      expect(migration).toContain(
        `CREATE OR REPLACE FUNCTION public.${functionName}`,
      );
    }
    expect(migration).toContain("sync_lock_until <= now()");
    expect(migration).toContain("token_refresh_lock_until <= now()");
  });
});
