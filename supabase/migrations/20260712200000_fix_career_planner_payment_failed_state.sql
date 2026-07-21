-- Keep a failed PaymentIntent and the internal purchase state consistent.
-- This is a follow-up to the already-applied 10D migration.
BEGIN;

CREATE OR REPLACE FUNCTION public.process_career_planner_payment_failed(
  p_event_id text,
  p_payload_hash text,
  p_provider_created_at timestamptz,
  p_stripe_payment_intent_id text,
  p_checkout_attempt_id uuid,
  p_order_id uuid,
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
  v_order_total integer;
  v_order_currency char(3);
  v_payment_id uuid;
  v_payment_status text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_event_id, 0));

  INSERT INTO public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, payload_hash, status, provider_created_at
  ) VALUES (
    p_event_id, 'payment_intent.payment_failed', p_stripe_payment_intent_id, p_payload_hash, 'processing', p_provider_created_at
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_row_id;

  IF v_event_row_id IS NULL THEN
    RETURN 'duplicate';
  END IF;

  SELECT o.total_amount, o.currency
    INTO v_order_total, v_order_currency
  FROM public.checkout_attempts ca
  JOIN public.orders o ON o.id = ca.order_id
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.product_prices pp ON pp.id = oi.product_price_id
  JOIN public.products p ON p.id = oi.product_id
  WHERE ca.id = p_checkout_attempt_id
    AND ca.order_id = p_order_id
    AND p.product_key = 'career_planner'
    AND pp.price_key = 'career_planner_premium_eur'
  FOR UPDATE OF ca, o, oi;

  IF NOT FOUND
    OR v_order_total <> 595
    OR v_order_currency <> 'EUR'
    OR p_amount <> 595
    OR lower(p_currency) <> 'eur' THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'payment_validation_failed', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  END IF;

  SELECT id, status INTO v_payment_id, v_payment_status
  FROM public.payments
  WHERE stripe_payment_intent_id = p_stripe_payment_intent_id
  FOR UPDATE;

  IF v_payment_id IS NOT NULL AND v_payment_status IN ('succeeded', 'partially_refunded', 'refunded', 'disputed') THEN
    UPDATE public.stripe_webhook_events
      SET status = 'ignored', error_code = 'payment_already_succeeded', processed_at = now()
      WHERE id = v_event_row_id;
    RETURN 'ignored';
  ELSIF v_payment_id IS NOT NULL THEN
    UPDATE public.payments
      SET status = 'failed', currency = 'EUR', amount = 595,
          failure_code = 'payment_failed', failed_at = COALESCE(failed_at, now())
      WHERE id = v_payment_id;
  ELSE
    INSERT INTO public.payments (
      order_id, provider, stripe_payment_intent_id, status, currency, amount, failure_code, failed_at
    ) VALUES (
      p_order_id, 'stripe', p_stripe_payment_intent_id, 'failed', 'EUR', 595, 'payment_failed', now()
    );
  END IF;

  UPDATE public.checkout_attempts
    SET status = 'failed'
    WHERE id = p_checkout_attempt_id
      AND status IN ('initiated', 'session_created', 'failed');

  UPDATE public.orders
    SET status = 'payment_failed'
    WHERE id = p_order_id
      AND status = 'pending';

  UPDATE public.stripe_webhook_events
    SET status = 'processed', error_code = NULL, processed_at = now()
    WHERE id = v_event_row_id;

  RETURN 'processed';
END;
$$;

REVOKE ALL ON FUNCTION public.process_career_planner_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_career_planner_payment_failed(text, text, timestamptz, text, uuid, uuid, integer, text)
  TO service_role;

COMMIT;
