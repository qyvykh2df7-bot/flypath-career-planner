import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260712310000_add_aerocomms_voice_rate_limits.sql"),
  "utf8",
);

describe("AeroComms voice distributed rate-limit migration", () => {
  it("mantiene la tabla privada y la RPC disponible solo para service_role", () => {
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.aerocomms_voice_rate_limits FROM PUBLIC, anon, authenticated, service_role");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.consume_aerocomms_voice_rate_limit(text, text) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.consume_aerocomms_voice_rate_limit(text, text) TO service_role");
  });

  it("centraliza en SQL las cuotas separadas de TTS y STT", () => {
    expect(migration).toContain("WHEN 'tts_anonymous' THEN v_limit := 8; v_window_seconds := 600");
    expect(migration).toContain("WHEN 'stt_anonymous' THEN v_limit := 2; v_window_seconds := 3600");
    expect(migration).toContain("WHEN 'stt_authenticated_free' THEN v_limit := 8; v_window_seconds := 3600");
    expect(migration).toContain("WHEN 'stt_pro' THEN v_limit := 100; v_window_seconds := 3600");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("unique_violation");
  });
});
