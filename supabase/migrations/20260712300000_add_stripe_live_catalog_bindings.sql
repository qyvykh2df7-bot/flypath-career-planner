-- =============================================================================
-- FlyPath: Stripe Test/Live catalog bindings.
--
-- `product_prices` remains the immutable commercial identity. Stripe creates
-- distinct immutable Price objects in Test and Live, so their provider IDs are
-- stored in a separate, server-only binding table rather than overwriting the
-- historical Test identifiers.
-- =============================================================================

BEGIN;

CREATE TABLE public.stripe_catalog_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_price_id uuid NOT NULL REFERENCES public.product_prices(id) ON DELETE RESTRICT,
  stripe_mode text NOT NULL CHECK (stripe_mode IN ('test', 'live')),
  stripe_product_id text NOT NULL CHECK (stripe_product_id ~ '^prod_[A-Za-z0-9]+$'),
  stripe_price_id text NOT NULL CHECK (stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_price_id, stripe_mode),
  UNIQUE (stripe_mode, stripe_price_id)
);

CREATE INDEX stripe_catalog_bindings_mode_active_idx
  ON public.stripe_catalog_bindings (stripe_mode, is_active)
  WHERE is_active;

CREATE OR REPLACE FUNCTION public.guard_stripe_catalog_binding_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.product_price_id IS DISTINCT FROM OLD.product_price_id
    OR NEW.stripe_mode IS DISTINCT FROM OLD.stripe_mode
    OR NEW.stripe_product_id IS DISTINCT FROM OLD.stripe_product_id
    OR NEW.stripe_price_id IS DISTINCT FROM OLD.stripe_price_id THEN
    RAISE EXCEPTION 'Stripe catalog binding identity is immutable; create a new binding instead'
      USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stripe_catalog_bindings_guard_immutable_fields
  BEFORE UPDATE ON public.stripe_catalog_bindings
  FOR EACH ROW EXECUTE FUNCTION public.guard_stripe_catalog_binding_update();

CREATE TRIGGER stripe_catalog_bindings_set_updated_at
  BEFORE UPDATE ON public.stripe_catalog_bindings
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();

-- Existing operations were all performed with Stripe Test. The provider mode is
-- persisted on new records so a Live webhook can never settle a Test Checkout.
ALTER TABLE public.orders
  ADD COLUMN stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));
ALTER TABLE public.checkout_attempts
  ADD COLUMN stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));
ALTER TABLE public.payments
  ADD COLUMN stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));
ALTER TABLE public.stripe_customers
  ADD COLUMN stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));
ALTER TABLE public.subscriptions
  ADD COLUMN stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN stripe_mode text NOT NULL DEFAULT 'test' CHECK (stripe_mode IN ('test', 'live'));

ALTER TABLE public.stripe_customers DROP CONSTRAINT IF EXISTS stripe_customers_user_id_key;
CREATE UNIQUE INDEX stripe_customers_user_mode_unique_idx
  ON public.stripe_customers (user_id, stripe_mode) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX stripe_webhook_events_mode_event_unique_idx
  ON public.stripe_webhook_events (stripe_mode, stripe_event_id);

-- Historical webhook RPCs still target the original event-id uniqueness while
-- Test remains available. Preserve that index during the transition; Stripe
-- event IDs are globally opaque and the new mode index is used by v2 flows.

CREATE INDEX subscriptions_user_mode_status_idx
  ON public.subscriptions (user_id, stripe_mode, status) WHERE user_id IS NOT NULL;
DROP INDEX IF EXISTS public.subscriptions_one_open_per_user_price_idx;
CREATE UNIQUE INDEX subscriptions_one_open_per_user_price_mode_idx
  ON public.subscriptions (user_id, product_price_id, stripe_mode)
  WHERE user_id IS NOT NULL
    AND status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'unpaid', 'paused');
CREATE INDEX checkout_attempts_mode_session_idx
  ON public.checkout_attempts (stripe_mode, stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Keep all historical Test bindings, including the archived 7.37 EUR price.
INSERT INTO public.stripe_catalog_bindings (
  product_price_id, stripe_mode, stripe_product_id, stripe_price_id, is_active
)
SELECT price.id, 'test', price.stripe_product_id, price.stripe_price_id, price.is_active
FROM public.product_prices AS price
JOIN public.products AS product ON product.id = price.product_id
WHERE (product.product_key, price.price_key) IN (
  ('career_planner', 'career_planner_premium_eur'),
  ('como_ser_piloto_guide', 'como_ser_piloto_guide_eur'),
  ('aerocomms_pro', 'aerocomms_pro_monthly_eur'),
  ('aerocomms_pro', 'aerocomms_pro_monthly_eur_599')
)
  AND price.stripe_product_id IS NOT NULL
  AND price.stripe_price_id IS NOT NULL
ON CONFLICT (product_price_id, stripe_mode) DO NOTHING;

DO $$
DECLARE
  v_career_price_id uuid;
  v_guide_price_id uuid;
  v_aerocomms_price_id uuid;
BEGIN
  SELECT price.id INTO v_career_price_id
  FROM public.product_prices AS price
  JOIN public.products AS product ON product.id = price.product_id
  WHERE product.product_key = 'career_planner'
    AND price.price_key = 'career_planner_premium_eur'
    AND price.currency = 'EUR'
    AND price.unit_amount = 595
    AND price.billing_type = 'one_time';

  SELECT price.id INTO v_guide_price_id
  FROM public.product_prices AS price
  JOIN public.products AS product ON product.id = price.product_id
  WHERE product.product_key = 'como_ser_piloto_guide'
    AND price.price_key = 'como_ser_piloto_guide_eur'
    AND price.currency = 'EUR'
    AND price.unit_amount = 1495
    AND price.billing_type = 'one_time';

  SELECT price.id INTO v_aerocomms_price_id
  FROM public.product_prices AS price
  JOIN public.products AS product ON product.id = price.product_id
  WHERE product.product_key = 'aerocomms_pro'
    AND price.price_key = 'aerocomms_pro_monthly_eur_599'
    AND price.currency = 'EUR'
    AND price.unit_amount = 599
    AND price.billing_type = 'recurring'
    AND price.billing_interval = 'month'
    AND price.interval_count = 1;

  IF v_career_price_id IS NULL OR v_guide_price_id IS NULL OR v_aerocomms_price_id IS NULL THEN
    RAISE EXCEPTION 'Stripe Live bindings require the closed FlyPath commercial catalog'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.stripe_catalog_bindings (product_price_id, stripe_mode, stripe_product_id, stripe_price_id)
  VALUES
    (v_aerocomms_price_id, 'live', 'prod_UwBTbbxIuxOWFo', 'price_1TwJ6VKuujVRKb0PexWeKrvD'),
    (v_guide_price_id, 'live', 'prod_UwBTIYeQ69e225', 'price_1TwJ6cKuujVRKb0PPKY1Y8El'),
    (v_career_price_id, 'live', 'prod_UwBTzck12AoM3X', 'price_1TwJ6gKuujVRKb0PzHL9PjjN')
  ON CONFLICT (product_price_id, stripe_mode) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.stripe_catalog_bindings
    WHERE product_price_id = v_aerocomms_price_id
      AND stripe_mode = 'live'
      AND stripe_product_id = 'prod_UwBTbbxIuxOWFo'
      AND stripe_price_id = 'price_1TwJ6VKuujVRKb0PexWeKrvD'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.stripe_catalog_bindings
    WHERE product_price_id = v_guide_price_id
      AND stripe_mode = 'live'
      AND stripe_product_id = 'prod_UwBTIYeQ69e225'
      AND stripe_price_id = 'price_1TwJ6cKuujVRKb0PPKY1Y8El'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.stripe_catalog_bindings
    WHERE product_price_id = v_career_price_id
      AND stripe_mode = 'live'
      AND stripe_product_id = 'prod_UwBTzck12AoM3X'
      AND stripe_price_id = 'price_1TwJ6gKuujVRKb0PzHL9PjjN'
  ) THEN
    RAISE EXCEPTION 'Existing Stripe Live binding conflicts with the closed FlyPath catalog'
      USING ERRCODE = '23514';
  END IF;
END;
$$;

-- A single server-only preparation boundary resolves a closed product/price
-- pair and its binding for the mode selected by STRIPE_SECRET_KEY. It accepts
-- no provider identifiers, amounts, currency or URLs from a browser.
CREATE FUNCTION public.prepare_stripe_catalog_checkout(
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
      ('como_ser_piloto_guide', 'como_ser_piloto_guide_eur')
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
    AND ((p_product_key = 'career_planner' AND price.currency = 'EUR' AND price.unit_amount = 595 AND price.billing_type = 'one_time')
      OR (p_product_key = 'como_ser_piloto_guide' AND price.currency = 'EUR' AND price.unit_amount = 1495 AND price.billing_type = 'one_time'))
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

  INSERT INTO public.orders (
    user_id, stripe_mode, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount
  ) VALUES (p_user_id, p_stripe_mode, 'pending', v_currency, v_unit_amount, 0, 0, v_unit_amount)
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity
  ) VALUES (v_order_id, v_product_id, v_product_price_id, v_product_name, p_price_key, v_currency, v_unit_amount, 1);

  INSERT INTO public.checkout_attempts (order_id, user_id, stripe_mode, idempotency_key, status)
  VALUES (v_order_id, p_user_id, p_stripe_mode, p_idempotency_key, 'initiated')
  RETURNING id INTO v_attempt_id;

  RETURN QUERY SELECT v_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, NULL::text, 'initiated'::text;
END;
$$;

-- Subscription Checkout is separate because an AeroComms Pro account may not
-- open duplicate subscriptions in the same Stripe mode.
CREATE FUNCTION public.prepare_aerocomms_pro_subscription_checkout_v2(
  p_idempotency_key uuid,
  p_user_id uuid,
  p_stripe_mode text
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
  v_attempt_id uuid;
  v_existing_user_id uuid;
  v_existing_session_id text;
  v_existing_status text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'AeroComms Pro Checkout requires an authenticated account' USING ERRCODE = '28000';
  END IF;
  IF p_stripe_mode NOT IN ('test', 'live') THEN
    RAISE EXCEPTION 'AeroComms Pro catalog is unavailable' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('aerocomms_pro:' || p_user_id::text || ':' || p_stripe_mode, 0));

  SELECT product.id, product.name, price.id, binding.stripe_price_id
    INTO v_product_id, v_product_name, v_product_price_id, v_stripe_price_id
  FROM public.products AS product
  JOIN public.product_prices AS price ON price.product_id = product.id
  JOIN public.stripe_catalog_bindings AS binding
    ON binding.product_price_id = price.id
   AND binding.stripe_mode = p_stripe_mode
   AND binding.is_active
  WHERE product.product_key = 'aerocomms_pro'
    AND product.status = 'active'
    AND price.price_key = 'aerocomms_pro_monthly_eur_599'
    AND price.is_active
    AND price.currency = 'EUR'
    AND price.unit_amount = 599
    AND price.billing_type = 'recurring'
    AND price.billing_interval = 'month'
    AND price.interval_count = 1
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'AeroComms Pro catalog is unavailable' USING ERRCODE = 'P0001';
  END IF;

  SELECT attempt.id, attempt.order_id, attempt.user_id, attempt.stripe_checkout_session_id, attempt.status
    INTO v_attempt_id, v_order_id, v_existing_user_id, v_existing_session_id, v_existing_status
  FROM public.checkout_attempts AS attempt
  WHERE attempt.idempotency_key = p_idempotency_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing_user_id IS DISTINCT FROM p_user_id OR EXISTS (
      SELECT 1 FROM public.checkout_attempts WHERE id = v_attempt_id AND stripe_mode IS DISTINCT FROM p_stripe_mode
    ) THEN
      RAISE EXCEPTION 'Checkout intent belongs to another account or Stripe mode' USING ERRCODE = '23505';
    END IF;
    RETURN QUERY SELECT v_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, v_existing_session_id, v_existing_status;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions AS subscription
    JOIN public.product_prices AS price ON price.id = subscription.product_price_id
    WHERE subscription.user_id = p_user_id
      AND subscription.stripe_mode = p_stripe_mode
      AND price.product_id = v_product_id
      AND subscription.status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'unpaid', 'paused')
  ) THEN
    RAISE EXCEPTION 'AeroComms Pro already has an open subscription' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.orders (user_id, stripe_mode, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount)
  VALUES (p_user_id, p_stripe_mode, 'pending', 'EUR', 599, 0, 0, 599)
  RETURNING id INTO v_order_id;
  INSERT INTO public.order_items (order_id, product_id, product_price_id, product_name, price_key, currency, unit_amount, quantity)
  VALUES (v_order_id, v_product_id, v_product_price_id, v_product_name, 'aerocomms_pro_monthly_eur_599', 'EUR', 599, 1);
  INSERT INTO public.checkout_attempts (order_id, user_id, stripe_mode, idempotency_key, status)
  VALUES (v_order_id, p_user_id, p_stripe_mode, p_idempotency_key, 'initiated') RETURNING id INTO v_attempt_id;

  RETURN QUERY SELECT v_attempt_id, v_order_id, v_product_price_id, v_stripe_price_id, NULL::text, 'initiated'::text;
END;
$$;

CREATE FUNCTION public.settle_stripe_catalog_checkout_v2(
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
  IF p_stripe_mode NOT IN ('test', 'live') OR p_product_key NOT IN ('career_planner', 'como_ser_piloto_guide') THEN
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

CREATE FUNCTION public.apply_aerocomms_pro_subscription_webhook_event_v2(
  p_event_id text,
  p_event_type text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_mode text,
  p_stripe_object_id text,
  p_action text,
  p_stripe_subscription_id text,
  p_stripe_customer_id text DEFAULT NULL,
  p_checkout_attempt_id uuid DEFAULT NULL,
  p_order_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_product_price_id uuid DEFAULT NULL,
  p_stripe_price_id text DEFAULT NULL,
  p_subscription_status text DEFAULT NULL,
  p_current_period_start timestamptz DEFAULT NULL,
  p_current_period_end timestamptz DEFAULT NULL,
  p_cancel_at_period_end boolean DEFAULT false,
  p_amount integer DEFAULT NULL,
  p_currency text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_row_id uuid;
  v_product_id uuid;
  v_entitlement_id uuid;
  v_catalog_amount integer;
  v_customer_id uuid;
  v_customer_user_id uuid;
  v_subscription_id uuid;
  v_existing_event_at timestamptz;
  v_grant_ends_at timestamptz;
BEGIN
  IF p_stripe_mode NOT IN ('test', 'live')
    OR p_event_type NOT IN ('checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed', 'charge.refunded', 'charge.dispute.created')
    OR p_action NOT IN ('subscription_sync', 'invoice_paid', 'invoice_payment_failed', 'revoke_refund', 'revoke_dispute')
    OR p_stripe_subscription_id IS NULL OR char_length(p_stripe_subscription_id) = 0
    OR p_payload_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'AeroComms Pro webhook contract is unavailable' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_stripe_mode || ':' || p_event_id, 0));
  INSERT INTO public.stripe_webhook_events (stripe_mode, stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at)
  VALUES (p_stripe_mode, p_event_id, p_event_type, p_stripe_object_id, p_payload_hash, 'processing', p_provider_created_at)
  ON CONFLICT (stripe_mode, stripe_event_id) DO NOTHING RETURNING id INTO v_event_row_id;
  IF v_event_row_id IS NULL THEN RETURN 'duplicate'; END IF;

  IF p_action = 'subscription_sync' THEN
    SELECT product.id, entitlement.id, price.unit_amount
      INTO v_product_id, v_entitlement_id, v_catalog_amount
    FROM public.products AS product
    JOIN public.product_prices AS price ON price.product_id = product.id
    JOIN public.stripe_catalog_bindings AS binding
      ON binding.product_price_id = price.id
     AND binding.stripe_mode = p_stripe_mode
     AND binding.is_active
    JOIN public.entitlements AS entitlement
      ON entitlement.entitlement_key = 'aerocomms_pro' AND entitlement.is_active
    JOIN public.product_entitlements AS mapping
      ON mapping.product_id = product.id
     AND mapping.entitlement_id = entitlement.id
     AND mapping.grant_kind = 'subscription_period'
    WHERE product.product_key = 'aerocomms_pro'
      AND product.status = 'active'
      AND price.id = p_product_price_id
      AND price.price_key = 'aerocomms_pro_monthly_eur_599'
      AND price.currency = 'EUR'
      AND price.unit_amount = 599
      AND price.billing_type = 'recurring'
      AND price.billing_interval = 'month'
      AND price.interval_count = 1
      AND binding.stripe_price_id = p_stripe_price_id;

    IF v_product_id IS NULL OR p_checkout_attempt_id IS NULL OR p_order_id IS NULL OR p_user_id IS NULL
      OR p_stripe_customer_id IS NULL OR p_subscription_status NOT IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'cancelled', 'unpaid', 'paused')
      OR p_current_period_end IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.checkout_attempts AS attempt
        JOIN public.orders AS order_row ON order_row.id = attempt.order_id
        JOIN public.order_items AS item ON item.order_id = order_row.id
        WHERE attempt.id = p_checkout_attempt_id
          AND attempt.order_id = p_order_id
          AND attempt.user_id = p_user_id
          AND attempt.stripe_mode = p_stripe_mode
          AND order_row.user_id = p_user_id
          AND order_row.stripe_mode = p_stripe_mode
          AND order_row.total_amount = v_catalog_amount
          AND order_row.currency = 'EUR'
          AND item.product_price_id = p_product_price_id
          AND (p_event_type <> 'checkout.session.completed' OR attempt.stripe_checkout_session_id = p_stripe_object_id)
      ) THEN
      UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'checkout_reference_invalid', processed_at = now() WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;

    SELECT id, user_id INTO v_customer_id, v_customer_user_id
    FROM public.stripe_customers
    WHERE stripe_customer_id = p_stripe_customer_id AND stripe_mode = p_stripe_mode
    FOR UPDATE;
    IF FOUND AND v_customer_user_id IS NOT NULL AND v_customer_user_id IS DISTINCT FROM p_user_id THEN
      UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'customer_reference_conflict', processed_at = now() WHERE id = v_event_row_id;
      RETURN 'ignored';
    ELSIF NOT FOUND THEN
      INSERT INTO public.stripe_customers (user_id, stripe_mode, stripe_customer_id, linked_at)
      VALUES (p_user_id, p_stripe_mode, p_stripe_customer_id, now()) RETURNING id INTO v_customer_id;
    ELSE
      UPDATE public.stripe_customers SET user_id = p_user_id, linked_at = COALESCE(linked_at, now()) WHERE id = v_customer_id;
    END IF;

    UPDATE public.orders SET stripe_customer_record_id = v_customer_id WHERE id = p_order_id;
    UPDATE public.checkout_attempts
      SET status = CASE WHEN p_event_type = 'checkout.session.completed' THEN 'completed' ELSE status END,
          completed_at = CASE WHEN p_event_type = 'checkout.session.completed' THEN COALESCE(completed_at, now()) ELSE completed_at END,
          expires_at = CASE WHEN p_event_type = 'checkout.session.completed' THEN NULL ELSE expires_at END
      WHERE id = p_checkout_attempt_id;

    INSERT INTO public.subscriptions (
      user_id, order_id, product_price_id, stripe_customer_record_id, stripe_mode, stripe_subscription_id,
      status, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, ended_at, last_provider_event_at
    ) VALUES (
      p_user_id, p_order_id, p_product_price_id, v_customer_id, p_stripe_mode, p_stripe_subscription_id,
      p_subscription_status, p_current_period_start, p_current_period_end, p_cancel_at_period_end,
      CASE WHEN p_subscription_status = 'cancelled' THEN p_provider_created_at ELSE NULL END,
      CASE WHEN p_subscription_status = 'cancelled' THEN p_provider_created_at ELSE NULL END,
      p_provider_created_at
    ) ON CONFLICT (stripe_subscription_id) DO NOTHING
    RETURNING id, last_provider_event_at INTO v_subscription_id, v_existing_event_at;

    IF v_subscription_id IS NULL THEN
      SELECT id, last_provider_event_at INTO v_subscription_id, v_existing_event_at
      FROM public.subscriptions
      WHERE stripe_subscription_id = p_stripe_subscription_id AND stripe_mode = p_stripe_mode
      FOR UPDATE;
      IF v_existing_event_at IS NOT NULL AND v_existing_event_at > p_provider_created_at THEN
        UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'stale_provider_event', processed_at = now() WHERE id = v_event_row_id;
        RETURN 'ignored';
      END IF;
      UPDATE public.subscriptions
      SET user_id = p_user_id, order_id = p_order_id, product_price_id = p_product_price_id,
          stripe_customer_record_id = v_customer_id, status = p_subscription_status,
          current_period_start = p_current_period_start, current_period_end = p_current_period_end,
          cancel_at_period_end = p_cancel_at_period_end,
          cancelled_at = CASE WHEN p_subscription_status = 'cancelled' THEN COALESCE(cancelled_at, p_provider_created_at) ELSE NULL END,
          ended_at = CASE WHEN p_subscription_status = 'cancelled' THEN COALESCE(ended_at, p_provider_created_at) ELSE NULL END,
          last_provider_event_at = p_provider_created_at
      WHERE id = v_subscription_id;
    END IF;
  ELSE
    SELECT subscription.id, subscription.last_provider_event_at, entitlement.id, price.unit_amount
      INTO v_subscription_id, v_existing_event_at, v_entitlement_id, v_catalog_amount
    FROM public.subscriptions AS subscription
    JOIN public.product_prices AS price ON price.id = subscription.product_price_id
    JOIN public.products AS product ON product.id = price.product_id
    JOIN public.stripe_catalog_bindings AS binding
      ON binding.product_price_id = price.id AND binding.stripe_mode = p_stripe_mode
    JOIN public.entitlements AS entitlement ON entitlement.entitlement_key = 'aerocomms_pro'
    WHERE subscription.stripe_subscription_id = p_stripe_subscription_id
      AND subscription.stripe_mode = p_stripe_mode
      AND product.product_key = 'aerocomms_pro'
    FOR UPDATE OF subscription;
    IF v_subscription_id IS NULL THEN
      UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'subscription_not_found', processed_at = now() WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;
    IF p_action IN ('invoice_paid', 'invoice_payment_failed') AND v_existing_event_at > p_provider_created_at THEN
      UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'stale_provider_event', processed_at = now() WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;
    IF p_action IN ('invoice_paid', 'invoice_payment_failed')
      AND (p_amount IS DISTINCT FROM v_catalog_amount OR upper(p_currency) <> 'EUR') THEN
      UPDATE public.stripe_webhook_events SET status = 'ignored', error_code = 'invoice_validation_failed', processed_at = now() WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;
    UPDATE public.subscriptions
      SET status = CASE WHEN p_action = 'invoice_payment_failed' THEN 'past_due' ELSE p_subscription_status END,
          current_period_start = p_current_period_start,
          current_period_end = p_current_period_end,
          cancel_at_period_end = p_cancel_at_period_end,
          grace_period_ends_at = CASE WHEN p_action = 'invoice_payment_failed' THEN p_provider_created_at + interval '2 days' ELSE NULL END,
          last_provider_event_at = p_provider_created_at
      WHERE id = v_subscription_id;
  END IF;

  IF p_action IN ('revoke_refund', 'revoke_dispute')
    OR p_subscription_status IN ('cancelled', 'unpaid', 'paused') THEN
    UPDATE public.entitlement_grants
      SET status = 'revoked', revoked_at = now(), revocation_reason = CASE WHEN p_action = 'revoke_dispute' THEN 'chargeback' ELSE 'subscription_ended' END
    WHERE subscription_id = v_subscription_id AND entitlement_id = v_entitlement_id AND status <> 'revoked';
  ELSE
    v_grant_ends_at := CASE WHEN p_action = 'invoice_payment_failed' THEN p_provider_created_at + interval '2 days' ELSE p_current_period_end END;
    INSERT INTO public.entitlement_grants (entitlement_id, beneficiary_user_id, subscription_id, source, status, idempotency_key, starts_at, ends_at)
    SELECT v_entitlement_id, subscription.user_id, v_subscription_id, 'subscription', 'active', v_subscription_id,
           LEAST(COALESCE(p_current_period_start, p_provider_created_at), v_grant_ends_at), v_grant_ends_at
    FROM public.subscriptions AS subscription WHERE subscription.id = v_subscription_id
    ON CONFLICT (subscription_id, entitlement_id) WHERE subscription_id IS NOT NULL
    DO UPDATE SET status = 'active', ends_at = EXCLUDED.ends_at, revoked_at = NULL, revocation_reason = NULL;
  END IF;

  UPDATE public.stripe_webhook_events SET status = 'processed', error_code = NULL, processed_at = now() WHERE id = v_event_row_id;
  RETURN 'processed';
END;
$$;

ALTER TABLE public.stripe_catalog_bindings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_catalog_bindings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.stripe_catalog_bindings TO service_role;
REVOKE DELETE ON TABLE public.stripe_catalog_bindings FROM service_role;

REVOKE ALL ON FUNCTION public.prepare_stripe_catalog_checkout(text, text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout_v2(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_stripe_catalog_checkout_v2(text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event_v2(text, text, text, timestamptz, text, text, text, text, text, uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, boolean, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_stripe_catalog_checkout(text, text, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout_v2(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_stripe_catalog_checkout_v2(text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event_v2(text, text, text, timestamptz, text, text, text, text, text, uuid, uuid, uuid, uuid, text, text, timestamptz, timestamptz, boolean, integer, text) TO service_role;

COMMIT;
