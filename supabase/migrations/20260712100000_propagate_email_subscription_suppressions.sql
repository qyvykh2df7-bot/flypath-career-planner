-- =============================================================================
-- FlyPath: propagar supresiones fiables de Resend a suscripciones de marketing
--
-- Extiende la RPC idempotente existente. Solo asocia por delivery -> job ->
-- lead_id; nunca por destinatario, asunto ni metadata. Los cambios y su
-- historial ocurren en la misma transacción que el webhook deduplicado.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_resend_email_webhook_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_provider_message_id text,
  p_occurred_at timestamptz
)
RETURNS TABLE (result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inserted_event_id uuid;
  target_delivery public.email_deliveries%ROWTYPE;
  target_job public.email_jobs%ROWTYPE;
BEGIN
  IF p_provider <> 'resend'
    OR p_provider_event_id IS NULL
    OR length(p_provider_event_id) = 0
    OR length(p_provider_event_id) > 255
    OR p_event_type IS NULL
    OR p_provider_message_id IS NULL
    OR length(p_provider_message_id) = 0
    OR length(p_provider_message_id) > 255
    OR p_occurred_at IS NULL
    OR p_event_type NOT IN (
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.bounced',
      'email.failed',
      'email.opened',
      'email.clicked',
      'email.complained',
      'email.suppressed'
    )
  THEN
    RAISE EXCEPTION 'invalid resend webhook event';
  END IF;

  INSERT INTO public.email_webhook_events (
    provider,
    provider_event_id,
    event_type,
    provider_message_id,
    occurred_at
  )
  VALUES (
    p_provider,
    p_provider_event_id,
    p_event_type,
    p_provider_message_id,
    p_occurred_at
  )
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING id INTO inserted_event_id;

  IF inserted_event_id IS NULL THEN
    RETURN QUERY SELECT 'duplicate'::text;
    RETURN;
  END IF;

  SELECT * INTO target_delivery
  FROM public.email_deliveries
  WHERE provider = p_provider
    AND provider_message_id = p_provider_message_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'delivery_not_found'::text;
    RETURN;
  END IF;

  SELECT * INTO target_job
  FROM public.email_jobs
  WHERE id = target_delivery.job_id;

  CASE p_event_type
    WHEN 'email.sent' THEN
      UPDATE public.email_deliveries
      SET
        status = CASE
          WHEN target_delivery.status IN ('delivered', 'bounced', 'failed') THEN target_delivery.status
          ELSE 'accepted'
        END,
        attempted_at = COALESCE(target_delivery.attempted_at, p_occurred_at),
        accepted_at = CASE
          WHEN target_delivery.accepted_at IS NULL THEN p_occurred_at
          ELSE target_delivery.accepted_at
        END
      WHERE id = target_delivery.id;
    WHEN 'email.delivered' THEN
      IF target_delivery.status NOT IN ('delivered', 'bounced', 'failed') THEN
        UPDATE public.email_deliveries
        SET
          status = 'delivered',
          delivered_at = CASE
            WHEN target_delivery.delivered_at IS NULL OR p_occurred_at > target_delivery.delivered_at
              THEN p_occurred_at
            ELSE target_delivery.delivered_at
          END
        WHERE id = target_delivery.id;
      END IF;
    WHEN 'email.bounced' THEN
      IF target_delivery.status NOT IN ('delivered', 'bounced', 'failed') THEN
        UPDATE public.email_deliveries
        SET
          status = 'bounced',
          bounced_at = CASE
            WHEN target_delivery.bounced_at IS NULL OR p_occurred_at > target_delivery.bounced_at
              THEN p_occurred_at
            ELSE target_delivery.bounced_at
          END
        WHERE id = target_delivery.id;
      END IF;
    WHEN 'email.failed' THEN
      IF target_delivery.status NOT IN ('delivered', 'bounced', 'failed') THEN
        UPDATE public.email_deliveries
        SET
          status = 'failed',
          failed_at = CASE
            WHEN target_delivery.failed_at IS NULL OR p_occurred_at > target_delivery.failed_at
              THEN p_occurred_at
            ELSE target_delivery.failed_at
          END
        WHERE id = target_delivery.id;
      END IF;
    WHEN 'email.opened' THEN
      UPDATE public.email_deliveries
      SET
        first_opened_at = CASE
          WHEN target_delivery.first_opened_at IS NULL THEN p_occurred_at
          ELSE LEAST(target_delivery.first_opened_at, p_occurred_at)
        END,
        last_opened_at = CASE
          WHEN target_delivery.last_opened_at IS NULL THEN p_occurred_at
          ELSE GREATEST(target_delivery.last_opened_at, p_occurred_at)
        END,
        open_count = target_delivery.open_count + 1
      WHERE id = target_delivery.id;
    WHEN 'email.clicked' THEN
      UPDATE public.email_deliveries
      SET
        first_clicked_at = CASE
          WHEN target_delivery.first_clicked_at IS NULL THEN p_occurred_at
          ELSE LEAST(target_delivery.first_clicked_at, p_occurred_at)
        END,
        last_clicked_at = CASE
          WHEN target_delivery.last_clicked_at IS NULL THEN p_occurred_at
          ELSE GREATEST(target_delivery.last_clicked_at, p_occurred_at)
        END,
        click_count = target_delivery.click_count + 1
      WHERE id = target_delivery.id;
    WHEN 'email.complained' THEN
      UPDATE public.email_deliveries
      SET complained_at = CASE
        WHEN target_delivery.complained_at IS NULL OR p_occurred_at > target_delivery.complained_at
          THEN p_occurred_at
        ELSE target_delivery.complained_at
      END
      WHERE id = target_delivery.id;
    WHEN 'email.suppressed' THEN
      UPDATE public.email_deliveries
      SET suppressed_at = CASE
        WHEN target_delivery.suppressed_at IS NULL OR p_occurred_at > target_delivery.suppressed_at
          THEN p_occurred_at
        ELSE target_delivery.suppressed_at
      END
      WHERE id = target_delivery.id;
    WHEN 'email.delivery_delayed' THEN
      NULL;
  END CASE;

  -- Las supresiones son globales para la dirección del lead. Se actualizan
  -- únicamente las listas existentes y se preserva el orden blocked >
  -- complained > bounced. El CTE solo inserta historial si hubo cambio real.
  IF target_job.lead_id IS NOT NULL THEN
    IF p_event_type = 'email.bounced' THEN
      WITH changed_subscriptions AS (
        UPDATE public.email_subscriptions
        SET
          status = 'bounced',
          bounced_at = CASE
            WHEN bounced_at IS NULL OR p_occurred_at > bounced_at THEN p_occurred_at
            ELSE bounced_at
          END
        WHERE lead_id = target_job.lead_id
          AND status NOT IN ('bounced', 'complained', 'blocked')
        RETURNING id, lead_id, list_key
      )
      INSERT INTO public.email_subscription_events (
        subscription_id, lead_id, list_key, event_type, source, consent_text, occurred_at
      )
      SELECT id, lead_id, list_key, 'bounced', 'resend_webhook', NULL, p_occurred_at
      FROM changed_subscriptions;
    ELSIF p_event_type = 'email.complained' THEN
      WITH changed_subscriptions AS (
        UPDATE public.email_subscriptions
        SET
          status = 'complained',
          complained_at = CASE
            WHEN complained_at IS NULL OR p_occurred_at > complained_at THEN p_occurred_at
            ELSE complained_at
          END
        WHERE lead_id = target_job.lead_id
          AND status NOT IN ('complained', 'blocked')
        RETURNING id, lead_id, list_key
      )
      INSERT INTO public.email_subscription_events (
        subscription_id, lead_id, list_key, event_type, source, consent_text, occurred_at
      )
      SELECT id, lead_id, list_key, 'complained', 'resend_webhook', NULL, p_occurred_at
      FROM changed_subscriptions;
    ELSIF p_event_type = 'email.suppressed' THEN
      WITH changed_subscriptions AS (
        UPDATE public.email_subscriptions
        SET
          status = 'blocked',
          blocked_at = CASE
            WHEN blocked_at IS NULL OR p_occurred_at > blocked_at THEN p_occurred_at
            ELSE blocked_at
          END
        WHERE lead_id = target_job.lead_id
          AND status <> 'blocked'
        RETURNING id, lead_id, list_key
      )
      INSERT INTO public.email_subscription_events (
        subscription_id, lead_id, list_key, event_type, source, consent_text, occurred_at
      )
      SELECT id, lead_id, list_key, 'blocked', 'resend_webhook', NULL, p_occurred_at
      FROM changed_subscriptions;
    END IF;
  END IF;

  RETURN QUERY SELECT 'processed'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_resend_email_webhook_event(text, text, text, text, timestamptz)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_resend_email_webhook_event(text, text, text, text, timestamptz)
  FROM anon;
REVOKE ALL ON FUNCTION public.apply_resend_email_webhook_event(text, text, text, text, timestamptz)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_resend_email_webhook_event(text, text, text, text, timestamptz)
  TO service_role;

COMMENT ON FUNCTION public.apply_resend_email_webhook_event(text, text, text, text, timestamptz) IS
  'Aplica un webhook idempotente de Resend y propaga supresiones a listas existentes sin guardar payloads.';

COMMIT;
