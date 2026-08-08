-- =============================================================================
-- FlyPath: launch the existing Pre-PPL catalog entry as a protected digital
-- guide. Test and Live provider identifiers stay separate in
-- stripe_catalog_bindings; this migration adds only the verified Live binding.
-- =============================================================================

BEGIN;

UPDATE public.products
SET name = 'Pre-PPL',
    product_type = 'digital_product',
    sales_channel = 'flypath',
    status = 'active',
    description = 'Guía para personas que quieren empezar su formación como piloto.',
    image_url = '/aerocomms/mockups/prepplhome.png'
WHERE product_key = 'preppl_guide';

DO $$
DECLARE
  v_product_id uuid;
  v_price_id uuid;
  v_amount integer;
  v_currency char(3);
  v_billing_type text;
  v_active boolean;
  v_binding_product_id text;
  v_binding_price_id text;
BEGIN
  SELECT id INTO v_product_id FROM public.products WHERE product_key = 'preppl_guide';
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Pre-PPL product is unavailable' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.product_prices (
    product_id, price_key, currency, unit_amount, billing_type, billing_interval, interval_count, tax_behavior, is_active
  ) VALUES (
    v_product_id, 'preppl_guide_eur', 'EUR', 2395, 'one_time', NULL, NULL, 'unspecified', true
  ) ON CONFLICT (price_key) DO NOTHING;

  SELECT id, unit_amount, currency, billing_type, is_active
    INTO v_price_id, v_amount, v_currency, v_billing_type, v_active
  FROM public.product_prices
  WHERE price_key = 'preppl_guide_eur'
    AND product_id = v_product_id;

  IF v_price_id IS NULL OR v_amount <> 2395 OR v_currency <> 'EUR' OR v_billing_type <> 'one_time' OR NOT v_active THEN
    RAISE EXCEPTION 'Pre-PPL price catalog is unavailable' USING ERRCODE = '23000';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.product_prices
    WHERE product_id = v_product_id
      AND is_active
      AND id <> v_price_id
  ) THEN
    RAISE EXCEPTION 'Pre-PPL must have exactly one active price' USING ERRCODE = '23000';
  END IF;

  INSERT INTO public.stripe_catalog_bindings (
    product_price_id, stripe_mode, stripe_product_id, stripe_price_id, is_active
  ) VALUES (
    v_price_id, 'live', 'prod_V2HDiunAEOVO9p', 'price_1U2Cf6KuujVRKb0PVULrzLEY', true
  ) ON CONFLICT (product_price_id, stripe_mode) DO NOTHING;

  SELECT stripe_product_id, stripe_price_id
    INTO v_binding_product_id, v_binding_price_id
  FROM public.stripe_catalog_bindings
  WHERE product_price_id = v_price_id
    AND stripe_mode = 'live'
    AND is_active;

  IF v_binding_product_id IS DISTINCT FROM 'prod_V2HDiunAEOVO9p'
    OR v_binding_price_id IS DISTINCT FROM 'price_1U2Cf6KuujVRKb0PVULrzLEY' THEN
    RAISE EXCEPTION 'Pre-PPL Live Stripe binding conflicts with the catalog' USING ERRCODE = '23000';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_stripe_catalog_checkout(
  p_product_key text,
  p_price_key text,
  p_stripe_mode text,
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
  v_currency char(3);
  v_unit_amount integer;
  v_billing_type text;
  v_stripe_price_id text;
  v_order_id uuid;
  v_attempt_id uuid;
  v_existing_user_id uuid;
  v_existing_session_id text;
  v_existing_status text;
BEGIN
  IF p_stripe_mode NOT IN ('test', 'live')
    OR (p_product_key, p_price_key) NOT IN (
      ('career_planner', 'career_planner_premium_eur'),
      ('como_ser_piloto_guide', 'como_ser_piloto_guide_eur'),
      ('preppl_guide', 'preppl_guide_eur')
    ) THEN
    RAISE EXCEPTION 'Checkout catalog is unavailable' USING ERRCODE = '22023';
  END IF;

  SELECT product.id, product.name, price.id, price.currency, price.unit_amount,
         price.billing_type, binding.stripe_price_id
    INTO v_product_id, v_product_name, v_product_price_id, v_currency,
         v_unit_amount, v_billing_type, v_stripe_price_id
  FROM public.products AS product
  JOIN public.product_prices AS price ON price.product_id = product.id
  JOIN public.stripe_catalog_bindings AS binding
    ON binding.product_price_id = price.id
   AND binding.stripe_mode = p_stripe_mode
   AND binding.is_active
  WHERE product.product_key = p_product_key
    AND product.status = 'active'
    AND price.price_key = p_price_key
    AND price.is_active
    AND (
      (p_product_key = 'career_planner' AND price.currency = 'EUR' AND price.unit_amount = 595 AND price.billing_type = 'one_time')
      OR (p_product_key = 'como_ser_piloto_guide' AND price.currency = 'EUR' AND price.unit_amount = 1495 AND price.billing_type = 'one_time')
      OR (p_product_key = 'preppl_guide' AND price.currency = 'EUR' AND price.unit_amount = 2395 AND price.billing_type = 'one_time')
    )
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Checkout catalog is unavailable' USING ERRCODE = 'P0001';
  END IF;

  SELECT attempt.id, attempt.order_id, attempt.user_id,
         attempt.stripe_checkout_session_id, attempt.status
    INTO v_attempt_id, v_order_id, v_existing_user_id, v_existing_session_id, v_existing_status
  FROM public.checkout_attempts AS attempt
  WHERE attempt.idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_user_id IS DISTINCT FROM p_user_id
      OR EXISTS (
        SELECT 1 FROM public.checkout_attempts AS check_attempt
        WHERE check_attempt.id = v_attempt_id AND check_attempt.stripe_mode IS DISTINCT FROM p_stripe_mode
      ) THEN
      RAISE EXCEPTION 'Checkout intent belongs to another account or Stripe mode' USING ERRCODE = '23505';
    END IF;
    RETURN QUERY SELECT v_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  INSERT INTO public.orders (user_id, stripe_mode, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount)
  VALUES (p_user_id, p_stripe_mode, 'pending', v_currency, v_unit_amount, 0, 0, v_unit_amount)
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity)
  VALUES (v_order_id, v_product_id, v_product_price_id, v_product_name, p_price_key, v_currency, v_unit_amount, 1);

  INSERT INTO public.checkout_attempts (order_id, user_id, stripe_mode, idempotency_key, status)
  VALUES (v_order_id, p_user_id, p_stripe_mode, p_idempotency_key, 'initiated')
  RETURNING id INTO v_attempt_id;

  RETURN QUERY SELECT v_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, NULL::text, 'initiated'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_stripe_catalog_checkout_v2(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_mode text,
  p_product_key text,
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
  v_event_id uuid;
  v_order_amount integer;
  v_order_currency char(3);
  v_price_key text;
  v_payment_id uuid;
BEGIN
  IF p_stripe_mode NOT IN ('test', 'live') OR p_product_key NOT IN ('career_planner', 'como_ser_piloto_guide', 'preppl_guide') THEN
    RAISE EXCEPTION 'Stripe checkout catalog is unavailable' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_stripe_mode || ':' || p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_mode, stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
  VALUES (p_stripe_mode, p_event_id, 'checkout.session.completed', p_stripe_session_id, p_payload_hash, 'processing', p_provider_created_at)
  ON CONFLICT (stripe_mode, stripe_event_id) DO NOTHING RETURNING id INTO v_event_id;
  IF v_event_id IS NULL THEN RETURN 'duplicate'; END IF;

  SELECT order_row.total_amount, order_row.currency, price.price_key
    INTO v_order_amount, v_order_currency, v_price_key
  FROM public.checkout_attempts AS attempt
  JOIN public.orders AS order_row ON order_row.id = attempt.order_id
  JOIN public.order_items AS item ON item.order_id = order_row.id
  JOIN public.product_prices AS price ON price.id = item.product_price_id
  JOIN public.products AS product ON product.id = item.product_id
  JOIN public.stripe_catalog_bindings AS binding
    ON binding.product_price_id = price.id
   AND binding.stripe_mode = p_stripe_mode
   AND binding.is_active
  WHERE attempt.id = p_checkout_attempt_id
    AND attempt.order_id = p_order_id
    AND attempt.stripe_mode = p_stripe_mode
    AND attempt.stripe_checkout_session_id = p_stripe_session_id
    AND item.product_price_id = p_product_price_id
    AND product.product_key = p_product_key
    AND binding.stripe_price_id = p_stripe_price_id
  FOR UPDATE OF attempt, order_row, item;

  IF NOT FOUND OR v_order_amount <> p_amount OR v_order_currency <> upper(p_currency)
    OR (p_product_key = 'career_planner' AND (v_price_key <> 'career_planner_premium_eur' OR p_amount <> 595))
    OR (p_product_key = 'como_ser_piloto_guide' AND (v_price_key <> 'como_ser_piloto_guide_eur' OR p_amount <> 1495))
    OR (p_product_key = 'preppl_guide' AND (v_price_key <> 'preppl_guide_eur' OR p_amount <> 2395))
    OR p_stripe_payment_intent_id IS NULL OR char_length(p_stripe_payment_intent_id) = 0 THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_validation_failed', processed_at = now() WHERE id = v_event_id;
    RETURN 'ignored';
  END IF;

  SELECT id INTO v_payment_id FROM public.payments
  WHERE stripe_mode = p_stripe_mode AND stripe_payment_intent_id = p_stripe_payment_intent_id FOR UPDATE;
  IF v_payment_id IS NULL THEN
    INSERT INTO public.payments (order_id, stripe_mode, provider, stripe_payment_intent_id, status, currency, amount, succeeded_at)
    VALUES (p_order_id, p_stripe_mode, 'stripe', p_stripe_payment_intent_id, 'succeeded', v_order_currency, v_order_amount, now());
  ELSE
    UPDATE public.payments SET status = 'succeeded', succeeded_at = COALESCE(succeeded_at, now()), failed_at = NULL, failure_code = NULL
    WHERE id = v_payment_id AND order_id = p_order_id;
  END IF;
  UPDATE public.orders SET status = 'paid', paid_at = COALESCE(paid_at, now()) WHERE id = p_order_id;
  UPDATE public.checkout_attempts SET status = 'completed', completed_at = COALESCE(completed_at, now()), expires_at = NULL WHERE id = p_checkout_attempt_id;
  UPDATE public.order_items SET fulfillment_status = 'available' WHERE order_id = p_order_id;
  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_id;
  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_preppl_guide_checkout_expired(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_session_id text,
  p_stripe_mode text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_id uuid;
  v_attempt_id uuid;
  v_attempt_status text;
  v_order_id uuid;
  v_order_status text;
BEGIN
  IF p_stripe_mode NOT IN ('test', 'live') THEN RAISE EXCEPTION 'Pre-PPL checkout is unavailable' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_stripe_mode || ':' || p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_mode, stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
  VALUES (p_stripe_mode, p_event_id, 'checkout.session.expired', p_stripe_session_id, p_payload_hash, 'processing', p_provider_created_at)
  ON CONFLICT (stripe_mode, stripe_event_id) DO NOTHING RETURNING id INTO v_event_id;
  IF v_event_id IS NULL THEN RETURN 'duplicate'; END IF;
  SELECT attempt.id, attempt.status, order_row.id, order_row.status
    INTO v_attempt_id, v_attempt_status, v_order_id, v_order_status
  FROM public.checkout_attempts AS attempt
  JOIN public.orders AS order_row ON order_row.id = attempt.order_id
  JOIN public.order_items AS item ON item.order_id = order_row.id
  JOIN public.products AS product ON product.id = item.product_id
  JOIN public.product_prices AS price ON price.id = item.product_price_id
  WHERE attempt.stripe_checkout_session_id = p_stripe_session_id
    AND attempt.stripe_mode = p_stripe_mode
    AND product.product_key = 'preppl_guide'
    AND price.price_key = 'preppl_guide_eur'
  FOR UPDATE OF attempt, order_row, item;
  IF NOT FOUND THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_not_found', processed_at = now() WHERE id = v_event_id;
    RETURN 'ignored';
  END IF;
  IF v_attempt_status = 'completed' OR v_order_status IN ('paid', 'fulfilled') THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_already_completed', processed_at = now() WHERE id = v_event_id;
    RETURN 'ignored';
  END IF;
  UPDATE public.checkout_attempts SET status = 'expired', expires_at = COALESCE(expires_at, now()) WHERE id = v_attempt_id;
  UPDATE public.orders SET status = 'cancelled' WHERE id = v_order_id AND status = 'pending';
  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_id;
  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.process_preppl_guide_payment_failed(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_payment_intent_id text,
  p_checkout_attempt_id uuid,
  p_order_id uuid,
  p_amount integer,
  p_currency text,
  p_stripe_mode text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_id uuid;
  v_order_total integer;
  v_order_currency char(3);
  v_payment_id uuid;
  v_payment_status text;
BEGIN
  IF p_stripe_mode NOT IN ('test', 'live') THEN RAISE EXCEPTION 'Pre-PPL payment is unavailable' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_stripe_mode || ':' || p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_mode, stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
  VALUES (p_stripe_mode, p_event_id, 'payment_intent.payment_failed', p_stripe_payment_intent_id, p_payload_hash, 'processing', p_provider_created_at)
  ON CONFLICT (stripe_mode, stripe_event_id) DO NOTHING RETURNING id INTO v_event_id;
  IF v_event_id IS NULL THEN RETURN 'duplicate'; END IF;
  SELECT order_row.total_amount, order_row.currency
    INTO v_order_total, v_order_currency
  FROM public.checkout_attempts AS attempt
  JOIN public.orders AS order_row ON order_row.id = attempt.order_id
  JOIN public.order_items AS item ON item.order_id = order_row.id
  JOIN public.product_prices AS price ON price.id = item.product_price_id
  JOIN public.products AS product ON product.id = item.product_id
  WHERE attempt.id = p_checkout_attempt_id
    AND attempt.order_id = p_order_id
    AND attempt.stripe_mode = p_stripe_mode
    AND product.product_key = 'preppl_guide'
    AND price.price_key = 'preppl_guide_eur'
  FOR UPDATE OF attempt, order_row, item;
  IF NOT FOUND OR v_order_total <> 2395 OR v_order_currency <> 'EUR' OR p_amount <> 2395 OR lower(p_currency) <> 'eur' THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'payment_validation_failed', processed_at = now() WHERE id = v_event_id;
    RETURN 'ignored';
  END IF;
  SELECT id, status INTO v_payment_id, v_payment_status
  FROM public.payments
  WHERE stripe_mode = p_stripe_mode AND stripe_payment_intent_id = p_stripe_payment_intent_id
  FOR UPDATE;
  IF v_payment_id IS NOT NULL AND v_payment_status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed') THEN
    UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'payment_already_succeeded', processed_at = now() WHERE id = v_event_id;
    RETURN 'ignored';
  ELSIF v_payment_id IS NOT NULL THEN
    UPDATE public.payments SET status = 'failed', currency = 'EUR', amount = 2395, failure_code = 'payment_failed', failed_at = COALESCE(failed_at, now()) WHERE id = v_payment_id;
  ELSE
    INSERT INTO public.payments (order_id, stripe_mode, provider, stripe_payment_intent_id, status, currency, amount, failure_code, failed_at)
    VALUES (p_order_id, p_stripe_mode, 'stripe', p_stripe_payment_intent_id, 'failed', 'EUR', 2395, 'payment_failed', now());
  END IF;
  UPDATE public.checkout_attempts SET status = 'failed' WHERE id = p_checkout_attempt_id AND status IN ('initiated', 'session_created', 'failed');
  UPDATE public.orders SET status = 'payment_failed' WHERE id = p_order_id AND status = 'pending';
  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_id;
  RETURN 'processed';
END;
$$;

CREATE OR REPLACE FUNCTION public.issue_preppl_guide_delivery_access(
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
  v_download_count smallint;
  v_max_downloads smallint;
BEGIN
  SELECT attempt.id INTO v_attempt_id
  FROM public.checkout_attempts AS attempt
  JOIN public.order_items AS item ON item.order_id = attempt.order_id
  JOIN public.products AS product ON product.id = item.product_id
  JOIN public.product_prices AS price ON price.id = item.product_price_id
  WHERE attempt.stripe_checkout_session_id = p_stripe_session_id
    AND attempt.idempotency_key = p_checkout_intent_id
    AND product.product_key = 'preppl_guide'
    AND price.price_key = 'preppl_guide_eur'
  FOR UPDATE OF attempt, item;
  IF v_attempt_id IS NULL THEN RETURN 'invalid'; END IF;
  SELECT download_count, max_downloads INTO v_download_count, v_max_downloads
  FROM public.checkout_delivery_tokens
  WHERE checkout_attempt_id = v_attempt_id
  FOR UPDATE;
  IF FOUND THEN
    IF v_download_count < v_max_downloads THEN
      UPDATE public.checkout_delivery_tokens SET token_hash = p_token_hash, expires_at = p_expires_at WHERE checkout_attempt_id = v_attempt_id;
      RETURN 'issued';
    END IF;
    RETURN 'existing';
  END IF;
  INSERT INTO public.checkout_delivery_tokens (checkout_attempt_id, token_hash, expires_at)
  VALUES (v_attempt_id, p_token_hash, p_expires_at);
  RETURN 'issued';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_preppl_guide_delivery_status(p_token_hash text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN token.id IS NULL OR token.expires_at <= now() THEN 'expired'
    WHEN product.product_key <> 'preppl_guide' OR price.price_key <> 'preppl_guide_eur' THEN 'expired'
    WHEN order_row.status = 'paid' AND attempt.status = 'completed'
      AND EXISTS (SELECT 1 FROM public.payments AS payment WHERE payment.order_id = order_row.id AND payment.status = 'succeeded') THEN 'confirmed'
    WHEN attempt.status = 'expired' THEN 'expired'
    WHEN order_row.status IN ('payment_failed', 'cancelled') THEN 'failed'
    ELSE 'verifying'
  END
  FROM (SELECT 1) AS seed
  LEFT JOIN public.checkout_delivery_tokens AS token ON token.token_hash = p_token_hash
  LEFT JOIN public.checkout_attempts AS attempt ON attempt.id = token.checkout_attempt_id
  LEFT JOIN public.orders AS order_row ON order_row.id = attempt.order_id
  LEFT JOIN public.order_items AS item ON item.order_id = order_row.id
  LEFT JOIN public.products AS product ON product.id = item.product_id
  LEFT JOIN public.product_prices AS price ON price.id = item.product_price_id;
$$;

CREATE OR REPLACE FUNCTION public.consume_preppl_guide_download(p_token_hash text)
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
      WHEN product.product_key <> 'preppl_guide' OR price.price_key <> 'preppl_guide_eur' THEN 'expired'
      WHEN order_row.status = 'paid' AND attempt.status = 'completed'
        AND EXISTS (SELECT 1 FROM public.payments AS payment WHERE payment.order_id = order_row.id AND payment.status = 'succeeded') THEN 'confirmed'
      WHEN attempt.status = 'expired' THEN 'expired'
      WHEN order_row.status IN ('payment_failed', 'cancelled') THEN 'failed'
      ELSE 'verifying'
    END
  INTO v_token_id, v_download_count, v_max_downloads, v_status
  FROM public.checkout_delivery_tokens AS token
  JOIN public.checkout_attempts AS attempt ON attempt.id = token.checkout_attempt_id
  JOIN public.orders AS order_row ON order_row.id = attempt.order_id
  JOIN public.order_items AS item ON item.order_id = order_row.id
  JOIN public.products AS product ON product.id = item.product_id
  JOIN public.product_prices AS price ON price.id = item.product_price_id
  WHERE token.token_hash = p_token_hash
  FOR UPDATE OF token;
  IF v_token_id IS NULL THEN RETURN 'expired'; END IF;
  IF v_status <> 'confirmed' THEN RETURN v_status; END IF;
  IF v_download_count >= v_max_downloads THEN RETURN 'limit_reached'; END IF;
  UPDATE public.checkout_delivery_tokens
  SET download_count = download_count + 1, last_downloaded_at = now()
  WHERE id = v_token_id;
  RETURN 'confirmed';
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_stripe_catalog_checkout(text, text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_stripe_catalog_checkout_v2(text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_preppl_guide_checkout_expired(text, text, timestamptz, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_preppl_guide_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.issue_preppl_guide_delivery_access(text, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_preppl_guide_delivery_status(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_preppl_guide_download(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.prepare_stripe_catalog_checkout(text, text, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_stripe_catalog_checkout_v2(text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_preppl_guide_checkout_expired(text, text, timestamptz, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_preppl_guide_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.issue_preppl_guide_delivery_access(text, uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_preppl_guide_delivery_status(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_preppl_guide_download(text) TO service_role;

COMMIT;
