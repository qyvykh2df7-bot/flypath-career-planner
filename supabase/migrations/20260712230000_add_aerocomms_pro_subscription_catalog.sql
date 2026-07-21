-- =============================================================================
-- FlyPath Phase 10G.2: AeroComms Pro recurring subscription catalog.
--
-- This migration links an existing Stripe Test catalog entry, but creates no
-- Stripe resource, Checkout Session, subscription, entitlement grant, or user
-- access.
-- A later signed Stripe webhook will create subscriptions and issue/revoke
-- time-bounded grants. The two-day grace period is applied to grant ends_at
-- there, after the Stripe period end is verified.
-- =============================================================================

BEGIN;

INSERT INTO public.products (
  product_key,
  name,
  product_type,
  sales_channel,
  status,
  description
)
VALUES (
  'aerocomms_pro',
  'AeroComms Pro',
  'subscription',
  'stripe',
  'active',
  'Suscripción mensual para desbloquear AeroComms Pro.'
)
ON CONFLICT (product_key) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type,
  sales_channel = EXCLUDED.sales_channel,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

DO $$
DECLARE
  v_product_id uuid;
  v_price_product_id uuid;
  v_price_currency char(3);
  v_price_amount integer;
  v_price_billing_type text;
  v_price_interval text;
  v_price_interval_count smallint;
  v_price_stripe_product_id text;
  v_price_stripe_price_id text;
BEGIN
  SELECT id INTO v_product_id
  FROM public.products
  WHERE product_key = 'aerocomms_pro';

  SELECT product_id, currency, unit_amount, billing_type, billing_interval, interval_count,
         stripe_product_id, stripe_price_id
    INTO v_price_product_id, v_price_currency, v_price_amount, v_price_billing_type,
         v_price_interval, v_price_interval_count, v_price_stripe_product_id,
         v_price_stripe_price_id
  FROM public.product_prices
  WHERE price_key = 'aerocomms_pro_monthly_eur';

  IF FOUND AND (
    v_price_product_id <> v_product_id
    OR v_price_currency <> 'EUR'
    OR v_price_amount <> 737
    OR v_price_billing_type <> 'recurring'
    OR v_price_interval <> 'month'
    OR v_price_interval_count <> 1
    OR v_price_stripe_product_id IS DISTINCT FROM 'prod_UvXKn9mQPp3G17'
    OR v_price_stripe_price_id IS DISTINCT FROM 'price_1TvgG4KuujVRKb0PkofwZMz7'
  ) THEN
    RAISE EXCEPTION 'Existing AeroComms Pro price conflicts with the closed catalog contract'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.product_prices (
    product_id,
    price_key,
    currency,
    unit_amount,
    billing_type,
    billing_interval,
    interval_count,
    stripe_product_id,
    stripe_price_id,
    is_active
  )
  VALUES (
    v_product_id,
    'aerocomms_pro_monthly_eur',
    'EUR',
    737,
    'recurring',
    'month',
    1,
    'prod_UvXKn9mQPp3G17',
    'price_1TvgG4KuujVRKb0PkofwZMz7',
    true
  )
  ON CONFLICT (price_key) DO NOTHING;
END;
$$;

INSERT INTO public.entitlements (
  entitlement_key,
  name,
  description,
  is_active
)
VALUES (
  'aerocomms_pro',
  'AeroComms Pro',
  'Acceso temporal a todo el contenido AeroComms Pro para una cuenta FlyPath.',
  true
)
ON CONFLICT (entitlement_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

INSERT INTO public.product_entitlements (
  product_id,
  entitlement_id,
  grant_kind,
  default_duration_days
)
SELECT
  product.id,
  entitlement.id,
  'subscription_period',
  NULL
FROM public.products AS product
JOIN public.entitlements AS entitlement
  ON entitlement.entitlement_key = 'aerocomms_pro'
WHERE product.product_key = 'aerocomms_pro'
ON CONFLICT (product_id, entitlement_id) DO UPDATE SET
  grant_kind = EXCLUDED.grant_kind,
  default_duration_days = EXCLUDED.default_duration_days;

COMMIT;
