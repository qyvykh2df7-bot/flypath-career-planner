-- =============================================================================
-- FlyPath Backend Core: cola interna de jobs de email
-- Migración: 20260711240000_create_email_jobs.sql
--
-- Alcance: SOLO public.email_jobs (DDL + RLS privado).
-- Depende de: public.email_enrollments (20260711230000),
--             public.email_sequence_steps (20260711220000),
--             public.leads (20260711200000).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin proveedor SMTP/API, deliveries, cron, worker, RPC ni seed.
-- Gestión vía service_role en procesos internos (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.email_jobs — cola de correos pendientes por inscripción y paso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.email_enrollments (id) ON DELETE CASCADE,
  sequence_step_id uuid NOT NULL REFERENCES public.email_sequence_steps (id) ON DELETE RESTRICT,
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL,
  locked_at timestamptz,
  locked_by text,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_error text,
  sent_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_jobs_enrollment_step_unique
    UNIQUE (enrollment_id, sequence_step_id),
  CONSTRAINT email_jobs_status_check
    CHECK (status IN (
      'pending',
      'processing',
      'sent',
      'failed',
      'cancelled'
    )),
  CONSTRAINT email_jobs_attempt_count_nonneg_check
    CHECK (attempt_count >= 0),
  CONSTRAINT email_jobs_max_attempts_positive_check
    CHECK (max_attempts > 0),
  CONSTRAINT email_jobs_attempt_count_within_max_check
    CHECK (attempt_count <= max_attempts),
  CONSTRAINT email_jobs_processing_locked_check
    CHECK (
      status <> 'processing'
      OR (locked_at IS NOT NULL AND locked_by IS NOT NULL)
    ),
  CONSTRAINT email_jobs_sent_at_check
    CHECK (status <> 'sent' OR sent_at IS NOT NULL),
  CONSTRAINT email_jobs_failed_at_check
    CHECK (status <> 'failed' OR failed_at IS NOT NULL),
  CONSTRAINT email_jobs_cancelled_at_check
    CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL)
);

COMMENT ON TABLE public.email_jobs IS
  'Cola interna de envíos de email por inscripción y paso. Sin proveedor ni worker aún.';

COMMENT ON COLUMN public.email_jobs.enrollment_id IS
  'Inscripción asociada. CASCADE al eliminar la inscripción.';

COMMENT ON COLUMN public.email_jobs.sequence_step_id IS
  'Paso de secuencia a enviar. RESTRICT: no se puede borrar el paso mientras tenga jobs.';

COMMENT ON COLUMN public.email_jobs.lead_id IS
  'Lead destinatario (desnormalizado para consultas). CASCADE al eliminar el lead.';

COMMENT ON COLUMN public.email_jobs.status IS
  'Estado: pending | processing | sent | failed | cancelled.';

COMMENT ON COLUMN public.email_jobs.scheduled_for IS
  'Momento programado para procesar/enviar el job.';

COMMENT ON COLUMN public.email_jobs.locked_at IS
  'Momento en que un worker tomó el job. Obligatorio cuando status = processing.';

COMMENT ON COLUMN public.email_jobs.locked_by IS
  'Identificador del worker que bloqueó el job. Obligatorio cuando status = processing.';

COMMENT ON COLUMN public.email_jobs.attempt_count IS
  'Intentos de envío realizados (0 al crear).';

COMMENT ON COLUMN public.email_jobs.max_attempts IS
  'Máximo de intentos permitidos antes de marcar como failed.';

-- -----------------------------------------------------------------------------
-- B) CONSTRAINTS — definidos en CREATE TABLE (ver sección A)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- C) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_email_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_jobs_set_updated_at ON public.email_jobs;
CREATE TRIGGER email_jobs_set_updated_at
  BEFORE UPDATE ON public.email_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_jobs_updated_at();

COMMENT ON FUNCTION public.set_email_jobs_updated_at() IS
  'Actualiza email_jobs.updated_at antes de cada UPDATE.';

-- -----------------------------------------------------------------------------
-- D) Índices — UNIQUE (enrollment_id, sequence_step_id) ya indexa el par
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS email_jobs_enrollment_id_idx
  ON public.email_jobs (enrollment_id);

CREATE INDEX IF NOT EXISTS email_jobs_sequence_step_id_idx
  ON public.email_jobs (sequence_step_id);

CREATE INDEX IF NOT EXISTS email_jobs_lead_id_idx
  ON public.email_jobs (lead_id);

CREATE INDEX IF NOT EXISTS email_jobs_status_idx
  ON public.email_jobs (status);

CREATE INDEX IF NOT EXISTS email_jobs_scheduled_for_idx
  ON public.email_jobs (scheduled_for);

CREATE INDEX IF NOT EXISTS email_jobs_locked_at_idx
  ON public.email_jobs (locked_at);

CREATE INDEX IF NOT EXISTS email_jobs_created_at_idx
  ON public.email_jobs (created_at);

CREATE INDEX IF NOT EXISTS email_jobs_pending_scheduled_for_idx
  ON public.email_jobs (scheduled_for)
  WHERE status = 'pending';

COMMENT ON INDEX public.email_jobs_pending_scheduled_for_idx IS
  'Cola del worker: jobs pending listos por scheduled_for.';

-- -----------------------------------------------------------------------------
-- E) RLS — tabla privada; solo service_role desde procesos internos
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_jobs FROM anon;
REVOKE ALL ON public.email_jobs FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Procesamiento de jobs: workers y rutas API con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
