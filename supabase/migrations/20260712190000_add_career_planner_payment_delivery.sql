-- =============================================================================
-- FlyPath Phase 10D: Stripe test webhook settlement and Career Planner delivery.
--
-- Raw Stripe payloads, report snapshots and PDF bodies are deliberately never
-- persisted. Webhook identity is deduplicated by a SHA-256 payload hash and
-- delivery access is represented only by opaque, hashed, expiring tokens.
-- =============================================================================

BEGIN;

-- 10B predated the Checkout expiration event used by this test-only flow.
-- Replace the closed ledger check rather than widening it to arbitrary events.
ALTER TABLE public.stripe_webhook_events
  DROP CONSTRAINT IF EXISTS stripe_webhook_events_event_type_check;
ALTER TABLE public.stripe_webhook_events
  ADD CONSTRAINT stripe_webhook_events_event_type_check CHECK (event_type IN (
    'checkout.session.completed',
    'checkout.session.expired',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'invoice.paid',
    'invoice.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'charge.refunded',
    'charge.dispute.created',
    'charge.dispute.closed'
  ));

CREATE TABLE IF NOT EXISTS public.checkout_delivery_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_attempt_id uuid NOT NULL UNIQUE
    REFERENCES public.checkout_attempts(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  download_count smallint NOT NULL DEFAULT 0 CHECK (download_count BETWEEN 0 AND 5),
  max_downloads smallint NOT NULL DEFAULT 5 CHECK (max_downloads BETWEEN 1 AND 5),
  last_downloaded_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkout_delivery_tokens_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT checkout_delivery_tokens_usage_check CHECK (download_count <= max_downloads)
);

CREATE INDEX IF NOT EXISTS checkout_delivery_tokens_expiry_idx
  ON public.checkout_delivery_tokens (expires_at ASC);

CREATE TRIGGER checkout_delivery_tokens_set_updated_at
  BEFORE UPDATE ON public.checkout_delivery_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();

ALTER TABLE public.checkout_delivery_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.checkout_delivery_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.checkout_delivery_tokens TO service_role;
REVOKE DELETE ON TABLE public.checkout_delivery_tokens FROM service_role;

CREATE OR REPLACE FUNCTION public.record_career_planner_stripe_webhook_ignored(
  p_event_id text,
  p_event_type text,
  p_object_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_error_code text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_row_id uuid;
BEGIN
  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, payload_hash, status,
    error_code, provider_created_at, processed_at
  ) VALUES (
    p_event_id, p_event_type, p_object_id, p_payload_hash, 'ignored',
    p_error_code, p_provider_created_at, now()
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_row_id;

  RETURN CASE WHEN v_event_row_id IS NULL THEN 'duplicate' ELSE 'ignored' END;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_career_planner_checkout_completed(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_checkout_attempt_id uuid,
  p_order_id uuid,
  p_product_price_id uuid,
  p_stripe_price_id text,
  p_amount integer,
  p_currency text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_row_id uuid;
  v_attempt_status text;
  v_order_status text;
  v_order_total integer;
  v_order_currency char(3);
  v_price_key text;
  v_catalog_stripe_price_id text;
  v_product_key text;
  v_existing_payment_id uuid;
  v_existing_payment_order_id uuid;
  v_existing_payment_status text;
  v_existing_success_intent_id text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));

  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at
  ) VALUES (
    p_event_id, 'checkout.session.completed', p_stripe_session_id, p_payload_hash, 'processing', p_provider_created_at
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_row_id;

  IF v_event_row_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  SELECT ca.status, o.status, o.total_amount, o.currency, pp.price_key,
         pp.stripe_price_id, p.product_key
    INTO v_attempt_status, v_order_status, v_order_total, v_order_currency,
         v_price_key, v_catalog_stripe_price_id, v_product_key
  FROM public.checkout_attempts ca
  JOIN public.orders o ON o.id = ca.order_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.product_prices pp ON pp.id = oi.product_price_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE ca.id = p_checkout_attempt_id
    AND ca.order_id = p_order_id
    AND ca.stripe_checkout_session_id = p_stripe_session_id
    AND oi.product_price_id = p_product_price_id
  FOR UPDATE OF ca, o, oi;

  IF NOT FOUND
    OR v_product_key <> 'career_planner'
    OR v_price_key <> 'career_planner_premium_eur'
    OR v_catalog_stripe_price_id IS DISTINCT FROM p_stripe_price_id
    OR v_order_total <> 595
    OR v_order_currency <> 'EUR'
    OR p_amount <> 595
    OR lower(p_currency) <> 'eur'
    OR p_stripe_payment_intent_id IS NULL
    OR char_length(p_stripe_payment_intent_id) = 0 THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'checkout_validation_failed', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  SELECT id, order_id, status
    INTO v_existing_payment_id, v_existing_payment_order_id, v_existing_payment_status
  FROM public.payments
  WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
  FOR UPDATE;

  SELECT stripe_payment_intent_id
    INTO v_existing_success_intent_id
  FROM public.payments
  WHERE order_id = p_order_id
    AND status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed')
  FOR UPDATE;

  IF v_existing_success_intent_id IS NOT NULL
    AND v_existing_success_intent_id IS DISTINCT FROM p_stripe_payment_intent_id THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'order_already_paid', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  IF v_existing_payment_id IS NOT NULL AND v_existing_payment_order_id IS DISTINCT FROM p_order_id THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'payment_reference_conflict', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  ELSIF v_existing_payment_id IS NOT NULL THEN
    UPDATE public.payments
      SET status = 'succeeded', currency = 'EUR', amount = 595, amount_refunded = 0,
          failure_code = NULL, succeeded_at = COALESCE(succeeded_at, now()), failed_at = NULL
      WHERE id = v_existing_payment_id;
  ELSE
    INSERT INTO public.payments (
      order_id, provider, stripe_payment_intent_id, status, currency, amount, succeeded_at
    ) VALUES (
      p_order_id, 'stripe', p_stripe_payment_intent_id, 'succeeded', 'EUR', 595, now()
    );
  END IF;

  UPDATE public.orders
    SET status = 'paid', paid_at = COALESCE(paid_at, now())
    WHERE id = p_order_id;

  UPDATE public.checkout_attempts
    SET status = 'completed', completed_at = COALESCE(completed_at, now()), expires_at = NULL
    WHERE id = p_checkout_attempt_id;

  UPDATE public.order_items
    SET fulfillment_status = 'available'
    WHERE order_id = p_order_id;

  UPDATE public.stripe_webhook_events
    SET status = 'processed', error_code = NULL, processed_at = now()
    WHERE id = v_event_row_id;

  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_career_planner_checkout_expired(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_session_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_row_id uuid;
  v_attempt_id uuid;
  v_attempt_status text;
  v_order_id uuid;
  v_order_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));

  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at
  ) VALUES (
    p_event_id, 'checkout.session.expired', p_stripe_session_id, p_payload_hash, 'processing', p_provider_created_at
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_row_id;

  IF v_event_row_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  SELECT ca.id, ca.status, o.id, o.status
    INTO v_attempt_id, v_attempt_status, v_order_id, v_order_status
  FROM public.checkout_attempts ca
  JOIN public.orders o ON o.id = ca.order_id
  WHERE ca.stripe_checkout_session_id = p_stripe_session_id
  FOR UPDATE OF ca, o;

  IF NOT FOUND THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'checkout_not_found', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  IF v_attempt_status = 'completed' OR v_order_status IN ('paid', 'fulfilled') THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'checkout_already_completed', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  UPDATE public.checkout_attempts
    SET status = 'expired', expires_at = COALESCE(expires_at, now())
    WHERE id = v_attempt_id;

  UPDATE public.orders
    SET status = 'cancelled'
    WHERE id = v_order_id AND status = 'pending';

  UPDATE public.stripe_webhook_events
    SET status = 'processed', error_code = NULL, processed_at = now()
    WHERE id = v_event_row_id;

  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_career_planner_payment_failed(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_payment_intent_id text,
  p_checkout_attempt_id uuid,
  p_order_id uuid,
  p_amount integer,
  p_currency text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_row_id uuid;
  v_order_total integer;
  v_order_currency char(3);
  v_payment_id uuid;
  v_payment_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));

  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at
  ) VALUES (
    p_event_id, 'payment_intent.payment_failed', p_stripe_payment_intent_id, p_payload_hash, 'processing', p_provider_created_at
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_row_id;

  IF v_event_row_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  SELECT o.total_amount, o.currency
    INTO v_order_total, v_order_currency
  FROM public.checkout_attempts ca
  JOIN public.orders o ON o.id = ca.order_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.product_prices pp ON pp.id = oi.product_price_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE ca.id = p_checkout_attempt_id
    AND ca.order_id = p_order_id
    AND p.product_key = 'career_planner'
    AND pp.price_key = 'career_planner_premium_eur'
  FOR UPDATE OF ca, o, oi;

  IF NOT FOUND
    OR v_order_total <> 595
    OR v_order_currency <> 'EUR'
    OR p_amount <> 595
    OR lower(p_currency) <> 'eur' THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'payment_validation_failed', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  SELECT id, status INTO v_payment_id, v_payment_status
  FROM public.payments
  WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
  FOR UPDATE;

  IF v_payment_id IS NOT NULL AND v_payment_status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed') THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'payment_already_succeeded', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  ELSIF v_payment_id IS NOT NULL THEN
    UPDATE public.payments
      SET status = 'failed', currency = 'EUR', amount = 595,
          failure_code = 'payment_failed', failed_at = COALESCE(failed_at, now())
      WHERE id = v_payment_id;
  ELSE
    INSERT INTO public.payments (
      order_id, provider, stripe_payment_intent_id, status, currency, amount, failure_code, failed_at
    ) VALUES (
      p_order_id, 'stripe', p_stripe_payment_intent_id, 'failed', 'EUR', 595, 'payment_failed', now()
    );
  END IF;

  UPDATE public.stripe_webhook_events
    SET status = 'processed', error_code = NULL, processed_at = now()
    WHERE id = v_event_row_id;

  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_career_planner_delivery_access(
  p_stripe_session_id text,
  p_checkout_intent_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempt_id uuid;
  v_existing_expires_at timestamptz;
  v_existing_download_count smallint;
  v_existing_max_downloads smallint;
BEGIN
  SELECT id INTO v_attempt_id
  FROM public.checkout_attempts
  WHERE stripe_checkout_session_id = p_stripe_session_id
    AND idempotency_key = p_checkout_intent_id
  FOR UPDATE;

  IF v_attempt_id IS NULL THEN
    RETURN 'invalid';
  END IF;

  SELECT expires_at, download_count, max_downloads
    INTO v_existing_expires_at, v_existing_download_count, v_existing_max_downloads
  FROM public.checkout_delivery_tokens
  WHERE checkout_attempt_id = v_attempt_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_download_count < v_existing_max_downloads THEN
      UPDATE public.checkout_delivery_tokens
        SET token_hash = p_token_hash, expires_at = p_expires_at
        WHERE checkout_attempt_id = v_attempt_id;
      RETURN 'issued';
    END IF;
    RETURN 'existing';
  END IF;

  INSERT INTO public.checkout_delivery_tokens (checkout_attempt_id, token_hash, expires_at)
    VALUES (v_attempt_id, p_token_hash, p_expires_at);
  RETURN 'issued';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_career_planner_delivery_status(p_token_hash text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN token.id IS NULL OR token.expires_at <= now() THEN 'expired'
    WHEN o.status = 'paid' AND ca.status = 'completed'
      AND EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.order_id = o.id AND p.status = 'succeeded'
      ) THEN 'confirmed'
    WHEN ca.status = 'expired' THEN 'expired'
    WHEN o.status IN ('payment_failed', 'cancelled') THEN 'failed'
    ELSE 'verifying'
  END
  FROM (SELECT 1) AS seed
  LEFT JOIN public.checkout_delivery_tokens token ON token.token_hash = p_token_hash
  LEFT JOIN public.checkout_attempts ca ON ca.id = token.checkout_attempt_id
  LEFT JOIN public.orders o ON o.id = ca.order_id;
$$;

CREATE OR REPLACE FUNCTION public.consume_career_planner_report_download(p_token_hash text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
  v_token_id uuid;
  v_download_count smallint;
  v_max_downloads smallint;
BEGIN
  SELECT token.id, token.download_count, token.max_downloads,
         CASE
           WHEN token.expires_at <= now() THEN 'expired'
           WHEN o.status = 'paid' AND ca.status = 'completed'
             AND EXISTS (
               SELECT 1 FROM public.payments p
               WHERE p.order_id = o.id AND p.status = 'succeeded'
             ) THEN 'confirmed'
           WHEN ca.status = 'expired' THEN 'expired'
           WHEN o.status IN ('payment_failed', 'cancelled') THEN 'failed'
           ELSE 'verifying'
         END
    INTO v_token_id, v_download_count, v_max_downloads, v_status
  FROM public.checkout_delivery_tokens token
  JOIN public.checkout_attempts ca ON ca.id = token.checkout_attempt_id
  JOIN public.orders o ON o.id = ca.order_id
  WHERE token.token_hash = p_token_hash
  FOR UPDATE OF token;

  IF v_token_id IS NULL THEN
    RETURN 'expired';
  END IF;
  IF v_status <> 'confirmed' THEN
    RETURN v_status;
  END IF;
  IF v_download_count >= v_max_downloads THEN
    RETURN 'limit_reached';
  END IF;

  UPDATE public.checkout_delivery_tokens
    SET download_count = download_count + 1, last_downloaded_at = now()
    WHERE id = v_token_id;
  RETURN 'confirmed';
END;
$$;

REVOKE ALL ON FUNCTION public.record_career_planner_stripe_webhook_ignored(text, text, text, text, timestamptz, text),
  public.process_career_planner_checkout_completed(text, text, timestamptz, text, text, uuid, uuid, uuid, text, integer, text),
  public.process_career_planner_checkout_expired(text, text, timestamptz, text),
  public.process_career_planner_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text),
  public.issue_career_planner_delivery_access(text, uuid, text, timestamptz),
  public.get_career_planner_delivery_status(text),
  public.consume_career_planner_report_download(text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_career_planner_stripe_webhook_ignored(text, text, text, text, timestamptz, text),
  public.process_career_planner_checkout_completed(text, text, timestamptz, text, text, uuid, uuid, uuid, text, integer, text),
  public.process_career_planner_checkout_expired(text, text, timestamptz, text),
  public.process_career_planner_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text),
  public.issue_career_planner_delivery_access(text, uuid, text, timestamptz),
  public.get_career_planner_delivery_status(text),
  public.consume_career_planner_report_download(text)
  TO service_role;

COMMENT ON TABLE public.checkout_delivery_tokens IS
  'Hashed, expiring and limited-use access tokens for a purchased Career Planner PDF. No report content is stored.';

COMMIT;
