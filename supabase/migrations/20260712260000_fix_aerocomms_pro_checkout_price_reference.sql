-- =============================================================================
-- FlyPath Phase 10G: fix an ambiguous PL/pgSQL output-column reference in the
-- AeroComms Pro subscription Checkout preparation RPC.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.prepare_aerocomms_pro_subscription_checkout(
  p_idempotency_key uuid,
  p_user_id uuid
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
  v_price_key text;
  v_stripe_price_id text;
  v_order_id uuid;
  v_checkout_attempt_id uuid;
  v_existing_user_id uuid;
  v_existing_session_id text;
  v_existing_status text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'AeroComms Pro Checkout requires an authenticated account'
      USING ERRCODE = '28000';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('aerocomms_pro:' || p_user_id::text, 0));

  SELECT product.id, product.name, price.id, price.price_key, price.stripe_price_id
    INTO v_product_id, v_product_name, v_product_price_id, v_price_key, v_stripe_price_id
  FROM public.products AS product
  JOIN public.product_prices AS price ON price.product_id = product.id
  WHERE product.product_key = 'aerocomms_pro'
    AND product.status = 'active'
    AND price.price_key = 'aerocomms_pro_monthly_eur'
    AND price.is_active
    AND price.currency = 'EUR'
    AND price.unit_amount = 737
    AND price.billing_type = 'recurring'
    AND price.billing_interval = 'month'
    AND price.interval_count = 1
    AND price.stripe_product_id IS NOT NULL
    AND price.stripe_price_id IS NOT NULL
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'AeroComms Pro catalog is unavailable'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT attempt.id, attempt.order_id, attempt.user_id,
         attempt.stripe_checkout_session_id, attempt.status
    INTO v_checkout_attempt_id, v_order_id, v_existing_user_id,
         v_existing_session_id, v_existing_status
  FROM public.checkout_attempts AS attempt
  JOIN public.order_items AS item ON item.order_id = attempt.order_id
  WHERE attempt.idempotency_key = p_idempotency_key
    AND item.product_price_id = v_product_price_id
  ORDER BY item.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_user_id IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Checkout intent belongs to another account'
        USING ERRCODE = '23505';
    END IF;

    RETURN QUERY SELECT v_checkout_attempt_id, v_order_id, v_product_price_id,
                        v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions AS subscription
    WHERE subscription.user_id = p_user_id
      AND subscription.product_price_id = v_product_price_id
      AND subscription.status IN (
        'incomplete', 'trialing', 'active', 'past_due', 'canceling', 'unpaid', 'paused'
      )
  ) THEN
    RAISE EXCEPTION 'AeroComms Pro already has an open subscription'
      USING ERRCODE = '23505';
  END IF;

  SELECT attempt.id, attempt.order_id, attempt.user_id,
         attempt.stripe_checkout_session_id, attempt.status
    INTO v_checkout_attempt_id, v_order_id, v_existing_user_id,
         v_existing_session_id, v_existing_status
  FROM public.checkout_attempts AS attempt
  JOIN public.order_items AS item ON item.order_id = attempt.order_id
  WHERE attempt.user_id = p_user_id
    AND item.product_price_id = v_product_price_id
    AND attempt.status IN ('initiated', 'session_created')
  ORDER BY attempt.created_at DESC
  LIMIT 1
  FOR UPDATE OF attempt;

  IF FOUND THEN
    RETURN QUERY SELECT v_checkout_attempt_id, v_order_id, v_product_price_id,
                        v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  INSERT INTO public.orders (
    user_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount
  ) VALUES (
    p_user_id, 'pending', 'EUR', 737, 0, 0, 737
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity
  ) VALUES (
    v_order_id, v_product_id, v_product_price_id, v_product_name, v_price_key, 'EUR', 737, 1
  );

  INSERT INTO public.checkout_attempts (order_id, user_id, idempotency_key, status)
  VALUES (v_order_id, p_user_id, p_idempotency_key, 'initiated')
  RETURNING id INTO v_checkout_attempt_id;

  RETURN QUERY SELECT v_checkout_attempt_id, v_order_id, v_product_price_id,
                      v_stripe_price_id, NULL::text, 'initiated'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout(uuid, uuid)
  TO service_role;

COMMIT;
