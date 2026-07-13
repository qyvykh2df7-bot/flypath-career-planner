-- =============================================================================
-- FlyPath: catálogo de plantillas transaccionales de acompañamiento
-- Migración: 20260712070000_add_mentorship_email_template_keys.sql
--
-- Amplía únicamente el catálogo cerrado de email_jobs.template_key. No altera
-- jobs existentes, tipos, idempotencia, índices ni relaciones.
-- =============================================================================

BEGIN;

ALTER TABLE public.email_jobs
  DROP CONSTRAINT IF EXISTS email_jobs_template_key_check;

ALTER TABLE public.email_jobs
  ADD CONSTRAINT email_jobs_template_key_check
    CHECK (
      template_key IS NULL
      OR template_key IN (
        'career_planner_confirmation',
        'preppl_waitlist_confirmation',
        'mentorship_request_confirmation',
        'mentorship_internal_alert'
      )
    );

COMMENT ON CONSTRAINT email_jobs_template_key_check ON public.email_jobs IS
  'Catálogo cerrado de plantillas transaccionales; NULL se conserva para jobs de secuencia.';

COMMIT;
