-- =============================================================================
-- FlyPath Phase 10B: commercial catalog, orders, payments and entitlements.
--
-- This is a schema-only foundation. It intentionally creates no Stripe client,
-- checkout session, HTTP webhook, payment, entitlement, or catalog seed.
-- Operational writes remain server-only through service_role in later blocks.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Immutable commercial price references. `products` remains the product catalog.
CREATE TABLE IF NOT EXISTS public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  price_key text NOT NULL UNIQUE CHECK (price_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  currency char(3) NOT NULL DEFAULT 'EUR' CHECK (currency = upper(currency)),
  unit_amount integer NOT NULL CHECK (unit_amount >= 0),
  billing_type text NOT NULL CHECK (billing_type IN ('one_time', 'recurring')),
  billing_interval text NULL CHECK (billing_interval IN ('month', 'year')),
  interval_count smallint NULL CHECK (interval_count BETWEEN 1 AND 12),
  tax_behavior text NOT NULL DEFAULT 'unspecified' CHECK (tax_behavior IN ('inclusive', 'exclusive', 'unspecified')),
  stripe_price_id text NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_prices_billing_shape_check CHECK (
    (billing_type = 'one_time' AND billing_interval IS NULL AND interval_count IS NULL)
    OR
    (billing_type = 'recurring' AND billing_interval IS NOT NULL AND interval_count IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS product_prices_product_active_idx
  ON public.product_prices (product_id, is_active) WHERE is_active;

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
    OR NEW.stripe_price_id IS DISTINCT FROM OLD.stripe_price_id THEN
    RAISE EXCEPTION 'Commercial price identity is immutable; create a new price instead'
      USING ERRCODE = '23000';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_prices_guard_immutable_fields
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_price_update();

-- Stripe customer records never establish a FlyPath account relationship by email.
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id text NOT NULL UNIQUE,
  billing_email_hash text NULL CHECK (billing_email_hash ~ '^[a-f0-9]{64}$'),
  linked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_customers_email_hash_idx
  ON public.stripe_customers (billing_email_hash) WHERE billing_email_hash IS NOT NULL;

-- An order may be placed by a guest. The normalized email is retained only for
-- delivery/recovery; its digest supports server-only matching without implying
-- account ownership.
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_record_id uuid NULL REFERENCES public.stripe_customers(id) ON DELETE SET NULL,
  purchaser_email text NULL,
  purchaser_email_hash text NULL CHECK (purchaser_email_hash ~ '^[a-f0-9]{64}$'),
  guest_claim_status text NOT NULL DEFAULT 'not_required'
    CHECK (guest_claim_status IN ('not_required', 'pending', 'claimed', 'expired')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'payment_failed', 'cancelled', 'partially_refunded', 'refunded', 'disputed', 'fulfilled')),
  currency char(3) NOT NULL DEFAULT 'EUR' CHECK (currency = upper(currency)),
  subtotal_amount integer NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
  discount_amount integer NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount integer NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount integer NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_at timestamptz NULL,
  claimed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_amounts_check CHECK (
    discount_amount <= subtotal_amount
    AND total_amount = subtotal_amount - discount_amount + tax_amount
  ),
  CONSTRAINT orders_paid_timestamp_check CHECK (
    (status IN ('paid', 'partially_refunded', 'refunded', 'disputed', 'fulfilled') AND paid_at IS NOT NULL)
    OR
    (status IN ('pending', 'payment_failed', 'cancelled') AND paid_at IS NULL)
  ),
  CONSTRAINT orders_purchaser_email_pair_check CHECK (
    (purchaser_email IS NULL AND purchaser_email_hash IS NULL)
    OR
    (
      purchaser_email IS NOT NULL
      AND purchaser_email_hash IS NOT NULL
      AND purchaser_email = lower(btrim(purchaser_email))
      AND purchaser_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      AND purchaser_email_hash = encode(extensions.digest(purchaser_email, 'sha256'), 'hex')
    )
  ),
  CONSTRAINT orders_guest_claim_shape_check CHECK (
    (user_id IS NULL AND guest_claim_status IN ('not_required', 'pending', 'expired') AND claimed_at IS NULL)
    OR
    (user_id IS NOT NULL AND guest_claim_status = 'not_required' AND claimed_at IS NULL)
    OR
    (user_id IS NOT NULL AND guest_claim_status = 'claimed' AND claimed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS orders_user_created_idx
  ON public.orders (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_email_hash_created_idx
  ON public.orders (purchaser_email_hash, created_at DESC) WHERE purchaser_email_hash IS NOT NULL;

-- Created before calling Stripe. The idempotency key is owned by server code,
-- never accepted as a trusted browser price or entitlement decision.
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  idempotency_key uuid NOT NULL UNIQUE,
  stripe_checkout_session_id text NULL UNIQUE,
  status text NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'session_created', 'completed', 'expired', 'cancelled', 'failed')),
  expires_at timestamptz NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkout_attempts_order_created_idx
  ON public.checkout_attempts (order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS checkout_attempts_user_created_idx
  ON public.checkout_attempts (user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Snapshot enough commercial information to preserve an order even if a price
-- or product is later archived. It deliberately stores no delivery body.
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_price_id uuid NOT NULL REFERENCES public.product_prices(id) ON DELETE RESTRICT,
  product_name text NOT NULL CHECK (char_length(product_name) BETWEEN 1 AND 180),
  price_key text NOT NULL CHECK (price_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  currency char(3) NOT NULL CHECK (currency = upper(currency)),
  unit_amount integer NOT NULL CHECK (unit_amount >= 0),
  quantity smallint NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 100),
  fulfillment_status text NOT NULL DEFAULT 'pending'
    CHECK (fulfillment_status IN ('pending', 'available', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_price_id)
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON public.order_items (product_id);

CREATE OR REPLACE FUNCTION public.assert_order_item_product_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  price_product_id uuid;
  price_key_value text;
  price_currency char(3);
  price_amount integer;
BEGIN
  SELECT product_id, price_key, currency, unit_amount
    INTO price_product_id, price_key_value, price_currency, price_amount
  FROM public.product_prices
  WHERE id = NEW.product_price_id;

  IF price_product_id IS DISTINCT FROM NEW.product_id
    OR price_key_value IS DISTINCT FROM NEW.price_key
    OR price_currency IS DISTINCT FROM NEW.currency
    OR price_amount IS DISTINCT FROM NEW.unit_amount THEN
    RAISE EXCEPTION 'Order item does not match its commercial price'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER order_items_require_matching_price
  BEFORE INSERT OR UPDATE OF product_id, product_price_id, price_key, currency, unit_amount
  ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.assert_order_item_product_price();

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'stripe' CHECK (provider = 'stripe'),
  stripe_payment_intent_id text NULL UNIQUE,
  stripe_charge_id text NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'requires_action', 'succeeded', 'failed', 'partially_refunded', 'refunded', 'disputed', 'cancelled')),
  currency char(3) NOT NULL CHECK (currency = upper(currency)),
  amount integer NOT NULL CHECK (amount >= 0),
  amount_refunded integer NOT NULL DEFAULT 0 CHECK (amount_refunded BETWEEN 0 AND amount),
  failure_code text NULL CHECK (char_length(failure_code) BETWEEN 1 AND 120),
  succeeded_at timestamptz NULL,
  failed_at timestamptz NULL,
  refunded_at timestamptz NULL,
  disputed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_order_created_idx ON public.payments (order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_successful_per_order_idx
  ON public.payments (order_id)
  WHERE status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed');

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  product_price_id uuid NOT NULL REFERENCES public.product_prices(id) ON DELETE RESTRICT,
  stripe_customer_record_id uuid NULL REFERENCES public.stripe_customers(id) ON DELETE SET NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL
    CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'cancelled', 'unpaid', 'paused')),
  current_period_start timestamptz NULL,
  current_period_end timestamptz NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz NULL,
  ended_at timestamptz NULL,
  guest_claim_status text NOT NULL DEFAULT 'not_required'
    CHECK (guest_claim_status IN ('not_required', 'pending', 'claimed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_period_check CHECK (
    current_period_start IS NULL OR current_period_end IS NULL OR current_period_end >= current_period_start
  ),
  CONSTRAINT subscriptions_guest_claim_shape_check CHECK (
    (user_id IS NULL AND guest_claim_status IN ('not_required', 'pending', 'expired'))
    OR
    (user_id IS NOT NULL AND guest_claim_status IN ('not_required', 'claimed'))
  )
);

CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx
  ON public.subscriptions (user_id, status) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_order_price_unique_idx
  ON public.subscriptions (order_id, product_price_id) WHERE order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assert_recurring_subscription_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  price_billing_type text;
BEGIN
  SELECT billing_type INTO price_billing_type
  FROM public.product_prices
  WHERE id = NEW.product_price_id;

  IF price_billing_type IS DISTINCT FROM 'recurring' THEN
    RAISE EXCEPTION 'Subscriptions require a recurring product price'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_require_recurring_price
  BEFORE INSERT OR UPDATE OF product_price_id ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.assert_recurring_subscription_price();

-- Deduplicated webhook ledger. Raw Stripe payloads are intentionally not stored.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL CHECK (event_type IN (
    'checkout.session.completed',
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
  )),
  stripe_object_id text NULL,
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'ignored', 'failed')),
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  error_code text NULL CHECK (char_length(error_code) BETWEEN 1 AND 120),
  provider_created_at timestamptz NULL,
  processed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_status_created_idx
  ON public.stripe_webhook_events (status, created_at ASC);
CREATE INDEX IF NOT EXISTS stripe_webhook_events_object_idx
  ON public.stripe_webhook_events (stripe_object_id) WHERE stripe_object_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_key text NOT NULL UNIQUE CHECK (entitlement_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 180),
  description text NULL CHECK (char_length(description) <= 1_000),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A product can grant more than one entitlement, which supports bundles without
-- adding product-specific boolean access flags.
CREATE TABLE IF NOT EXISTS public.product_entitlements (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  entitlement_id uuid NOT NULL REFERENCES public.entitlements(id) ON DELETE RESTRICT,
  grant_kind text NOT NULL CHECK (grant_kind IN ('perpetual', 'subscription_period', 'fixed_duration')),
  default_duration_days integer NULL CHECK (default_duration_days BETWEEN 1 AND 36_500),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, entitlement_id),
  CONSTRAINT product_entitlements_duration_check CHECK (
    (grant_kind IN ('perpetual', 'subscription_period') AND default_duration_days IS NULL)
    OR
    (grant_kind = 'fixed_duration' AND default_duration_days IS NOT NULL)
  )
);

-- Access is granted to a verified FlyPath account, or remains pending claim.
-- The idempotency key and source-specific indexes prevent a webhook/payment from
-- producing the same access twice.
CREATE TABLE IF NOT EXISTS public.entitlement_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id uuid NOT NULL REFERENCES public.entitlements(id) ON DELETE RESTRICT,
  beneficiary_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  order_item_id uuid NULL REFERENCES public.order_items(id) ON DELETE RESTRICT,
  subscription_id uuid NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  granted_by_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('one_time_purchase', 'subscription', 'manual', 'migration')),
  status text NOT NULL DEFAULT 'pending_claim' CHECK (status IN ('pending_claim', 'active', 'revoked', 'expired')),
  idempotency_key uuid NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NULL,
  revoked_at timestamptz NULL,
  revocation_reason text NULL CHECK (revocation_reason IN ('refund', 'chargeback', 'subscription_ended', 'manual', 'fraud')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entitlement_grants_source_shape_check CHECK (
    (source = 'one_time_purchase' AND order_item_id IS NOT NULL AND subscription_id IS NULL)
    OR
    (source = 'subscription' AND order_item_id IS NULL AND subscription_id IS NOT NULL)
    OR
    (source IN ('manual', 'migration') AND order_item_id IS NULL AND subscription_id IS NULL)
  ),
  CONSTRAINT entitlement_grants_source_dates_check CHECK (
    (source <> 'subscription' OR ends_at IS NOT NULL)
    AND (status <> 'expired' OR ends_at IS NOT NULL)
    AND (source <> 'manual' OR granted_by_user_id IS NOT NULL)
  ),
  CONSTRAINT entitlement_grants_beneficiary_shape_check CHECK (
    (status = 'pending_claim' AND beneficiary_user_id IS NULL)
    OR
    (status <> 'pending_claim' AND beneficiary_user_id IS NOT NULL)
  ),
  CONSTRAINT entitlement_grants_dates_check CHECK (
    (ends_at IS NULL OR ends_at >= starts_at)
    AND (revoked_at IS NULL OR revoked_at >= starts_at)
  ),
  CONSTRAINT entitlement_grants_revocation_shape_check CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)
    OR
    (status <> 'revoked' AND revoked_at IS NULL AND revocation_reason IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS entitlement_grants_order_item_unique_idx
  ON public.entitlement_grants (order_item_id, entitlement_id) WHERE order_item_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS entitlement_grants_subscription_unique_idx
  ON public.entitlement_grants (subscription_id, entitlement_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS entitlement_grants_beneficiary_active_idx
  ON public.entitlement_grants (beneficiary_user_id, entitlement_id, starts_at DESC)
  WHERE beneficiary_user_id IS NOT NULL AND status = 'active';

-- Opaque, single-use tokens to claim a guest purchase or recover a digital
-- delivery. Tokens are hashed; no clear token or recipient email is exposed.
CREATE TABLE IF NOT EXISTS public.order_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  purpose text NOT NULL CHECK (purpose IN ('claim_access', 'recover_delivery')),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  claimed_by_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_claim_tokens_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT order_claim_tokens_consumed_check CHECK (consumed_at IS NULL OR consumed_at >= created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS order_claim_tokens_active_purpose_unique_idx
  ON public.order_claim_tokens (order_id, purpose) WHERE consumed_at IS NULL;

CREATE OR REPLACE FUNCTION public.guard_order_claim_token_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.purpose IS DISTINCT FROM OLD.purpose
    OR NEW.token_hash IS DISTINCT FROM OLD.token_hash THEN
    RAISE EXCEPTION 'Claim token identity is immutable'
      USING ERRCODE = '23000';
  END IF;

  IF OLD.consumed_at IS NOT NULL
    AND (
      NEW.consumed_at IS DISTINCT FROM OLD.consumed_at
      OR NEW.claimed_by_user_id IS DISTINCT FROM OLD.claimed_by_user_id
    ) THEN
    RAISE EXCEPTION 'Consumed claim tokens cannot be reused'
      USING ERRCODE = '23000';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER order_claim_tokens_guard_update
  BEFORE UPDATE ON public.order_claim_tokens
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_claim_token_update();

CREATE OR REPLACE FUNCTION public.assert_entitlement_grant_source()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  source_product_id uuid;
BEGIN
  IF NEW.source = 'one_time_purchase' THEN
    SELECT oi.product_id INTO source_product_id
    FROM public.order_items oi
    WHERE oi.id = NEW.order_item_id;
  ELSIF NEW.source = 'subscription' THEN
    SELECT pp.product_id INTO source_product_id
    FROM public.subscriptions s
    JOIN public.product_prices pp ON pp.id = s.product_price_id
    WHERE s.id = NEW.subscription_id;
  ELSE
    RETURN NEW;
  END IF;

  IF source_product_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.product_entitlements pe
      WHERE pe.product_id = source_product_id
        AND pe.entitlement_id = NEW.entitlement_id
    ) THEN
    RAISE EXCEPTION 'Entitlement is not granted by the source product'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER entitlement_grants_require_source_mapping
  BEFORE INSERT OR UPDATE OF entitlement_id, order_item_id, subscription_id, source
  ON public.entitlement_grants
  FOR EACH ROW EXECUTE FUNCTION public.assert_entitlement_grant_source();

CREATE OR REPLACE FUNCTION public.set_commerce_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_prices_set_updated_at
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER stripe_customers_set_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER checkout_attempts_set_updated_at
  BEFORE UPDATE ON public.checkout_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER stripe_webhook_events_set_updated_at
  BEFORE UPDATE ON public.stripe_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER entitlements_set_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();
CREATE TRIGGER entitlement_grants_set_updated_at
  BEFORE UPDATE ON public.entitlement_grants
  FOR EACH ROW EXECUTE FUNCTION public.set_commerce_updated_at();

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlement_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_claim_tokens ENABLE ROW LEVEL SECURITY;

-- RLS is intentionally closed in 10B. Future account/Warhome DTOs may expose
-- narrowly scoped reads; there is no browser write path and no guest access.
REVOKE ALL ON TABLE public.product_prices, public.stripe_customers, public.orders,
  public.checkout_attempts, public.order_items, public.payments, public.subscriptions,
  public.stripe_webhook_events, public.entitlements, public.product_entitlements,
  public.entitlement_grants, public.order_claim_tokens FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.product_prices, public.stripe_customers, public.orders,
  public.checkout_attempts, public.order_items, public.payments, public.subscriptions,
  public.stripe_webhook_events, public.entitlements, public.product_entitlements,
  public.entitlement_grants, public.order_claim_tokens TO service_role;

REVOKE DELETE ON TABLE public.payments, public.stripe_webhook_events,
  public.entitlement_grants, public.order_claim_tokens FROM service_role;

REVOKE ALL ON FUNCTION public.set_commerce_updated_at(), public.assert_recurring_subscription_price(),
  public.assert_order_item_product_price(), public.guard_order_claim_token_update(),
  public.assert_entitlement_grant_source(), public.guard_product_price_update()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_commerce_updated_at(), public.assert_recurring_subscription_price(),
  public.assert_order_item_product_price(), public.guard_order_claim_token_update(),
  public.assert_entitlement_grant_source(), public.guard_product_price_update() TO service_role;

COMMENT ON TABLE public.orders IS 'Commercial orders. Guest emails do not create or imply FlyPath account ownership.';
COMMENT ON TABLE public.stripe_webhook_events IS 'Idempotent Stripe event ledger. Deliberately stores a hash instead of raw provider payloads.';
COMMENT ON TABLE public.entitlement_grants IS 'Server-resolved access grants. A grant is active only for a verified beneficiary and valid time window.';
COMMENT ON TABLE public.order_claim_tokens IS 'Opaque, hashed, single-use guest purchase claim and delivery recovery tokens.';

COMMIT;
