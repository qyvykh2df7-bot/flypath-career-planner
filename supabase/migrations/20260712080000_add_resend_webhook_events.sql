-- =============================================================================
-- FlyPath: recepción idempotente de webhooks de Resend
-- Migración: 20260712080000_add_resend_webhook_events.sql
--
-- Conserva únicamente identificadores técnicos y estado de entrega. Nunca
-- persiste payloads, cabeceras, destinatarios, asuntos, URLs, IPs o user agents.
-- =============================================================================

BEGIN;

ALTER TABLE public.email_deliveries
  ADD COLUMN IF NOT EXISTS first_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS open_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complained_at timestamptz,
  ADD COLUMN IF NOT EXISTS suppressed_at timestamptz;

ALTER TABLE public.email_deliveries
  DROP CONSTRAINT IF EXISTS email_deliveries_open_count_nonnegative_check,
  DROP CONSTRAINT IF EXISTS email_deliveries_click_count_nonnegative_check;

ALTER TABLE public.email_deliveries
  ADD CONSTRAINT email_deliveries_open_count_nonnegative_check CHECK (open_count >= 0),
  ADD CONSTRAINT email_deliveries_click_count_nonnegative_check CHECK (click_count >= 0);

CREATE TABLE IF NOT EXISTS public.email_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  provider_message_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_webhook_events_provider_check CHECK (provider = 'resend'),
  CONSTRAINT email_webhook_events_event_type_check CHECK (
    event_type IN (
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
  ),
  CONSTRAINT email_webhook_events_provider_event_unique UNIQUE (provider, provider_event_id)
);

ALTER TABLE public.email_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_webhook_events FROM anon;
REVOKE ALL ON TABLE public.email_webhook_events FROM authenticated;

CREATE INDEX IF NOT EXISTS email_webhook_events_provider_message_id_idx
  ON public.email_webhook_events (provider, provider_message_id);

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

COMMENT ON TABLE public.email_webhook_events IS
  'Eventos de Resend deduplicados por svix-id; sin payloads ni datos personales.';

COMMENT ON FUNCTION public.apply_resend_email_webhook_event(text, text, text, text, timestamptz) IS
  'Aplica atómicamente un evento permitido de Resend sin persistir el payload.';

COMMIT;
