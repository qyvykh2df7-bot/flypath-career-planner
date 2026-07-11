-- =============================================================================
-- FlyPath Backend Core: secuencias de email (definición + pasos)
-- Migración: 20260711220000_create_email_sequences.sql
--
-- Alcance: public.email_sequences + public.email_sequence_steps (DDL + RLS).
-- Depende de: public.products (20260711180000).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin enrollments, jobs, deliveries, cron ni proveedor de envío.
-- Gestión futura vía Warhome + service_role.
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.email_sequences — definición de automatizaciones de email
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  list_key text,
  trigger_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_sequences_sequence_key_format_check
    CHECK (sequence_key ~ '^[a-z0-9_]+$'),
  CONSTRAINT email_sequences_list_key_check
    CHECK (
      list_key IS NULL
      OR list_key IN (
        'newsletter',
        'career_planner',
        'preppl',
        'aerocomms',
        'mentoring',
        'general_marketing'
      )
    ),
  CONSTRAINT email_sequences_trigger_type_check
    CHECK (trigger_type IN (
      'manual',
      'on_subscription',
      'on_lead_created',
      'on_product_interest',
      'on_purchase'
    )),
  CONSTRAINT email_sequences_status_check
    CHECK (status IN (
      'draft',
      'active',
      'paused',
      'archived'
    ))
);

COMMENT ON TABLE public.email_sequences IS
  'Definición de secuencias de email FlyPath. Sin inscripciones ni envíos aún.';

COMMENT ON COLUMN public.email_sequences.sequence_key IS
  'Clave estable (minúsculas, números, guiones bajos). Ej: preppl_welcome, aerocomms_onboarding.';

COMMENT ON COLUMN public.email_sequences.product_id IS
  'Producto opcional asociado. SET NULL si se elimina el producto.';

COMMENT ON COLUMN public.email_sequences.list_key IS
  'Lista de email opcional vinculada a la secuencia. NULL si aplica a varias o ninguna.';

COMMENT ON COLUMN public.email_sequences.trigger_type IS
  'Disparador: manual | on_subscription | on_lead_created | on_product_interest | on_purchase.';

COMMENT ON COLUMN public.email_sequences.status IS
  'Estado editorial: draft | active | paused | archived.';

CREATE OR REPLACE FUNCTION public.set_email_sequences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_sequences_set_updated_at ON public.email_sequences;
CREATE TRIGGER email_sequences_set_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_sequences_updated_at();

COMMENT ON FUNCTION public.set_email_sequences_updated_at() IS
  'Actualiza email_sequences.updated_at antes de cada UPDATE.';

CREATE INDEX IF NOT EXISTS email_sequences_product_id_idx
  ON public.email_sequences (product_id);

CREATE INDEX IF NOT EXISTS email_sequences_list_key_idx
  ON public.email_sequences (list_key);

CREATE INDEX IF NOT EXISTS email_sequences_trigger_type_idx
  ON public.email_sequences (trigger_type);

CREATE INDEX IF NOT EXISTS email_sequences_status_idx
  ON public.email_sequences (status);

-- sequence_key ya tiene índice único implícito (UNIQUE).

-- -----------------------------------------------------------------------------
-- B) public.email_sequence_steps — pasos ordenados de cada secuencia
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.email_sequences (id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  delay_minutes integer NOT NULL DEFAULT 0,
  subject text,
  preview_text text,
  body_html text,
  body_text text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_sequence_steps_sequence_order_unique
    UNIQUE (sequence_id, step_order),
  CONSTRAINT email_sequence_steps_step_order_positive_check
    CHECK (step_order > 0),
  CONSTRAINT email_sequence_steps_delay_minutes_nonneg_check
    CHECK (delay_minutes >= 0),
  CONSTRAINT email_sequence_steps_content_check
    CHECK (
      status IN ('draft', 'archived')
      OR (
        nullif(btrim(coalesce(subject, '')), '') IS NOT NULL
        AND (
          nullif(btrim(coalesce(body_html, '')), '') IS NOT NULL
          OR nullif(btrim(coalesce(body_text, '')), '') IS NOT NULL
        )
      )
    ),
  CONSTRAINT email_sequence_steps_status_check
    CHECK (status IN (
      'draft',
      'active',
      'paused',
      'archived'
    ))
);

COMMENT ON TABLE public.email_sequence_steps IS
  'Pasos de una secuencia de email. delay_minutes es relativo al paso anterior. '
  'En status draft pueden estar incompletos (subject/cuerpo vacíos).';

COMMENT ON COLUMN public.email_sequence_steps.step_order IS
  'Orden dentro de la secuencia (1, 2, 3…). Único por sequence_id.';

COMMENT ON COLUMN public.email_sequence_steps.delay_minutes IS
  'Minutos de espera desde el paso anterior. 0 en el primer email; usado luego para programar envíos.';

COMMENT ON COLUMN public.email_sequence_steps.subject IS
  'Asunto del email. Opcional en draft/archived; obligatorio (no vacío) en active/paused.';

COMMENT ON COLUMN public.email_sequence_steps.body_html IS
  'Cuerpo HTML. Opcional en draft/archived; en active/paused al menos uno entre body_html y body_text.';

COMMENT ON COLUMN public.email_sequence_steps.body_text IS
  'Cuerpo texto plano. Opcional en draft/archived; en active/paused al menos uno entre body_html y body_text.';

CREATE OR REPLACE FUNCTION public.set_email_sequence_steps_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_sequence_steps_set_updated_at ON public.email_sequence_steps;
CREATE TRIGGER email_sequence_steps_set_updated_at
  BEFORE UPDATE ON public.email_sequence_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_sequence_steps_updated_at();

COMMENT ON FUNCTION public.set_email_sequence_steps_updated_at() IS
  'Actualiza email_sequence_steps.updated_at antes de cada UPDATE.';

-- sequence_id cubierto por UNIQUE (sequence_id, step_order) como índice compuesto.
CREATE INDEX IF NOT EXISTS email_sequence_steps_status_idx
  ON public.email_sequence_steps (status);

-- -----------------------------------------------------------------------------
-- C) RLS — tablas internas de administración; solo service_role / Warhome
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_sequences FROM anon;
REVOKE ALL ON public.email_sequences FROM authenticated;

REVOKE ALL ON public.email_sequence_steps FROM anon;
REVOKE ALL ON public.email_sequence_steps FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Gestión desde Warhome y rutas API con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
