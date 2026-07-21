-- =============================================================================
-- FlyPath Phase 10G.4: prepare authenticated AeroComms Pro Checkout.
--
-- This creates only a pending order and Checkout attempt. Stripe's signed
-- subscription events remain the only source allowed to create subscriptions,
-- payments, or entitlement grants in a later block.
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

  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  SELECT ca.id, ca.order_id, ca.user_id, ca.stripe_checkout_session_id, ca.status,
         oi.product_price_id, pp.stripe_price_id
    INTO v_checkout_attempt_id, v_order_id, v_existing_user_id, v_existing_session_id,
         v_existing_status, v_product_price_id, v_stripe_price_id
  FROM public.checkout_attempts AS ca
  JOIN public.order_items AS oi ON oi.order_id = ca.order_id
  JOIN public.product_prices AS pp ON pp.id = oi.product_price_id
  JOIN public.products AS p ON p.id = oi.product_id
  WHERE ca.idempotency_key = p_idempotency_key
    AND p.product_key = 'aerocomms_pro'
    AND pp.price_key = 'aerocomms_pro_monthly_eur'
  ORDER BY oi.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_user_id IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'Checkout intent belongs to another account'
        USING ERRCODE = '23505';
    END IF;

    RETURN QUERY
      SELECT v_checkout_attempt_id, v_order_id, v_product_price_id,
             v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  SELECT p.id, p.name, pp.id, pp.price_key, pp.stripe_price_id
    INTO v_product_id, v_product_name, v_product_price_id, v_price_key, v_stripe_price_id
  FROM public.products AS p
  JOIN public.product_prices AS pp ON pp.product_id = p.id
  WHERE p.product_key = 'aerocomms_pro'
    AND p.status = 'active'
    AND pp.price_key = 'aerocomms_pro_monthly_eur'
    AND pp.is_active
    AND pp.currency = 'EUR'
    AND pp.unit_amount = 737
    AND pp.billing_type = 'recurring'
    AND pp.billing_interval = 'month'
    AND pp.interval_count = 1
    AND pp.stripe_product_id IS NOT NULL
    AND pp.stripe_price_id IS NOT NULL
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'AeroComms Pro catalog is unavailable'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.orders (
    user_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount
  ) VALUES (
    p_user_id, 'pending', 'EUR', 737, 0, 0, 737
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity
  ) VALUES (
    v_order_id, v_product_id, v_product_price_id, v_product_name, v_price_key, 'EUR', 737, 1
  );

  INSERT INTO public.checkout_attempts (
    order_id, user_id, idempotency_key, status
  ) VALUES (
    v_order_id, p_user_id, p_idempotency_key, 'initiated'
  )
  RETURNING id INTO v_checkout_attempt_id;

  RETURN QUERY
    SELECT v_checkout_attempt_id, v_order_id, v_product_price_id,
           v_stripe_price_id, NULL::text, 'initiated'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout(uuid, uuid)
  TO service_role;

COMMIT;
