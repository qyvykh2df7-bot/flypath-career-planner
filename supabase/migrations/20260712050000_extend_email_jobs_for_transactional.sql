-- =============================================================================
-- FlyPath: jobs de email transaccionales sin secuencia sintética
-- Migración: 20260712050000_extend_email_jobs_for_transactional.sql
--
-- Permite confirmar una conversión individual con email_jobs sin crear una
-- inscripción o un paso de secuencia artificial. Conserva el contrato de los
-- jobs de secuencia existentes y evita duplicados transaccionales por plantilla
-- e idempotency_key.
-- =============================================================================

BEGIN;

ALTER TABLE public.email_jobs
  ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT 'sequence',
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

ALTER TABLE public.email_jobs
  ALTER COLUMN enrollment_id DROP NOT NULL,
  ALTER COLUMN sequence_step_id DROP NOT NULL;

ALTER TABLE public.email_jobs
  DROP CONSTRAINT IF EXISTS email_jobs_job_type_check,
  DROP CONSTRAINT IF EXISTS email_jobs_template_key_check,
  DROP CONSTRAINT IF EXISTS email_jobs_job_references_check;

ALTER TABLE public.email_jobs
  ADD CONSTRAINT email_jobs_job_type_check
    CHECK (job_type IN ('sequence', 'transactional')),
  ADD CONSTRAINT email_jobs_template_key_check
    CHECK (
      template_key IS NULL
      OR template_key IN ('career_planner_confirmation')
    ),
  ADD CONSTRAINT email_jobs_job_references_check
    CHECK (
      (
        job_type = 'sequence'
        AND enrollment_id IS NOT NULL
        AND sequence_step_id IS NOT NULL
      )
      OR (
        job_type = 'transactional'
        AND enrollment_id IS NULL
        AND sequence_step_id IS NULL
        AND template_key IS NOT NULL
        AND idempotency_key IS NOT NULL
      )
    );

CREATE UNIQUE INDEX IF NOT EXISTS email_jobs_transactional_template_idempotency_unique
  ON public.email_jobs (template_key, idempotency_key)
  WHERE job_type = 'transactional' AND idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.email_jobs.job_type IS
  'Tipo de job: sequence (requiere enrollment y step) o transactional (one-shot).';

COMMENT ON COLUMN public.email_jobs.template_key IS
  'Plantilla cerrada para jobs transaccionales. No guarda cuerpo de email.';

COMMENT ON COLUMN public.email_jobs.idempotency_key IS
  'UUID de la conversión que originó el job transaccional. Evita duplicados por plantilla.';

COMMENT ON INDEX public.email_jobs_transactional_template_idempotency_unique IS
  'Evita más de un job transaccional por plantilla e idempotency_key; no afecta secuencias.';

COMMIT;
