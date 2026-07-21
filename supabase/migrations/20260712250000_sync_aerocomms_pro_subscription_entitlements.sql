-- =============================================================================
-- FlyPath Phase 10G.5: signed Stripe subscription synchronisation for
-- AeroComms Pro. Stripe remains the payment source of truth; this migration
-- projects only verified subscription state into Commerce and entitlement grants.
-- =============================================================================

BEGIN;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_provider_event_at timestamptz NULL;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_grace_period_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_grace_period_check CHECK (
    grace_period_ends_at IS NULL
    OR current_period_end IS NULL
    OR grace_period_ends_at >= current_period_end
  );

CREATE INDEX IF NOT EXISTS subscriptions_stripe_status_event_idx
  ON public.subscriptions (stripe_subscription_id, last_provider_event_at DESC);

-- A verified user can have one unfinished Checkout or live subscription for a
-- recurring price. The server-side prepare function below reuses the pending
-- attempt under the same user/product lock.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_open_per_user_price_idx
  ON public.subscriptions (user_id, product_price_id)
  WHERE user_id IS NOT NULL
    AND status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'unpaid', 'paused');

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

  -- Serialise attempts for this account and closed product, not merely for a
  -- browser-owned idempotency key.
  PERFORM pg_advisory_xact_lock(hashtextextended('aerocomms_pro:' || p_user_id::text, 0));

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

  SELECT ca.id, ca.order_id, ca.user_id, ca.stripe_checkout_session_id, ca.status
    INTO v_checkout_attempt_id, v_order_id, v_existing_user_id, v_existing_session_id, v_existing_status
  FROM public.checkout_attempts AS ca
  JOIN public.order_items AS oi ON oi.order_id = ca.order_id
  WHERE ca.idempotency_key = p_idempotency_key
    AND oi.product_price_id = v_product_price_id
  ORDER BY oi.created_at ASC
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
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND product_price_id = v_product_price_id
      AND status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'unpaid', 'paused')
  ) THEN
    RAISE EXCEPTION 'AeroComms Pro already has an open subscription'
      USING ERRCODE = '23505';
  END IF;

  -- A second click gets the same unfinished attempt rather than another Stripe
  -- Session. Expiration is recorded by the signed Checkout expiration event.
  SELECT ca.id, ca.order_id, ca.user_id, ca.stripe_checkout_session_id, ca.status
    INTO v_checkout_attempt_id, v_order_id, v_existing_user_id, v_existing_session_id, v_existing_status
  FROM public.checkout_attempts AS ca
  JOIN public.order_items AS oi ON oi.order_id = ca.order_id
  WHERE ca.user_id = p_user_id
    AND oi.product_price_id = v_product_price_id
    AND ca.status IN ('initiated', 'session_created')
  ORDER BY ca.created_at DESC
  LIMIT 1
  FOR UPDATE OF ca;

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

CREATE OR REPLACE FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
  p_event_id text,
  p_event_type text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_object_id text,
  p_action text,
  p_stripe_subscription_id text,
  p_stripe_customer_id text DEFAULT NULL,
  p_checkout_attempt_id uuid DEFAULT NULL,
  p_order_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_product_price_id uuid DEFAULT NULL,
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
  v_catalog_price_id uuid;
  v_entitlement_id uuid;
  v_customer_record_id uuid;
  v_customer_user_id uuid;
  v_subscription_id uuid;
  v_subscription_last_event_at timestamptz;
  v_subscription_grant_status text;
  v_attempt_user_id uuid;
  v_attempt_order_id uuid;
  v_attempt_session_id text;
  v_order_user_id uuid;
  v_order_total integer;
  v_order_currency char(3);
  v_grace_ends_at timestamptz;
  v_action_requires_checkout boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));

  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at
  ) VALUES (
    p_event_id, p_event_type, p_stripe_object_id, p_payload_hash, 'processing', p_provider_created_at
  ) ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_row_id;

  IF v_event_row_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  IF p_event_type NOT IN (
    'checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated',
    'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed',
    'charge.refunded', 'charge.dispute.created'
  ) OR p_action NOT IN ('subscription_sync', 'invoice_paid', 'invoice_payment_failed', 'revoke_refund', 'revoke_dispute')
    OR p_event_id !~ '^evt_[A-Za-z0-9_]+$'
    OR p_payload_hash !~ '^[a-f0-9]{64}$'
    OR p_stripe_subscription_id IS NULL
    OR char_length(p_stripe_subscription_id) = 0 THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'subscription_validation_failed', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  SELECT product.id, price.id, entitlement.id
    INTO v_product_id, v_catalog_price_id, v_entitlement_id
  FROM public.products AS product
  JOIN public.product_prices AS price ON price.product_id = product.id
  JOIN public.entitlements AS entitlement ON entitlement.entitlement_key = 'aerocomms_pro' AND entitlement.is_active
  JOIN public.product_entitlements AS mapping
    ON mapping.product_id = product.id
   AND mapping.entitlement_id = entitlement.id
   AND mapping.grant_kind = 'subscription_period'
  WHERE product.product_key = 'aerocomms_pro'
    AND product.status = 'active'
    AND price.price_key = 'aerocomms_pro_monthly_eur'
    AND price.is_active
    AND price.currency = 'EUR'
    AND price.unit_amount = 737
    AND price.billing_type = 'recurring'
    AND price.billing_interval = 'month'
    AND price.interval_count = 1
  LIMIT 1;

  IF v_catalog_price_id IS NULL THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'catalog_unavailable', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  v_action_requires_checkout := p_action = 'subscription_sync';

  IF v_action_requires_checkout THEN
    IF p_checkout_attempt_id IS NULL OR p_order_id IS NULL OR p_user_id IS NULL
      OR p_product_price_id IS DISTINCT FROM v_catalog_price_id
      OR p_stripe_customer_id IS NULL
      OR p_subscription_status NOT IN ('incomplete', 'trialing', 'active', 'past_due', 'canceling', 'cancelled', 'unpaid', 'paused')
      OR p_current_period_end IS NULL THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'checkout_reference_invalid', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;

    SELECT ca.user_id, ca.order_id, ca.stripe_checkout_session_id, o.user_id, o.total_amount, o.currency
      INTO v_attempt_user_id, v_attempt_order_id, v_attempt_session_id, v_order_user_id, v_order_total, v_order_currency
    FROM public.checkout_attempts AS ca
    JOIN public.orders AS o ON o.id = ca.order_id
    JOIN public.order_items AS oi ON oi.order_id = o.id
    WHERE ca.id = p_checkout_attempt_id
      AND ca.order_id = p_order_id
      AND oi.product_price_id = v_catalog_price_id
    FOR UPDATE OF ca, o, oi;

    IF NOT FOUND
      OR v_attempt_user_id IS DISTINCT FROM p_user_id
      OR v_order_user_id IS DISTINCT FROM p_user_id
      OR v_order_total <> 737
      OR v_order_currency <> 'EUR'
      OR (p_event_type = 'checkout.session.completed' AND v_attempt_session_id IS DISTINCT FROM p_stripe_object_id) THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'checkout_reference_invalid', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;

    SELECT id, user_id INTO v_customer_record_id, v_customer_user_id
    FROM public.stripe_customers
    WHERE stripe_customer_id = p_stripe_customer_id
    FOR UPDATE;

    IF FOUND AND v_customer_user_id IS NOT NULL AND v_customer_user_id IS DISTINCT FROM p_user_id THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'customer_reference_conflict', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    ELSIF NOT FOUND THEN
      INSERT INTO public.stripe_customers (user_id, stripe_customer_id, linked_at)
      VALUES (p_user_id, p_stripe_customer_id, now())
      RETURNING id INTO v_customer_record_id;
    ELSE
      UPDATE public.stripe_customers
        SET user_id = p_user_id, linked_at = COALESCE(linked_at, now())
      WHERE id = v_customer_record_id;
    END IF;

    UPDATE public.orders SET stripe_customer_record_id = v_customer_record_id WHERE id = p_order_id;
    UPDATE public.checkout_attempts
      SET status = CASE WHEN p_event_type = 'checkout.session.completed' THEN 'completed' ELSE status END,
          completed_at = CASE WHEN p_event_type = 'checkout.session.completed' THEN COALESCE(completed_at, now()) ELSE completed_at END,
          expires_at = CASE WHEN p_event_type = 'checkout.session.completed' THEN NULL ELSE expires_at END
      WHERE id = p_checkout_attempt_id;

    INSERT INTO public.subscriptions (
      user_id, order_id, product_price_id, stripe_customer_record_id, stripe_subscription_id,
      status, current_period_start, current_period_end, cancel_at_period_end,
      cancelled_at, ended_at, grace_period_ends_at, last_provider_event_at
    ) VALUES (
      p_user_id, p_order_id, v_catalog_price_id, v_customer_record_id, p_stripe_subscription_id,
      p_subscription_status, p_current_period_start, p_current_period_end, p_cancel_at_period_end,
      CASE WHEN p_subscription_status = 'cancelled' THEN p_provider_created_at ELSE NULL END,
      CASE WHEN p_subscription_status = 'cancelled' THEN p_provider_created_at ELSE NULL END,
      NULL, p_provider_created_at
    )
    ON CONFLICT (stripe_subscription_id) DO NOTHING
    RETURNING id, last_provider_event_at INTO v_subscription_id, v_subscription_last_event_at;

    IF v_subscription_id IS NULL THEN
      SELECT id, last_provider_event_at INTO v_subscription_id, v_subscription_last_event_at
      FROM public.subscriptions WHERE stripe_subscription_id = p_stripe_subscription_id FOR UPDATE;

      IF v_subscription_last_event_at IS NOT NULL AND v_subscription_last_event_at > p_provider_created_at THEN
        UPDATE public.stripe_webhook_events
          SET status = 'ignored', error_code = 'stale_provider_event', processed_at = now()
          WHERE id = v_event_row_id;
        RETURN 'ignored';
      END IF;

      UPDATE public.subscriptions
        SET user_id = p_user_id, order_id = p_order_id, product_price_id = v_catalog_price_id,
            stripe_customer_record_id = v_customer_record_id, status = p_subscription_status,
            current_period_start = p_current_period_start, current_period_end = p_current_period_end,
            cancel_at_period_end = p_cancel_at_period_end,
            cancelled_at = CASE WHEN p_subscription_status = 'cancelled' THEN COALESCE(cancelled_at, p_provider_created_at) ELSE NULL END,
            ended_at = CASE WHEN p_subscription_status = 'cancelled' THEN COALESCE(ended_at, p_provider_created_at) ELSE NULL END,
            grace_period_ends_at = CASE
              WHEN p_subscription_status = 'past_due'
                THEN GREATEST(COALESCE(grace_period_ends_at, p_current_period_end), p_current_period_end)
              ELSE NULL
            END,
            last_provider_event_at = p_provider_created_at
        WHERE id = v_subscription_id;
    END IF;
  ELSE
    SELECT id, last_provider_event_at
      INTO v_subscription_id, v_subscription_last_event_at
    FROM public.subscriptions
    WHERE stripe_subscription_id = p_stripe_subscription_id
      AND product_price_id = v_catalog_price_id
    FOR UPDATE;

    IF NOT FOUND THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'subscription_not_found', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;

    IF p_action IN ('invoice_paid', 'invoice_payment_failed')
      AND v_subscription_last_event_at IS NOT NULL
      AND v_subscription_last_event_at > p_provider_created_at THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'stale_provider_event', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;
  END IF;

  IF p_action = 'subscription_sync' THEN
    IF v_subscription_id IS NULL THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'duplicate_subscription', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    ELSIF p_subscription_status IN ('active', 'canceling') THEN
      UPDATE public.orders SET status = 'paid', paid_at = COALESCE(paid_at, now())
      WHERE id = p_order_id AND status = 'pending';

      INSERT INTO public.entitlement_grants (
        entitlement_id, beneficiary_user_id, subscription_id, source, status,
        idempotency_key, starts_at, ends_at
      ) VALUES (
        v_entitlement_id, p_user_id, v_subscription_id, 'subscription', 'active',
        v_subscription_id, COALESCE(p_current_period_start, p_provider_created_at), p_current_period_end
      ) ON CONFLICT (subscription_id, entitlement_id) WHERE subscription_id IS NOT NULL
      DO UPDATE SET
        status = CASE WHEN entitlement_grants.status = 'revoked' THEN 'revoked' ELSE 'active' END,
        starts_at = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.starts_at ELSE EXCLUDED.starts_at END,
        ends_at = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.ends_at ELSE EXCLUDED.ends_at END,
        revoked_at = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.revoked_at ELSE NULL END,
        revocation_reason = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.revocation_reason ELSE NULL END;
    ELSIF p_subscription_status IN ('cancelled', 'unpaid', 'paused') THEN
      UPDATE public.entitlement_grants
        SET status = 'revoked', revoked_at = GREATEST(p_provider_created_at, starts_at),
            revocation_reason = 'subscription_ended'
      WHERE subscription_id = v_subscription_id AND entitlement_id = v_entitlement_id AND status <> 'revoked';
    END IF;
  ELSIF p_action = 'invoice_paid' THEN
    IF p_amount IS DISTINCT FROM 737
      OR upper(COALESCE(p_currency, '')) <> 'EUR'
      OR p_subscription_status NOT IN ('active', 'canceling', 'past_due') THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'invoice_validation_failed', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;

    UPDATE public.subscriptions
      SET status = 'active', grace_period_ends_at = NULL,
          current_period_start = COALESCE(p_current_period_start, current_period_start),
          current_period_end = COALESCE(p_current_period_end, current_period_end),
          last_provider_event_at = p_provider_created_at
      WHERE id = v_subscription_id;

    INSERT INTO public.entitlement_grants (
      entitlement_id, beneficiary_user_id, subscription_id, source, status,
      idempotency_key, starts_at, ends_at
    )
    SELECT v_entitlement_id, subscription.user_id, subscription.id, 'subscription', 'active',
           subscription.id, COALESCE(subscription.current_period_start, p_provider_created_at),
           COALESCE(p_current_period_end, subscription.current_period_end)
    FROM public.subscriptions AS subscription
    WHERE subscription.id = v_subscription_id
    ON CONFLICT (subscription_id, entitlement_id) WHERE subscription_id IS NOT NULL
    DO UPDATE SET
      status = CASE WHEN entitlement_grants.status = 'revoked' THEN 'revoked' ELSE 'active' END,
      ends_at = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.ends_at ELSE EXCLUDED.ends_at END,
      revoked_at = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.revoked_at ELSE NULL END,
      revocation_reason = CASE WHEN entitlement_grants.status = 'revoked' THEN entitlement_grants.revocation_reason ELSE NULL END;
  ELSIF p_action = 'invoice_payment_failed' THEN
    IF p_amount IS DISTINCT FROM 737
      OR upper(COALESCE(p_currency, '')) <> 'EUR'
      OR p_subscription_status NOT IN ('active', 'canceling', 'past_due') THEN
      UPDATE public.stripe_webhook_events
        SET status = 'ignored', error_code = 'invoice_validation_failed', processed_at = now()
        WHERE id = v_event_row_id;
      RETURN 'ignored';
    END IF;

    SELECT GREATEST(COALESCE(p_current_period_end, current_period_end), p_provider_created_at + interval '2 days')
      INTO v_grace_ends_at
    FROM public.subscriptions WHERE id = v_subscription_id FOR UPDATE;

    UPDATE public.subscriptions
      SET status = 'past_due', grace_period_ends_at = v_grace_ends_at,
          last_provider_event_at = p_provider_created_at
      WHERE id = v_subscription_id;

    UPDATE public.entitlement_grants
      SET status = 'active', ends_at = v_grace_ends_at,
          revoked_at = NULL, revocation_reason = NULL
      WHERE subscription_id = v_subscription_id
        AND entitlement_id = v_entitlement_id
        AND status <> 'revoked';
  ELSE
    UPDATE public.entitlement_grants
      SET status = 'revoked', revoked_at = GREATEST(p_provider_created_at, starts_at),
          revocation_reason = CASE WHEN p_action = 'revoke_refund' THEN 'refund' ELSE 'chargeback' END
      WHERE subscription_id = v_subscription_id
        AND entitlement_id = v_entitlement_id
        AND status <> 'revoked';

    UPDATE public.subscriptions
      SET last_provider_event_at = GREATEST(COALESCE(last_provider_event_at, p_provider_created_at), p_provider_created_at)
      WHERE id = v_subscription_id;
  END IF;

  UPDATE public.stripe_webhook_events
    SET status = 'processed', error_code = NULL, processed_at = now()
    WHERE id = v_event_row_id;
  RETURN 'processed';
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_aerocomms_pro_subscription_checkout(uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
  text, text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid,
  text, timestamptz, timestamptz, boolean, integer, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
  text, text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid,
  text, timestamptz, timestamptz, boolean, integer, text
) TO service_role;

COMMIT;
