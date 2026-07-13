-- =============================================================================
-- FlyPath: consentimiento por lista, historial privado y bajas seguras
--
-- Conserva un historial append-only de cambios de suscripción y tokens opacos
-- de baja. No almacena tokens en claro, emails, IPs, user agents ni metadata.
-- La baja se resuelve de forma atómica mediante una RPC limitada a service_role.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.email_subscriptions (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  list_key text NOT NULL,
  event_type text NOT NULL,
  source text,
  consent_text text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_subscription_events_list_key_check CHECK (list_key IN (
    'newsletter',
    'home_newsletter',
    'career_planner',
    'preppl',
    'aerocomms',
    'mentoring',
    'general_marketing'
  )),
  CONSTRAINT email_subscription_events_event_type_check CHECK (event_type IN (
    'subscribed',
    'resubscribed',
    'unsubscribed',
    'bounced',
    'complained',
    'blocked'
  ))
);

CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.email_subscriptions (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT email_unsubscribe_tokens_token_hash_unique UNIQUE (token_hash),
  CONSTRAINT email_unsubscribe_tokens_token_hash_check CHECK (
    token_hash ~ '^[0-9a-f]{64}$'
  )
);

CREATE INDEX IF NOT EXISTS email_subscription_events_subscription_occurred_at_idx
  ON public.email_subscription_events (subscription_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS email_subscription_events_lead_occurred_at_idx
  ON public.email_subscription_events (lead_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS email_subscription_events_occurred_at_idx
  ON public.email_subscription_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS email_unsubscribe_tokens_subscription_id_idx
  ON public.email_unsubscribe_tokens (subscription_id);

ALTER TABLE public.email_subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_subscription_events FROM anon;
REVOKE ALL ON TABLE public.email_subscription_events FROM authenticated;
REVOKE ALL ON TABLE public.email_unsubscribe_tokens FROM anon;
REVOKE ALL ON TABLE public.email_unsubscribe_tokens FROM authenticated;

-- El historial es append-only para la aplicación: service_role puede leer e
-- insertar, pero no actualizar ni borrar eventos ya registrados.
REVOKE UPDATE, DELETE ON TABLE public.email_subscription_events FROM service_role;
GRANT SELECT, INSERT ON TABLE public.email_subscription_events TO service_role;
REVOKE DELETE ON TABLE public.email_unsubscribe_tokens FROM service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.email_unsubscribe_tokens TO service_role;

CREATE OR REPLACE FUNCTION public.unsubscribe_email_subscription_by_token_hash(
  p_token_hash text
)
RETURNS TABLE (result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_token public.email_unsubscribe_tokens%ROWTYPE;
  target_subscription public.email_subscriptions%ROWTYPE;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN QUERY SELECT 'invalid'::text;
    RETURN;
  END IF;

  SELECT * INTO target_token
  FROM public.email_unsubscribe_tokens
  WHERE token_hash = p_token_hash
    AND revoked_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text;
    RETURN;
  END IF;

  SELECT * INTO target_subscription
  FROM public.email_subscriptions
  WHERE id = target_token.subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'invalid'::text;
    RETURN;
  END IF;

  UPDATE public.email_unsubscribe_tokens
  SET consumed_at = COALESCE(consumed_at, now())
  WHERE id = target_token.id;

  IF target_subscription.status = 'unsubscribed' THEN
    RETURN QUERY SELECT 'already_unsubscribed'::text;
    RETURN;
  END IF;

  -- Una señal técnica prevalece sobre una baja comercial para no degradar una
  -- supresión fiable ni habilitar un envío futuro por error.
  IF target_subscription.status IN ('bounced', 'complained', 'blocked') THEN
    RETURN QUERY SELECT 'processed'::text;
    RETURN;
  END IF;

  UPDATE public.email_subscriptions
  SET
    status = 'unsubscribed',
    unsubscribed_at = COALESCE(unsubscribed_at, now())
  WHERE id = target_subscription.id;

  INSERT INTO public.email_subscription_events (
    subscription_id,
    lead_id,
    list_key,
    event_type,
    source,
    consent_text,
    occurred_at
  )
  VALUES (
    target_subscription.id,
    target_subscription.lead_id,
    target_subscription.list_key,
    'unsubscribed',
    'unsubscribe_link',
    NULL,
    now()
  );

  RETURN QUERY SELECT 'processed'::text;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_email_subscription_by_token_hash(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unsubscribe_email_subscription_by_token_hash(text) FROM anon;
REVOKE ALL ON FUNCTION public.unsubscribe_email_subscription_by_token_hash(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_email_subscription_by_token_hash(text) TO service_role;

COMMENT ON TABLE public.email_subscription_events IS
  'Historial append-only de consentimiento y supresión por lista; sin metadata ni evidencia técnica invasiva.';
COMMENT ON TABLE public.email_unsubscribe_tokens IS
  'Tokens opacos de baja almacenados únicamente como SHA-256; no contiene emails ni tokens en claro.';
COMMENT ON FUNCTION public.unsubscribe_email_subscription_by_token_hash(text) IS
  'Baja idempotente por token hash; no devuelve identidad, email, lead ni lista.';

COMMIT;
