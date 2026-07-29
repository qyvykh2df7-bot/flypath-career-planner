-- =============================================================================
-- Distributed, server-only cost control for AeroComms OpenAI voice endpoints.
-- The table stores only HMAC-SHA256 subjects, never user ids, IPs, audio or text.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.aerocomms_voice_rate_limits (
  scope text NOT NULL,
  subject_hash text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, subject_hash),
  CONSTRAINT aerocomms_voice_rate_limits_scope_check CHECK (
    scope IN (
      'tts_anonymous', 'tts_authenticated_free', 'tts_pro',
      'stt_anonymous', 'stt_authenticated_free', 'stt_pro'
    )
  ),
  CONSTRAINT aerocomms_voice_rate_limits_subject_hash_check CHECK (subject_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT aerocomms_voice_rate_limits_request_count_check CHECK (request_count >= 0)
);

CREATE INDEX IF NOT EXISTS aerocomms_voice_rate_limits_updated_at_idx
  ON public.aerocomms_voice_rate_limits (updated_at ASC);

ALTER TABLE public.aerocomms_voice_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.aerocomms_voice_rate_limits FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_aerocomms_voice_rate_limit(
  p_scope text,
  p_subject_hash text
)
RETURNS TABLE (allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_window_seconds integer;
  v_now timestamptz := now();
  v_row public.aerocomms_voice_rate_limits%ROWTYPE;
  v_retry_after integer;
BEGIN
  IF p_subject_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid AeroComms voice rate-limit subject';
  END IF;

  CASE p_scope
    WHEN 'tts_anonymous' THEN v_limit := 8; v_window_seconds := 600;
    WHEN 'tts_authenticated_free' THEN v_limit := 30; v_window_seconds := 600;
    WHEN 'tts_pro' THEN v_limit := 90; v_window_seconds := 600;
    WHEN 'stt_anonymous' THEN v_limit := 2; v_window_seconds := 3600;
    WHEN 'stt_authenticated_free' THEN v_limit := 8; v_window_seconds := 3600;
    WHEN 'stt_pro' THEN v_limit := 100; v_window_seconds := 3600;
    ELSE RAISE EXCEPTION 'Invalid AeroComms voice rate-limit scope';
  END CASE;

  LOOP
    SELECT * INTO v_row
    FROM public.aerocomms_voice_rate_limits
    WHERE scope = p_scope AND subject_hash = p_subject_hash
    FOR UPDATE;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO public.aerocomms_voice_rate_limits (
          scope, subject_hash, window_started_at, request_count, updated_at
        ) VALUES (p_scope, p_subject_hash, v_now, 1, v_now);
        RETURN QUERY SELECT true, 0;
        RETURN;
      EXCEPTION WHEN unique_violation THEN
        -- Another Vercel instance inserted the same subject concurrently. Lock it
        -- on the next loop iteration so the limit remains atomic.
      END;
    ELSIF v_row.window_started_at + make_interval(secs => v_window_seconds) <= v_now THEN
      UPDATE public.aerocomms_voice_rate_limits
      SET window_started_at = v_now, request_count = 1, updated_at = v_now
      WHERE scope = p_scope AND subject_hash = p_subject_hash;
      RETURN QUERY SELECT true, 0;
      RETURN;
    ELSIF v_row.request_count >= v_limit THEN
      v_retry_after := GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (v_row.window_started_at + make_interval(secs => v_window_seconds) - v_now)))::integer
      );
      UPDATE public.aerocomms_voice_rate_limits
      SET updated_at = v_now
      WHERE scope = p_scope AND subject_hash = p_subject_hash;
      RETURN QUERY SELECT false, v_retry_after;
      RETURN;
    ELSE
      UPDATE public.aerocomms_voice_rate_limits
      SET request_count = request_count + 1, updated_at = v_now
      WHERE scope = p_scope AND subject_hash = p_subject_hash;
      RETURN QUERY SELECT true, 0;
      RETURN;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_aerocomms_voice_rate_limit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_aerocomms_voice_rate_limit(text, text) TO service_role;

COMMIT;
