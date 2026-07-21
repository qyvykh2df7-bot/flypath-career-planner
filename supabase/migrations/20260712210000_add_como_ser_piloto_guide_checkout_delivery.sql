-- FlyPath Phase 10: sandbox Checkout and isolated delivery for the existing
-- digital guide product. No entitlement is created by this flow.
BEGIN;

CREATE OR REPLACE FUNCTION public.prepare_como_ser_piloto_guide_checkout(
  p_idempotency_key uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  checkout_attempt_id uuid,
  order_id uuid,
  product_price_id uuid,
  stripe_price_id text,
  stripe_checkout_session_id text,
  checkout_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_product_id uuid;
  v_product_name text;
  v_product_price_id uuid;
  v_stripe_price_id text;
  v_order_id uuid;
  v_checkout_attempt_id uuid;
  v_existing_product_key text;
  v_existing_price_key text;
  v_existing_session_id text;
  v_existing_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  SELECT p.product_key, oi.price_key, ca.id, ca.order_id, ca.stripe_checkout_session_id, ca.status, oi.product_price_id, pp.stripe_price_id
    INTO v_existing_product_key, v_existing_price_key, v_checkout_attempt_id, v_order_id, v_existing_session_id, v_existing_status, v_product_price_id, v_stripe_price_id
  FROM public.checkout_attempts ca
  JOIN public.order_items oi ON oi.order_id = ca.order_id
  JOIN public.products p ON p.id = oi.product_id
  JOIN public.product_prices pp ON pp.id = oi.product_price_id
  WHERE ca.idempotency_key = p_idempotency_key
  ORDER BY oi.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_product_key <> 'como_ser_piloto_guide' OR v_existing_price_key <> 'como_ser_piloto_guide_eur' THEN
      RAISE EXCEPTION 'Checkout intent belongs to another product' USING ERRCODE = '23505';
    END IF;
    RETURN QUERY SELECT v_checkout_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  SELECT p.id, p.name, pp.id, pp.stripe_price_id
    INTO v_product_id, v_product_name, v_product_price_id, v_stripe_price_id
  FROM public.products p
  JOIN public.product_prices pp ON pp.product_id = p.id
  WHERE p.product_key = 'como_ser_piloto_guide'
    AND p.status = 'active'
    AND pp.price_key = 'como_ser_piloto_guide_eur'
    AND pp.is_active
    AND pp.currency = 'EUR'
    AND pp.unit_amount = 1495
    AND pp.billing_type = 'one_time'
    AND pp.billing_interval IS NULL
    AND pp.interval_count IS NULL
    AND pp.stripe_product_id IS NOT NULL
    AND pp.stripe_price_id IS NOT NULL
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Guide catalog is unavailable' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.orders (user_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount)
    VALUES (p_user_id, 'pending', 'EUR', 1495, 0, 0, 1495)
    RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity)
    VALUES (v_order_id, v_product_id, v_product_price_id, v_product_name, 'como_ser_piloto_guide_eur', 'EUR', 1495, 1);

  INSERT INTO public.checkout_attempts (order_id, user_id, idempotency_key, status)
    VALUES (v_order_id, p_user_id, p_idempotency_key, 'initiated')
    RETURNING id INTO v_checkout_attempt_id;

  RETURN QUERY SELECT v_checkout_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, NULL::text, 'initiated'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_como_ser_piloto_guide_checkout_completed(
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
  v_catalog_stripe_price_id text;
  v_order_total integer;
  v_order_currency char(3);
  v_product_key text;
  v_price_key text;
  v_existing_payment_id uuid;
  v_existing_payment_order_id uuid;
  v_existing_success_intent_id text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
    VALUES (p_event_id, 'checkout.session.completed', p_stripe_session_id, p_payload_hash, 'processing', p_provider_created_at)
    ON CONFLICT (stripe_event_id) DO NOTHING
    RETURNING id INTO v_event_row_id;
  IF v_event_row_id IS NULL THEN RETURN 'duplicate'; END IF;

  SELECT pp.stripe_price_id, o.total_amount, o.currency, p.product_key, pp.price_key
    INTO v_catalog_stripe_price_id, v_order_total, v_order_currency, v_product_key, v_price_key
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

  IF NOT FOUND OR v_product_key <> 'como_ser_piloto_guide' OR v_price_key <> 'como_ser_piloto_guide_eur'
    OR v_catalog_stripe_price_id IS DISTINCT FROM p_stripe_price_id OR v_order_total <> 1495 OR v_order_currency <> 'EUR'
    OR p_amount <> 1495 OR lower(p_currency) <> 'eur' OR p_stripe_payment_intent_id IS NULL OR char_length(p_stripe_payment_intent_id) = 0 THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_validation_failed', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  SELECT id, order_id INTO v_existing_payment_id, v_existing_payment_order_id FROM public.payments
    WHERE stripe_payment_intent_id = p_stripe_payment_intent_id FOR UPDATE;
  SELECT stripe_payment_intent_id INTO v_existing_success_intent_id FROM public.payments
    WHERE order_id = p_order_id AND status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed') FOR UPDATE;
  IF v_existing_success_intent_id IS NOT NULL AND v_existing_success_intent_id IS DISTINCT FROM p_stripe_payment_intent_id THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'order_already_paid', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  ELSIF v_existing_payment_id IS NOT NULL AND v_existing_payment_order_id IS DISTINCT FROM p_order_id THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'payment_reference_conflict', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  ELSIF v_existing_payment_id IS NOT NULL THEN
    UPDATE public.payments SET status = 'succeeded', currency = 'EUR', amount = 1495, amount_refunded = 0, failure_code = NULL, succeeded_at = COALESCE(succeeded_at, now()), failed_at = NULL WHERE id = v_existing_payment_id;
  ELSE
    INSERT INTO public.payments (order_id, provider, stripe_payment_intent_id, status, currency, amount, succeeded_at)
      VALUES (p_order_id, 'stripe', p_stripe_payment_intent_id, 'succeeded', 'EUR', 1495, now());
  END IF;

  UPDATE public.orders SET status = 'paid', paid_at = COALESCE(paid_at, now()) WHERE id = p_order_id;
  UPDATE public.checkout_attempts SET status = 'completed', completed_at = COALESCE(completed_at, now()), expires_at = NULL WHERE id = p_checkout_attempt_id;
  UPDATE public.order_items SET fulfillment_status = 'available' WHERE order_id = p_order_id;
  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_row_id;
  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_como_ser_piloto_guide_checkout_expired(
  p_event_id text, p_payload_hash text, p_provider_created_at timestamptz, p_stripe_session_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_event_row_id uuid; v_attempt_id uuid; v_attempt_status text; v_order_id uuid; v_order_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
    VALUES (p_event_id, 'checkout.session.expired', p_stripe_session_id, p_payload_hash, 'processing', p_provider_created_at)
    ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id INTO v_event_row_id;
  IF v_event_row_id IS NULL THEN RETURN 'duplicate'; END IF;
  SELECT ca.id, ca.status, o.id, o.status INTO v_attempt_id, v_attempt_status, v_order_id, v_order_status
  FROM public.checkout_attempts ca JOIN public.orders o ON o.id = ca.order_id JOIN public.order_items oi ON oi.order_id = o.id JOIN public.products p ON p.id = oi.product_id
  WHERE ca.stripe_checkout_session_id = p_stripe_session_id AND p.product_key = 'como_ser_piloto_guide' FOR UPDATE OF ca, o, oi;
  IF NOT FOUND THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_not_found', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;
  IF v_attempt_status = 'completed' OR v_order_status IN ('paid', 'fulfilled') THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_already_completed', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;
  UPDATE public.checkout_attempts SET status = 'expired', expires_at = COALESCE(expires_at, now()) WHERE id = v_attempt_id;
  UPDATE public.orders SET status = 'cancelled' WHERE id = v_order_id AND status = 'pending';
  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_row_id;
  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_como_ser_piloto_guide_payment_failed(
  p_event_id text, p_payload_hash text, p_provider_created_at timestamptz, p_stripe_payment_intent_id text,
  p_checkout_attempt_id uuid, p_order_id uuid, p_amount integer, p_currency text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_event_row_id uuid; v_order_total integer; v_order_currency char(3); v_payment_id uuid; v_payment_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
    VALUES (p_event_id, 'payment_intent.payment_failed', p_stripe_payment_intent_id, p_payload_hash, 'processing', p_provider_created_at)
    ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id INTO v_event_row_id;
  IF v_event_row_id IS NULL THEN RETURN 'duplicate'; END IF;
  SELECT o.total_amount, o.currency INTO v_order_total, v_order_currency
  FROM public.checkout_attempts ca JOIN public.orders o ON o.id = ca.order_id JOIN public.order_items oi ON oi.order_id = o.id JOIN public.product_prices pp ON pp.id = oi.product_price_id JOIN public.products p ON p.id = oi.product_id
  WHERE ca.id = p_checkout_attempt_id AND ca.order_id = p_order_id AND p.product_key = 'como_ser_piloto_guide' AND pp.price_key = 'como_ser_piloto_guide_eur' FOR UPDATE OF ca, o, oi;
  IF NOT FOUND OR v_order_total <> 1495 OR v_order_currency <> 'EUR' OR p_amount <> 1495 OR lower(p_currency) <> 'eur' THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'payment_validation_failed', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;
  SELECT id, status INTO v_payment_id, v_payment_status FROM public.payments WHERE stripe_payment_intent_id = p_stripe_payment_intent_id FOR UPDATE;
  IF v_payment_id IS NOT NULL AND v_payment_status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed') THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'payment_already_succeeded', processed_at = now() WHERE id = v_event_row_id;
    RETURN 'ignored';
  ELSIF v_payment_id IS NOT NULL THEN
    UPDATE public.payments SET status = 'failed', currency = 'EUR', amount = 1495, failure_code = 'payment_failed', failed_at = COALESCE(failed_at, now()) WHERE id = v_payment_id;
  ELSE
    INSERT INTO public.payments (order_id, provider, stripe_payment_intent_id, status, currency, amount, failure_code, failed_at)
      VALUES (p_order_id, 'stripe', p_stripe_payment_intent_id, 'failed', 'EUR', 1495, 'payment_failed', now());
  END IF;
  UPDATE public.checkout_attempts SET status = 'failed' WHERE id = p_checkout_attempt_id AND status IN ('initiated', 'session_created', 'failed');
  UPDATE public.orders SET status = 'payment_failed' WHERE id = p_order_id AND status = 'pending';
  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_row_id;
  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_como_ser_piloto_guide_delivery_access(
  p_stripe_session_id text, p_checkout_intent_id uuid, p_token_hash text, p_expires_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_attempt_id uuid; v_download_count smallint; v_max_downloads smallint;
BEGIN
  SELECT ca.id INTO v_attempt_id
  FROM public.checkout_attempts ca JOIN public.order_items oi ON oi.order_id = ca.order_id JOIN public.products p ON p.id = oi.product_id JOIN public.product_prices pp ON pp.id = oi.product_price_id
  WHERE ca.stripe_checkout_session_id = p_stripe_session_id AND ca.idempotency_key = p_checkout_intent_id
    AND p.product_key = 'como_ser_piloto_guide' AND pp.price_key = 'como_ser_piloto_guide_eur'
  FOR UPDATE OF ca, oi;
  IF v_attempt_id IS NULL THEN RETURN 'invalid'; END IF;
  SELECT download_count, max_downloads INTO v_download_count, v_max_downloads FROM public.checkout_delivery_tokens WHERE checkout_attempt_id = v_attempt_id FOR UPDATE;
  IF FOUND THEN
    IF v_download_count < v_max_downloads THEN
      UPDATE public.checkout_delivery_tokens SET token_hash = p_token_hash, expires_at = p_expires_at WHERE checkout_attempt_id = v_attempt_id;
      RETURN 'issued';
    END IF;
    RETURN 'existing';
  END IF;
  INSERT INTO public.checkout_delivery_tokens (checkout_attempt_id, token_hash, expires_at) VALUES (v_attempt_id, p_token_hash, p_expires_at);
  RETURN 'issued';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_como_ser_piloto_guide_delivery_status(p_token_hash text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN token.id IS NULL OR token.expires_at <= now() THEN 'expired'
    WHEN p.product_key <> 'como_ser_piloto_guide' OR pp.price_key <> 'como_ser_piloto_guide_eur' THEN 'expired'
    WHEN o.status = 'paid' AND ca.status = 'completed' AND EXISTS (SELECT 1 FROM public.payments payment WHERE payment.order_id = o.id AND payment.status = 'succeeded') THEN 'confirmed'
    WHEN ca.status = 'expired' THEN 'expired'
    WHEN o.status IN ('payment_failed', 'cancelled') THEN 'failed'
    ELSE 'verifying'
  END
  FROM (SELECT 1) seed
  LEFT JOIN public.checkout_delivery_tokens token ON token.token_hash = p_token_hash
  LEFT JOIN public.checkout_attempts ca ON ca.id = token.checkout_attempt_id
  LEFT JOIN public.orders o ON o.id = ca.order_id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.products p ON p.id = oi.product_id
  LEFT JOIN public.product_prices pp ON pp.id = oi.product_price_id;
$$;

CREATE OR REPLACE FUNCTION public.consume_como_ser_piloto_guide_download(p_token_hash text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_status text; v_token_id uuid; v_download_count smallint; v_max_downloads smallint;
BEGIN
  SELECT token.id, token.download_count, token.max_downloads,
    CASE
      WHEN token.expires_at <= now() THEN 'expired'
      WHEN p.product_key <> 'como_ser_piloto_guide' OR pp.price_key <> 'como_ser_piloto_guide_eur' THEN 'expired'
      WHEN o.status = 'paid' AND ca.status = 'completed' AND EXISTS (SELECT 1 FROM public.payments payment WHERE payment.order_id = o.id AND payment.status = 'succeeded') THEN 'confirmed'
      WHEN ca.status = 'expired' THEN 'expired'
      WHEN o.status IN ('payment_failed', 'cancelled') THEN 'failed'
      ELSE 'verifying'
    END
  INTO v_token_id, v_download_count, v_max_downloads, v_status
  FROM public.checkout_delivery_tokens token JOIN public.checkout_attempts ca ON ca.id = token.checkout_attempt_id
  JOIN public.orders o ON o.id = ca.order_id JOIN public.order_items oi ON oi.order_id = o.id JOIN public.products p ON p.id = oi.product_id JOIN public.product_prices pp ON pp.id = oi.product_price_id
  WHERE token.token_hash = p_token_hash FOR UPDATE OF token;
  IF v_token_id IS NULL THEN RETURN 'expired'; END IF;
  IF v_status <> 'confirmed' THEN RETURN v_status; END IF;
  IF v_download_count >= v_max_downloads THEN RETURN 'limit_reached'; END IF;
  UPDATE public.checkout_delivery_tokens SET download_count = download_count + 1, last_downloaded_at = now() WHERE id = v_token_id;
  RETURN 'confirmed';
END;
$$;

REVOKE ALL ON FUNCTION
  public.prepare_como_ser_piloto_guide_checkout(uuid, uuid),
  public.process_como_ser_piloto_guide_checkout_completed(text, text, timestamptz, text, text, uuid, uuid, uuid, text, integer, text),
  public.process_como_ser_piloto_guide_checkout_expired(text, text, timestamptz, text),
  public.process_como_ser_piloto_guide_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text),
  public.issue_como_ser_piloto_guide_delivery_access(text, uuid, text, timestamptz),
  public.get_como_ser_piloto_guide_delivery_status(text),
  public.consume_como_ser_piloto_guide_download(text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.prepare_como_ser_piloto_guide_checkout(uuid, uuid),
  public.process_como_ser_piloto_guide_checkout_completed(text, text, timestamptz, text, text, uuid, uuid, uuid, text, integer, text),
  public.process_como_ser_piloto_guide_checkout_expired(text, text, timestamptz, text),
  public.process_como_ser_piloto_guide_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text),
  public.issue_como_ser_piloto_guide_delivery_access(text, uuid, text, timestamptz),
  public.get_como_ser_piloto_guide_delivery_status(text),
  public.consume_como_ser_piloto_guide_download(text)
  TO service_role;

COMMENT ON TABLE public.checkout_delivery_tokens IS
  'Hashed, expiring and limited-use access tokens for isolated purchased digital deliveries. No delivery content is stored.';

COMMIT;
