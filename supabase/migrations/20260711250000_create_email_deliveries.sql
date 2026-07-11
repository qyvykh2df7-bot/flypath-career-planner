-- =============================================================================
-- FlyPath Backend Core: historial de entregas de email
-- Migración: 20260711250000_create_email_deliveries.sql
--
-- Alcance: SOLO public.email_deliveries (DDL + RLS privado).
-- Depende de: public.email_jobs (20260711240000), citext (20260711200000).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin aperturas, clics, webhooks, proveedor concreto, cron, worker, RPC ni seed.
-- Gestión vía service_role en workers, webhooks y Warhome (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.email_deliveries — intento real de entrega asociado a un email_job
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.email_jobs (id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  provider text NOT NULL,
  provider_message_id text,
  status text NOT NULL DEFAULT 'pending',
  recipient_email citext NOT NULL,
  subject text NOT NULL,
  from_email citext,
  error_code text,
  error_message text,
  provider_response jsonb,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_deliveries_job_attempt_unique
    UNIQUE (job_id, attempt_number),
  CONSTRAINT email_deliveries_attempt_number_positive_check
    CHECK (attempt_number > 0),
  CONSTRAINT email_deliveries_provider_nonempty_check
    CHECK (length(btrim(provider)) > 0),
  CONSTRAINT email_deliveries_recipient_email_nonempty_check
    CHECK (length(btrim(recipient_email::text)) > 0),
  CONSTRAINT email_deliveries_subject_nonempty_check
    CHECK (length(btrim(subject)) > 0),
  CONSTRAINT email_deliveries_status_check
    CHECK (status IN (
      'pending',
      'accepted',
      'delivered',
      'bounced',
      'failed'
    )),
  CONSTRAINT email_deliveries_accepted_at_check
    CHECK (status <> 'accepted' OR accepted_at IS NOT NULL),
  CONSTRAINT email_deliveries_delivered_at_check
    CHECK (status <> 'delivered' OR delivered_at IS NOT NULL),
  CONSTRAINT email_deliveries_bounced_at_check
    CHECK (status <> 'bounced' OR bounced_at IS NOT NULL),
  CONSTRAINT email_deliveries_failed_at_check
    CHECK (status <> 'failed' OR failed_at IS NOT NULL)
);

COMMENT ON TABLE public.email_deliveries IS
  'Historial de intentos de entrega por job. Sin tracking de aperturas/clics aún.';

COMMENT ON COLUMN public.email_deliveries.job_id IS
  'Job de email asociado. CASCADE al eliminar el job.';

COMMENT ON COLUMN public.email_deliveries.attempt_number IS
  'Número de intento dentro del job (1, 2, 3…). Único por job_id.';

COMMENT ON COLUMN public.email_deliveries.provider IS
  'Identificador del proveedor de envío (p. ej. resend, postmark). Sin integración aún.';

COMMENT ON COLUMN public.email_deliveries.provider_message_id IS
  'ID externo del proveedor. Único por provider cuando no es NULL.';

COMMENT ON COLUMN public.email_deliveries.status IS
  'Estado: pending | accepted | delivered | bounced | failed.';

COMMENT ON COLUMN public.email_deliveries.recipient_email IS
  'Email destinatario en el momento del intento (citext).';

COMMENT ON COLUMN public.email_deliveries.subject IS
  'Asunto enviado en este intento.';

COMMENT ON COLUMN public.email_deliveries.from_email IS
  'Remitente usado en el intento. Opcional.';

COMMENT ON COLUMN public.email_deliveries.provider_response IS
  'Respuesta cruda del proveedor (JSON). Para depuración y webhooks futuros.';

COMMENT ON COLUMN public.email_deliveries.attempted_at IS
  'Momento en que se inició el intento de envío.';

-- -----------------------------------------------------------------------------
-- B) CONSTRAINTS — definidos en CREATE TABLE (ver sección A)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- C) Índice único parcial — provider_message_id por proveedor
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS email_deliveries_provider_message_unique
  ON public.email_deliveries (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;

COMMENT ON INDEX public.email_deliveries_provider_message_unique IS
  'Evita duplicar el mismo mensaje externo por proveedor cuando el ID existe.';

-- -----------------------------------------------------------------------------
-- D) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_email_deliveries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_deliveries_set_updated_at ON public.email_deliveries;
CREATE TRIGGER email_deliveries_set_updated_at
  BEFORE UPDATE ON public.email_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_deliveries_updated_at();

COMMENT ON FUNCTION public.set_email_deliveries_updated_at() IS
  'Actualiza email_deliveries.updated_at antes de cada UPDATE.';

-- -----------------------------------------------------------------------------
-- E) Índices — job_id cubierto por UNIQUE (job_id, attempt_number)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS email_deliveries_status_idx
  ON public.email_deliveries (status);

CREATE INDEX IF NOT EXISTS email_deliveries_provider_idx
  ON public.email_deliveries (provider);

CREATE INDEX IF NOT EXISTS email_deliveries_provider_message_id_idx
  ON public.email_deliveries (provider_message_id);

CREATE INDEX IF NOT EXISTS email_deliveries_recipient_email_idx
  ON public.email_deliveries (recipient_email);

CREATE INDEX IF NOT EXISTS email_deliveries_attempted_at_idx
  ON public.email_deliveries (attempted_at);

CREATE INDEX IF NOT EXISTS email_deliveries_delivered_at_idx
  ON public.email_deliveries (delivered_at);

CREATE INDEX IF NOT EXISTS email_deliveries_failed_at_idx
  ON public.email_deliveries (failed_at);

-- -----------------------------------------------------------------------------
-- F) RLS — tabla privada; solo service_role desde workers / webhooks / Warhome
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_deliveries FROM anon;
REVOKE ALL ON public.email_deliveries FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Registro y consulta de entregas: SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
