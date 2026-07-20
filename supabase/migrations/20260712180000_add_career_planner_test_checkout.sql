-- =============================================================================
-- FlyPath Phase 10C: Career Planner Premium test Checkout preparation.
--
-- This migration does not create a Stripe Checkout Session, payment, grant, or
-- entitlement. It records the Stripe catalog linkage and atomically prepares a
-- pending order/checkout attempt for server-only code.
-- =============================================================================

BEGIN;

ALTER TABLE public.product_prices
  ADD COLUMN IF NOT EXISTS stripe_product_id text NULL;

ALTER TABLE public.product_prices
  DROP CONSTRAINT IF EXISTS product_prices_stripe_reference_pair_check;

ALTER TABLE public.product_prices
  ADD CONSTRAINT product_prices_stripe_reference_pair_check CHECK (
    (stripe_product_id IS NULL AND stripe_price_id IS NULL)
    OR
    (stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS product_prices_stripe_product_id_idx
  ON public.product_prices (stripe_product_id)
  WHERE stripe_product_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_product_price_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.price_key IS DISTINCT FROM OLD.price_key
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.unit_amount IS DISTINCT FROM OLD.unit_amount
    OR NEW.billing_type IS DISTINCT FROM OLD.billing_type
    OR NEW.billing_interval IS DISTINCT FROM OLD.billing_interval
    OR NEW.interval_count IS DISTINCT FROM OLD.interval_count
    OR NEW.tax_behavior IS DISTINCT FROM OLD.tax_behavior
    OR NEW.stripe_product_id IS DISTINCT FROM OLD.stripe_product_id
    OR NEW.stripe_price_id IS DISTINCT FROM OLD.stripe_price_id THEN
    RAISE EXCEPTION 'Commercial price identity is immutable; create a new price instead'
      USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_career_planner_premium_checkout(
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
  v_price_key text;
  v_stripe_price_id text;
  v_order_id uuid;
  v_order_item_id uuid;
  v_checkout_attempt_id uuid;
  v_existing_session_id text;
  v_existing_status text;
BEGIN
  -- Serialize the same client intent before creating any order rows.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_idempotency_key::text, 0));

  SELECT ca.id, ca.order_id, ca.stripe_checkout_session_id, ca.status,
         oi.product_price_id, pp.stripe_price_id
    INTO v_checkout_attempt_id, v_order_id, v_existing_session_id, v_existing_status,
         v_product_price_id, v_stripe_price_id
  FROM public.checkout_attempts ca
  JOIN public.order_items oi ON oi.order_id = ca.order_id
  JOIN public.product_prices pp ON pp.id = oi.product_price_id
  WHERE ca.idempotency_key = p_idempotency_key
  ORDER BY oi.created_at ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
      SELECT v_checkout_attempt_id, v_order_id, v_product_price_id,
             v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  SELECT p.id, p.name, pp.id, pp.price_key, pp.stripe_price_id
    INTO v_product_id, v_product_name, v_product_price_id, v_price_key, v_stripe_price_id
  FROM public.products p
  JOIN public.product_prices pp ON pp.product_id = p.id
  WHERE p.product_key = 'career_planner'
    AND p.status = 'active'
    AND pp.price_key = 'career_planner_premium_eur'
    AND pp.is_active
    AND pp.currency = 'EUR'
    AND pp.unit_amount = 595
    AND pp.billing_type = 'one_time'
    AND pp.billing_interval IS NULL
    AND pp.interval_count IS NULL
    AND pp.stripe_product_id IS NOT NULL
    AND pp.stripe_price_id IS NOT NULL
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Career Planner Premium catalog is unavailable'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.orders (
    user_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount
  ) VALUES (
    p_user_id, 'pending', 'EUR', 595, 0, 0, 595
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity
  ) VALUES (
    v_order_id, v_product_id, v_product_price_id, v_product_name, v_price_key, 'EUR', 595, 1
  )
  RETURNING id INTO v_order_item_id;

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

REVOKE ALL ON FUNCTION public.prepare_career_planner_premium_checkout(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_career_planner_premium_checkout(uuid, uuid)
  TO service_role;

COMMIT;
