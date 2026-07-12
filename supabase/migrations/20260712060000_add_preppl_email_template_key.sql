-- =============================================================================
-- FlyPath: catálogo de plantilla transaccional para Pre-PPL
-- Migración: 20260712060000_add_preppl_email_template_key.sql
--
-- Amplía exclusivamente el catálogo cerrado de email_jobs.template_key. Los
-- jobs de secuencia pueden conservar template_key NULL; el contrato de tipos,
-- idempotencia, relaciones e índices permanece definido en 20260712050000.
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
        'preppl_waitlist_confirmation'
      )
    );

COMMENT ON CONSTRAINT email_jobs_template_key_check ON public.email_jobs IS
  'Catálogo cerrado de plantillas transaccionales; NULL se conserva para jobs de secuencia.';

COMMIT;
