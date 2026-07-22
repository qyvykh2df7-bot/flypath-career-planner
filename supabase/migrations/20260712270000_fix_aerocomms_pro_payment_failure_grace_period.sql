-- =============================================================================
-- FlyPath Phase 10G: payment failure grace period semantics
-- A Stripe billing-period boundary is not a grace-period boundary. A failed
-- invoice keeps AeroComms Pro active for exactly 48 hours from the provider
-- event, without changing Stripe's current_period_end.
-- =============================================================================

BEGIN;

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_grace_period_check;

-- Repair only the old projection shape: a past-due subscription whose grace
-- was set exactly to Stripe's period boundary. The provider timestamp was
-- already recorded by the original atomic webhook RPC.
UPDATE public.subscriptions
  SET grace_period_ends_at = last_provider_event_at + interval '2 days'
WHERE status = 'past_due'
  AND grace_period_ends_at IS NOT NULL
  AND grace_period_ends_at = current_period_end
  AND last_provider_event_at IS NOT NULL;

-- Preserve the original atomic projection as an internal implementation while
-- retaining the public RPC name and signature used by the signed webhook.
ALTER FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
  text, text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid,
  text, timestamptz, timestamptz, boolean, integer, text
) RENAME TO apply_aerocomms_pro_subscription_webhook_event_v1;

CREATE FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
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
  v_result text;
  v_existing_grace_ends_at timestamptz;
  v_grace_ends_at timestamptz;
BEGIN
  -- A subscription.updated event can arrive adjacent to invoice.payment_failed.
  -- Preserve the explicit failure window rather than letting a Stripe period
  -- boundary overwrite it.
  IF p_action = 'subscription_sync' AND p_subscription_status = 'past_due' THEN
    SELECT grace_period_ends_at
      INTO v_existing_grace_ends_at
    FROM public.subscriptions
    WHERE stripe_subscription_id = p_stripe_subscription_id
    FOR UPDATE;
  END IF;

  v_result := public.apply_aerocomms_pro_subscription_webhook_event_v1(
    p_event_id,
    p_event_type,
    p_payload_hash,
    p_provider_created_at,
    p_stripe_object_id,
    p_action,
    p_stripe_subscription_id,
    p_stripe_customer_id,
    p_checkout_attempt_id,
    p_order_id,
    p_user_id,
    p_product_price_id,
    p_subscription_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_amount,
    p_currency
  );

  IF v_result <> 'processed' THEN
    RETURN v_result;
  END IF;

  IF p_action = 'invoice_payment_failed' THEN
    v_grace_ends_at := p_provider_created_at + interval '2 days';
  ELSIF p_action = 'subscription_sync' AND p_subscription_status = 'past_due' THEN
    v_grace_ends_at := COALESCE(v_existing_grace_ends_at, p_provider_created_at + interval '2 days');
  ELSE
    RETURN v_result;
  END IF;

  UPDATE public.subscriptions AS subscription
    SET status = 'past_due',
        grace_period_ends_at = v_grace_ends_at
  WHERE subscription.stripe_subscription_id = p_stripe_subscription_id;

  UPDATE public.entitlement_grants AS entitlement_grant
    SET status = 'active',
        ends_at = v_grace_ends_at,
        revoked_at = NULL,
        revocation_reason = NULL
  FROM public.entitlements AS entitlement
  WHERE entitlement_grant.subscription_id IN (
      SELECT subscription.id
      FROM public.subscriptions AS subscription
      WHERE subscription.stripe_subscription_id = p_stripe_subscription_id
    )
    AND entitlement_grant.entitlement_id = entitlement.id
    AND entitlement.entitlement_key = 'aerocomms_pro'
    AND entitlement_grant.status <> 'revoked';

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event_v1(
  text, text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid,
  text, timestamptz, timestamptz, boolean, integer, text
) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
  text, text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid,
  text, timestamptz, timestamptz, boolean, integer, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event(
  text, text, text, timestamptz, text, text, text, text, uuid, uuid, uuid, uuid,
  text, timestamptz, timestamptz, boolean, integer, text
) TO service_role;

COMMIT;
