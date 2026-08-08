-- =============================================================================
-- Pre-PPL post-purchase confirmation mail.
-- Keeps the existing transactional queue and stores the delivery recipient only
-- on the already-confirmed order, never on a marketing lead or public payload.
-- =============================================================================

BEGIN;

ALTER TABLE public.email_jobs
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders (id) ON DELETE CASCADE;

ALTER TABLE public.email_jobs
  DROP CONSTRAINT IF EXISTS email_jobs_template_key_check,
  DROP CONSTRAINT IF EXISTS email_jobs_job_references_check;

ALTER TABLE public.email_jobs
  ADD CONSTRAINT email_jobs_template_key_check
    CHECK (
      template_key IS NULL OR template_key IN (
        'career_planner_confirmation', 'preppl_waitlist_confirmation',
        'mentorship_request_confirmation', 'mentorship_internal_alert',
        'school_review_verification', 'marketing_opt_in_confirmation',
        'preppl_purchase_confirmation'
      )
    ),
  ADD CONSTRAINT email_jobs_job_references_check
    CHECK (
      (
        job_type = 'sequence' AND enrollment_id IS NOT NULL AND sequence_step_id IS NOT NULL
        AND lead_id IS NOT NULL AND school_review_id IS NULL AND order_id IS NULL
      )
      OR (
        job_type = 'transactional' AND enrollment_id IS NULL AND sequence_step_id IS NULL
        AND template_key IS NOT NULL AND idempotency_key IS NOT NULL
        AND (
          (
            lead_id IS NOT NULL AND school_review_id IS NULL AND order_id IS NULL
            AND template_key NOT IN ('school_review_verification', 'preppl_purchase_confirmation')
          )
          OR (
            lead_id IS NULL AND school_review_id IS NOT NULL AND order_id IS NULL
            AND template_key = 'school_review_verification'
          )
          OR (
            lead_id IS NULL AND school_review_id IS NULL AND order_id IS NOT NULL
            AND template_key = 'preppl_purchase_confirmation'
          )
        )
      )
    );

CREATE INDEX IF NOT EXISTS email_jobs_order_id_idx ON public.email_jobs (order_id);

CREATE OR REPLACE FUNCTION public.record_preppl_guide_purchase_recipient(
  p_stripe_mode text,
  p_stripe_session_id text,
  p_checkout_attempt_id uuid,
  p_order_id uuid,
  p_purchaser_email text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_normalized_email text;
  v_existing_email text;
BEGIN
  IF p_stripe_mode NOT IN ('test', 'live')
    OR p_stripe_session_id IS NULL OR length(p_stripe_session_id) = 0
    OR p_purchaser_email IS NULL THEN
    RETURN 'invalid';
  END IF;

  v_normalized_email := lower(btrim(p_purchaser_email));
  IF length(v_normalized_email) NOT BETWEEN 3 AND 320
    OR v_normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' THEN
    RETURN 'invalid';
  END IF;

  SELECT order_row.purchaser_email
    INTO v_existing_email
  FROM public.checkout_attempts AS attempt
  JOIN public.orders AS order_row ON order_row.id = attempt.order_id
  JOIN public.order_items AS item ON item.order_id = order_row.id
  JOIN public.products AS product ON product.id = item.product_id
  JOIN public.product_prices AS price ON price.id = item.product_price_id
  WHERE attempt.id = p_checkout_attempt_id
    AND attempt.order_id = p_order_id
    AND attempt.stripe_mode = p_stripe_mode
    AND attempt.stripe_checkout_session_id = p_stripe_session_id
    AND order_row.status IN ('paid', 'fulfilled')
    AND attempt.status = 'completed'
    AND product.product_key = 'preppl_guide'
    AND price.price_key = 'preppl_guide_eur'
    AND EXISTS (
      SELECT 1 FROM public.payments AS payment
      WHERE payment.order_id = order_row.id
        AND payment.stripe_mode = p_stripe_mode
        AND payment.status = 'succeeded'
    )
  FOR UPDATE OF attempt, order_row, item;

  IF NOT FOUND THEN
    RETURN 'invalid';
  END IF;

  IF v_existing_email IS NOT NULL THEN
    RETURN CASE WHEN v_existing_email = v_normalized_email THEN 'existing' ELSE 'invalid' END;
  END IF;

  UPDATE public.orders
  SET purchaser_email = v_normalized_email,
      purchaser_email_hash = encode(extensions.digest(v_normalized_email, 'sha256'), 'hex')
  WHERE id = p_order_id;

  RETURN 'recorded';
END;
$$;

REVOKE ALL ON FUNCTION public.record_preppl_guide_purchase_recipient(text, text, uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_preppl_guide_purchase_recipient(text, text, uuid, uuid, text)
  TO service_role;

COMMENT ON COLUMN public.email_jobs.order_id IS
  'Pedido confirmado que origina un email transaccional de entrega, sin crear un lead ni consentimiento de marketing.';
COMMENT ON FUNCTION public.record_preppl_guide_purchase_recipient(text, text, uuid, uuid, text) IS
  'Guarda de forma idempotente el email normalizado de un pedido Pre-PPL ya liquidado para su comunicación operativa.';

COMMIT;
