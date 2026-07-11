-- =============================================================================
-- FlyPath Backend Core: suscripciones de email por lead y lista
-- Migración: 20260711210000_create_email_subscriptions.sql
--
-- Alcance: SOLO public.email_subscriptions (DDL + RLS privado).
-- Depende de: public.leads (20260711200000).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin proveedor de email, webhooks, campañas ni seed de prueba.
-- Lectura/escritura vía service_role en rutas servidor (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.email_subscriptions — estado de suscripción por lead y lista
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  list_key text NOT NULL,
  status text NOT NULL DEFAULT 'subscribed',
  source text NOT NULL,
  consent_text text,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_subscriptions_lead_list_unique
    UNIQUE (lead_id, list_key),
  CONSTRAINT email_subscriptions_list_key_check
    CHECK (list_key IN (
      'newsletter',
      'career_planner',
      'preppl',
      'aerocomms',
      'mentoring',
      'general_marketing'
    )),
  CONSTRAINT email_subscriptions_status_check
    CHECK (status IN (
      'subscribed',
      'unsubscribed',
      'bounced',
      'complained',
      'blocked'
    )),
  CONSTRAINT email_subscriptions_source_check
    CHECK (source IN (
      'newsletter',
      'career_planner',
      'preppl',
      'aerocomms',
      'mentoring',
      'flypath_accompaniment',
      'guide',
      'school_comparator',
      'contact_form',
      'registration',
      'manual',
      'other'
    )),
  CONSTRAINT email_subscriptions_subscribed_consented_check
    CHECK (status <> 'subscribed' OR consented_at IS NOT NULL),
  CONSTRAINT email_subscriptions_unsubscribed_at_check
    CHECK (status <> 'unsubscribed' OR unsubscribed_at IS NOT NULL),
  CONSTRAINT email_subscriptions_bounced_at_check
    CHECK (status <> 'bounced' OR bounced_at IS NOT NULL),
  CONSTRAINT email_subscriptions_complained_at_check
    CHECK (status <> 'complained' OR complained_at IS NOT NULL),
  CONSTRAINT email_subscriptions_blocked_at_check
    CHECK (status <> 'blocked' OR blocked_at IS NOT NULL)
);

COMMENT ON TABLE public.email_subscriptions IS
  'Suscripción de un lead a una lista de email FlyPath. Sin proveedor externo ni campañas.';

COMMENT ON COLUMN public.email_subscriptions.lead_id IS
  'Lead suscrito. CASCADE al eliminar el lead.';

COMMENT ON COLUMN public.email_subscriptions.list_key IS
  'Lista FlyPath: newsletter | career_planner | preppl | aerocomms | mentoring | general_marketing.';

COMMENT ON COLUMN public.email_subscriptions.status IS
  'Estado actual: subscribed | unsubscribed | bounced | complained | blocked.';

COMMENT ON COLUMN public.email_subscriptions.source IS
  'Origen de la suscripción (mismos valores que leads.first_source / latest_source).';

COMMENT ON COLUMN public.email_subscriptions.consent_text IS
  'Texto del consentimiento mostrado al usuario en el momento del opt-in. Opcional.';

COMMENT ON COLUMN public.email_subscriptions.consented_at IS
  'Obligatorio cuando status = subscribed. La ruta servidor debe fijarlo en el alta.';

COMMENT ON COLUMN public.email_subscriptions.unsubscribed_at IS
  'Obligatorio cuando status = unsubscribed. Fechas anteriores pueden conservarse.';

-- -----------------------------------------------------------------------------
-- B) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_email_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_subscriptions_set_updated_at ON public.email_subscriptions;
CREATE TRIGGER email_subscriptions_set_updated_at
  BEFORE UPDATE ON public.email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_subscriptions_updated_at();

COMMENT ON FUNCTION public.set_email_subscriptions_updated_at() IS
  'Actualiza email_subscriptions.updated_at antes de cada UPDATE.';

-- -----------------------------------------------------------------------------
-- C) Índices — lead_id cubierto por UNIQUE (lead_id, list_key)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS email_subscriptions_list_key_idx
  ON public.email_subscriptions (list_key);

CREATE INDEX IF NOT EXISTS email_subscriptions_status_idx
  ON public.email_subscriptions (status);

CREATE INDEX IF NOT EXISTS email_subscriptions_source_idx
  ON public.email_subscriptions (source);

CREATE INDEX IF NOT EXISTS email_subscriptions_consented_at_idx
  ON public.email_subscriptions (consented_at);

CREATE INDEX IF NOT EXISTS email_subscriptions_unsubscribed_at_idx
  ON public.email_subscriptions (unsubscribed_at);

-- -----------------------------------------------------------------------------
-- D) RLS — tabla privada; solo service_role desde servidor
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_subscriptions FROM anon;
REVOKE ALL ON public.email_subscriptions FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Gestión de suscripciones: rutas API con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
