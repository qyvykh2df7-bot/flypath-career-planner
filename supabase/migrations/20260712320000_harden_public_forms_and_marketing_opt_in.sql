-- =============================================================================
-- Public-form abuse protection and marketing double opt-in.
-- Stores only HMAC quota subjects and SHA-256 opaque-token hashes.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.public_form_rate_limits (
  scope text NOT NULL,
  subject_hash text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, subject_hash),
  CONSTRAINT public_form_rate_limits_scope_check CHECK (scope IN (
    'newsletter_ip', 'newsletter_email',
    'career_planner_ip', 'career_planner_email',
    'preppl_ip', 'preppl_email',
    'mentorship_ip', 'mentorship_email',
    'school_review_ip', 'school_review_identity', 'school_review_resend_ip',
    'school_review_verify_ip', 'school_review_verify_token'
  )),
  CONSTRAINT public_form_rate_limits_subject_hash_check CHECK (subject_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT public_form_rate_limits_request_count_check CHECK (request_count >= 0)
);
CREATE INDEX IF NOT EXISTS public_form_rate_limits_updated_at_idx
  ON public.public_form_rate_limits (updated_at ASC);

ALTER TABLE public.public_form_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_form_rate_limits FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_public_form_rate_limit(
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
  v_row public.public_form_rate_limits%ROWTYPE;
  v_retry_after integer;
BEGIN
  IF p_subject_hash IS NULL OR p_subject_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid public-form rate-limit subject';
  END IF;

  CASE p_scope
    WHEN 'newsletter_ip' THEN v_limit := 3; v_window_seconds := 3600;
    WHEN 'newsletter_email' THEN v_limit := 2; v_window_seconds := 86400;
    WHEN 'career_planner_ip' THEN v_limit := 5; v_window_seconds := 3600;
    WHEN 'career_planner_email' THEN v_limit := 3; v_window_seconds := 86400;
    WHEN 'preppl_ip' THEN v_limit := 5; v_window_seconds := 3600;
    WHEN 'preppl_email' THEN v_limit := 3; v_window_seconds := 86400;
    WHEN 'mentorship_ip' THEN v_limit := 5; v_window_seconds := 3600;
    WHEN 'mentorship_email' THEN v_limit := 3; v_window_seconds := 86400;
    WHEN 'school_review_ip' THEN v_limit := 5; v_window_seconds := 3600;
    WHEN 'school_review_identity' THEN v_limit := 5; v_window_seconds := 86400;
    WHEN 'school_review_resend_ip' THEN v_limit := 3; v_window_seconds := 3600;
    WHEN 'school_review_verify_ip' THEN v_limit := 12; v_window_seconds := 600;
    WHEN 'school_review_verify_token' THEN v_limit := 12; v_window_seconds := 600;
    ELSE RAISE EXCEPTION 'Invalid public-form rate-limit scope';
  END CASE;

  LOOP
    SELECT * INTO v_row
    FROM public.public_form_rate_limits
    WHERE scope = p_scope AND subject_hash = p_subject_hash
    FOR UPDATE;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO public.public_form_rate_limits (scope, subject_hash, window_started_at, request_count, updated_at)
        VALUES (p_scope, p_subject_hash, v_now, 1, v_now);
        RETURN QUERY SELECT true, 0;
        RETURN;
      EXCEPTION WHEN unique_violation THEN
        -- A concurrent Vercel invocation inserted the row. Lock it next pass.
      END;
    ELSIF v_row.window_started_at + make_interval(secs => v_window_seconds) <= v_now THEN
      UPDATE public.public_form_rate_limits
      SET window_started_at = v_now, request_count = 1, updated_at = v_now
      WHERE scope = p_scope AND subject_hash = p_subject_hash;
      RETURN QUERY SELECT true, 0;
      RETURN;
    ELSIF v_row.request_count >= v_limit THEN
      v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
        v_row.window_started_at + make_interval(secs => v_window_seconds) - v_now
      )))::integer);
      UPDATE public.public_form_rate_limits SET updated_at = v_now
      WHERE scope = p_scope AND subject_hash = p_subject_hash;
      RETURN QUERY SELECT false, v_retry_after;
      RETURN;
    ELSE
      UPDATE public.public_form_rate_limits
      SET request_count = request_count + 1, updated_at = v_now
      WHERE scope = p_scope AND subject_hash = p_subject_hash;
      RETURN QUERY SELECT true, 0;
      RETURN;
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.email_marketing_confirmation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  list_key text NOT NULL,
  source text NOT NULL,
  consent_text text NOT NULL,
  request_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_marketing_confirmation_tokens_list_key_check CHECK (list_key IN ('home_newsletter', 'career_planner')),
  CONSTRAINT email_marketing_confirmation_tokens_source_check CHECK (source IN ('home_newsletter', 'career_planner')),
  CONSTRAINT email_marketing_confirmation_tokens_consent_text_check CHECK (length(consent_text) BETWEEN 1 AND 2000),
  CONSTRAINT email_marketing_confirmation_tokens_hash_check CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT email_marketing_confirmation_tokens_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT email_marketing_confirmation_tokens_request_unique UNIQUE (lead_id, list_key, request_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS email_marketing_confirmation_tokens_active_unique
  ON public.email_marketing_confirmation_tokens (lead_id, list_key)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS email_marketing_confirmation_tokens_expiry_idx
  ON public.email_marketing_confirmation_tokens (expires_at)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.email_marketing_confirmation_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.email_marketing_confirmation_tokens FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.prepare_email_marketing_confirmation(
  p_lead_id uuid,
  p_list_key text,
  p_source text,
  p_consent_text text,
  p_request_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
RETURNS TABLE (confirmation_token_id uuid, created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing public.email_marketing_confirmation_tokens%ROWTYPE;
  v_id uuid;
BEGIN
  IF p_lead_id IS NULL OR p_request_id IS NULL
    OR p_list_key NOT IN ('home_newsletter', 'career_planner')
    OR p_source NOT IN ('home_newsletter', 'career_planner')
    OR p_token_hash !~ '^[a-f0-9]{64}$'
    OR length(COALESCE(p_consent_text, '')) NOT BETWEEN 1 AND 2000
    OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'Invalid email marketing confirmation request';
  END IF;

  SELECT * INTO v_existing
  FROM public.email_marketing_confirmation_tokens
  WHERE lead_id = p_lead_id AND list_key = p_list_key AND request_id = p_request_id
  FOR UPDATE;
  IF FOUND THEN
    RETURN QUERY SELECT v_existing.id, false;
    RETURN;
  END IF;

  UPDATE public.email_marketing_confirmation_tokens
  SET revoked_at = now()
  WHERE lead_id = p_lead_id AND list_key = p_list_key
    AND consumed_at IS NULL AND revoked_at IS NULL;

  BEGIN
    INSERT INTO public.email_marketing_confirmation_tokens (
      lead_id, list_key, source, consent_text, request_id, token_hash, expires_at
    ) VALUES (
      p_lead_id, p_list_key, p_source, p_consent_text, p_request_id, p_token_hash, p_expires_at
    ) RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    -- A concurrent request has already prepared the only active confirmation.
    SELECT id INTO v_id
    FROM public.email_marketing_confirmation_tokens
    WHERE lead_id = p_lead_id AND list_key = p_list_key
      AND consumed_at IS NULL AND revoked_at IS NULL
    LIMIT 1;
    IF v_id IS NULL THEN RAISE; END IF;
    RETURN QUERY SELECT v_id, false;
    RETURN;
  END;

  RETURN QUERY SELECT v_id, true;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_email_marketing_subscription_by_token_hash(
  p_token_hash text
)
RETURNS TABLE (result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token public.email_marketing_confirmation_tokens%ROWTYPE;
  v_subscription public.email_subscriptions%ROWTYPE;
  v_subscription_id uuid;
  v_event_type text;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN QUERY SELECT 'invalid'::text;
    RETURN;
  END IF;

  SELECT * INTO v_token
  FROM public.email_marketing_confirmation_tokens
  WHERE token_hash = p_token_hash AND revoked_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text;
    RETURN;
  END IF;

  IF v_token.consumed_at IS NOT NULL THEN
    RETURN QUERY SELECT 'already_confirmed'::text;
    RETURN;
  END IF;

  IF v_token.expires_at <= now() THEN
    RETURN QUERY SELECT 'invalid'::text;
    RETURN;
  END IF;

  SELECT * INTO v_subscription
  FROM public.email_subscriptions
  WHERE lead_id = v_token.lead_id AND list_key = v_token.list_key
  FOR UPDATE;

  IF FOUND AND v_subscription.status IN ('bounced', 'complained', 'blocked') THEN
    UPDATE public.email_marketing_confirmation_tokens SET consumed_at = now() WHERE id = v_token.id;
    RETURN QUERY SELECT 'suppressed'::text;
    RETURN;
  END IF;

  IF FOUND THEN
    v_event_type := CASE WHEN v_subscription.status = 'subscribed' THEN NULL ELSE 'resubscribed' END;
    UPDATE public.email_subscriptions SET
      status = 'subscribed', source = v_token.source, consented_at = now(),
      consent_text = v_token.consent_text, unsubscribed_at = NULL,
      bounced_at = NULL, complained_at = NULL, blocked_at = NULL
    WHERE id = v_subscription.id
    RETURNING id INTO v_subscription_id;
  ELSE
    v_event_type := 'subscribed';
    INSERT INTO public.email_subscriptions (lead_id, list_key, status, source, consented_at, consent_text)
    VALUES (v_token.lead_id, v_token.list_key, 'subscribed', v_token.source, now(), v_token.consent_text)
    RETURNING id INTO v_subscription_id;
  END IF;

  UPDATE public.email_marketing_confirmation_tokens SET consumed_at = now() WHERE id = v_token.id;
  UPDATE public.leads SET marketing_consent = true, last_seen_at = now()
  WHERE id = v_token.lead_id;
  IF v_event_type IS NOT NULL THEN
    INSERT INTO public.email_subscription_events (subscription_id, lead_id, list_key, event_type, source, consent_text, occurred_at)
    VALUES (v_subscription_id, v_token.lead_id, v_token.list_key, v_event_type, v_token.source, v_token.consent_text, now());
  END IF;
  RETURN QUERY SELECT 'processed'::text;
END;
$$;

-- The existing transactional mail queue remains the single delivery mechanism.
ALTER TABLE public.email_jobs DROP CONSTRAINT IF EXISTS email_jobs_template_key_check;
ALTER TABLE public.email_jobs ADD CONSTRAINT email_jobs_template_key_check CHECK (
  template_key IS NULL OR template_key IN (
    'career_planner_confirmation', 'preppl_waitlist_confirmation',
    'mentorship_request_confirmation', 'mentorship_internal_alert',
    'school_review_verification', 'marketing_opt_in_confirmation'
  )
);

CREATE OR REPLACE FUNCTION public.purge_public_form_security_data()
RETURNS TABLE (rate_limit_rows_deleted integer, confirmation_token_rows_deleted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rate_count integer;
  v_token_count integer;
BEGIN
  DELETE FROM public.public_form_rate_limits WHERE updated_at < now() - interval '3 days';
  GET DIAGNOSTICS v_rate_count = ROW_COUNT;
  DELETE FROM public.email_marketing_confirmation_tokens
  WHERE expires_at < now() - interval '30 days'
     OR consumed_at < now() - interval '30 days'
     OR revoked_at < now() - interval '30 days';
  GET DIAGNOSTICS v_token_count = ROW_COUNT;
  RETURN QUERY SELECT v_rate_count, v_token_count;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_form_rate_limit(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_email_marketing_confirmation(uuid, text, text, text, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.confirm_email_marketing_subscription_by_token_hash(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_public_form_security_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_form_rate_limit(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepare_email_marketing_confirmation(uuid, text, text, text, uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_email_marketing_subscription_by_token_hash(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_public_form_security_data() TO service_role;

COMMIT;
