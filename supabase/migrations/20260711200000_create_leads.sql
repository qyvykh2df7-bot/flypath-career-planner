-- =============================================================================
-- FlyPath Backend Core: captación de leads e intereses de producto
-- Migración: 20260711200000_create_leads.sql
--
-- Alcance: public.leads + public.lead_product_interests (DDL + RLS privado).
-- Depende de: public.products (20260711180000), auth.users (Supabase Auth).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin seed, sin policies públicas, sin triggers lead→usuario.
-- Altas vía service_role en rutas servidor (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Extensiones
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- -----------------------------------------------------------------------------
-- B) public.leads — email centralizado e identidad de captación
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  email citext NOT NULL UNIQUE,
  full_name text,
  first_source text NOT NULL,
  latest_source text NOT NULL,
  funnel_stage text NOT NULL DEFAULT 'new',
  status text NOT NULL DEFAULT 'active',
  marketing_consent boolean NOT NULL DEFAULT false,
  country_code text,
  preferred_language text NOT NULL DEFAULT 'es',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_email_nonempty_check
    CHECK (length(btrim(email::text)) > 0),
  CONSTRAINT leads_first_source_check
    CHECK (first_source IN (
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
  CONSTRAINT leads_latest_source_check
    CHECK (latest_source IN (
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
  CONSTRAINT leads_funnel_stage_check
    CHECK (funnel_stage IN (
      'new',
      'interested',
      'engaged',
      'qualified',
      'customer',
      'inactive'
    )),
  CONSTRAINT leads_status_check
    CHECK (status IN (
      'active',
      'unsubscribed',
      'bounced',
      'blocked',
      'archived'
    )),
  CONSTRAINT leads_preferred_language_check
    CHECK (preferred_language IN ('es', 'en')),
  CONSTRAINT leads_country_code_check
    CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$')
);

COMMENT ON TABLE public.leads IS
  'Leads privados de FlyPath (email + fuente + etapa). Sin campañas ni historial de formularios.';

COMMENT ON COLUMN public.leads.user_id IS
  'Usuario vinculado opcionalmente. SET NULL si se elimina el usuario en auth.users.';

COMMENT ON COLUMN public.leads.email IS
  'Email único (citext). Normalizado a minúsculas sin espacios por trigger.';

COMMENT ON COLUMN public.leads.first_source IS
  'Primer punto de captación del lead (canal/origen inicial).';

COMMENT ON COLUMN public.leads.latest_source IS
  'Último punto de captación conocido. La app debe actualizarlo en nuevas interacciones.';

COMMENT ON COLUMN public.leads.funnel_stage IS
  'Etapa del embudo: new | interested | engaged | qualified | customer | inactive.';

COMMENT ON COLUMN public.leads.status IS
  'Estado operativo: active | unsubscribed | bounced | blocked | archived.';

COMMENT ON COLUMN public.leads.last_seen_at IS
  'Última interacción registrada. Solo la app lo actualiza; no hay trigger automático.';

-- Normalización de email antes de INSERT o UPDATE.
CREATE OR REPLACE FUNCTION public.normalize_leads_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email = lower(btrim(NEW.email::text))::citext;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_normalize_email ON public.leads;
CREATE TRIGGER leads_normalize_email
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_leads_email();

COMMENT ON FUNCTION public.normalize_leads_email() IS
  'Normaliza leads.email a minúsculas sin espacios (lower + btrim) en INSERT/UPDATE.';

CREATE OR REPLACE FUNCTION public.set_leads_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_leads_updated_at();

COMMENT ON FUNCTION public.set_leads_updated_at() IS
  'Actualiza leads.updated_at antes de cada UPDATE en public.leads.';

CREATE INDEX IF NOT EXISTS leads_funnel_stage_idx
  ON public.leads (funnel_stage);

CREATE INDEX IF NOT EXISTS leads_status_idx
  ON public.leads (status);

CREATE INDEX IF NOT EXISTS leads_latest_source_idx
  ON public.leads (latest_source);

CREATE INDEX IF NOT EXISTS leads_last_seen_at_idx
  ON public.leads (last_seen_at);

-- user_id ya tiene índice único implícito (UNIQUE). email idem (UNIQUE citext).

-- -----------------------------------------------------------------------------
-- C) public.lead_product_interests — interés de un lead en un producto
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_product_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  first_source text NOT NULL,
  latest_source text NOT NULL,
  status text NOT NULL DEFAULT 'interested',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_product_interests_lead_product_unique
    UNIQUE (lead_id, product_id),
  CONSTRAINT lead_product_interests_first_source_check
    CHECK (first_source IN (
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
  CONSTRAINT lead_product_interests_latest_source_check
    CHECK (latest_source IN (
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
  CONSTRAINT lead_product_interests_status_check
    CHECK (status IN (
      'interested',
      'waitlist',
      'qualified',
      'customer',
      'not_interested',
      'archived'
    ))
);

COMMENT ON TABLE public.lead_product_interests IS
  'Intereses de producto por lead. Una fila por par (lead_id, product_id).';

COMMENT ON COLUMN public.lead_product_interests.lead_id IS
  'Lead propietario del interés. CASCADE al eliminar el lead.';

COMMENT ON COLUMN public.lead_product_interests.product_id IS
  'Producto de public.products asociado al interés.';

COMMENT ON COLUMN public.lead_product_interests.status IS
  'Estado del interés: interested | waitlist | qualified | customer | not_interested | archived.';

COMMENT ON COLUMN public.lead_product_interests.last_seen_at IS
  'Última interacción con este producto. Solo la app lo actualiza.';

CREATE OR REPLACE FUNCTION public.set_lead_product_interests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lead_product_interests_set_updated_at ON public.lead_product_interests;
CREATE TRIGGER lead_product_interests_set_updated_at
  BEFORE UPDATE ON public.lead_product_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_product_interests_updated_at();

COMMENT ON FUNCTION public.set_lead_product_interests_updated_at() IS
  'Actualiza lead_product_interests.updated_at antes de cada UPDATE.';

-- lead_id cubierto por UNIQUE (lead_id, product_id) como índice compuesto.
CREATE INDEX IF NOT EXISTS lead_product_interests_product_id_idx
  ON public.lead_product_interests (product_id);

CREATE INDEX IF NOT EXISTS lead_product_interests_status_idx
  ON public.lead_product_interests (status);

CREATE INDEX IF NOT EXISTS lead_product_interests_last_seen_at_idx
  ON public.lead_product_interests (last_seen_at);

-- -----------------------------------------------------------------------------
-- D) RLS — tablas privadas; solo service_role (bypass RLS) desde servidor
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_product_interests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM authenticated;

REVOKE ALL ON public.lead_product_interests FROM anon;
REVOKE ALL ON public.lead_product_interests FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Captación de formularios: rutas API con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
