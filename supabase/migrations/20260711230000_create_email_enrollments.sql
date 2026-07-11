-- =============================================================================
-- FlyPath Backend Core: inscripciones de leads en secuencias de email
-- Migración: 20260711230000_create_email_enrollments.sql
--
-- Alcance: SOLO public.email_enrollments (DDL + RLS privado).
-- Depende de: public.leads (20260711200000), public.email_sequences (20260711220000).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin jobs, deliveries, cron, proveedor de envío ni triggers de inscripción.
-- Gestión vía service_role en rutas servidor y Warhome (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.email_enrollments — lead inscrito en una secuencia de email
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES public.email_sequences (id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending',
  current_step_order integer,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  paused_at timestamptz,
  cancelled_at timestamptz,
  failed_at timestamptz,
  next_run_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_enrollments_status_check
    CHECK (status IN (
      'pending',
      'active',
      'paused',
      'completed',
      'cancelled',
      'failed'
    )),
  CONSTRAINT email_enrollments_current_step_order_positive_check
    CHECK (current_step_order IS NULL OR current_step_order > 0),
  CONSTRAINT email_enrollments_active_next_run_at_check
    CHECK (status <> 'active' OR next_run_at IS NOT NULL),
  CONSTRAINT email_enrollments_completed_at_check
    CHECK (status <> 'completed' OR completed_at IS NOT NULL),
  CONSTRAINT email_enrollments_paused_at_check
    CHECK (status <> 'paused' OR paused_at IS NOT NULL),
  CONSTRAINT email_enrollments_cancelled_at_check
    CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL),
  CONSTRAINT email_enrollments_failed_at_check
    CHECK (status <> 'failed' OR failed_at IS NOT NULL)
);

COMMENT ON TABLE public.email_enrollments IS
  'Inscripción de un lead en una secuencia de email. Sin jobs ni envíos aún.';

COMMENT ON COLUMN public.email_enrollments.lead_id IS
  'Lead inscrito. CASCADE al eliminar el lead.';

COMMENT ON COLUMN public.email_enrollments.sequence_id IS
  'Secuencia de email. RESTRICT: no se puede borrar la secuencia mientras tenga inscripciones.';

COMMENT ON COLUMN public.email_enrollments.status IS
  'Estado: pending | active | paused | completed | cancelled | failed.';

COMMENT ON COLUMN public.email_enrollments.current_step_order IS
  'Paso actual (1, 2, 3…). NULL antes de iniciar o si aún no se ha asignado.';

COMMENT ON COLUMN public.email_enrollments.enrolled_at IS
  'Momento de alta en la secuencia.';

COMMENT ON COLUMN public.email_enrollments.started_at IS
  'Momento en que la inscripción pasó a ejecutarse (p. ej. primer envío). Opcional.';

COMMENT ON COLUMN public.email_enrollments.next_run_at IS
  'Próxima ejecución programada. Obligatorio cuando status = active.';

COMMENT ON COLUMN public.email_enrollments.last_error IS
  'Último error registrado (p. ej. al fallar un paso). Sin jobs automáticos aún.';

-- -----------------------------------------------------------------------------
-- B) CHECK constraints — definidos en CREATE TABLE (ver sección A)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- C) Unicidad parcial — una inscripción abierta por lead y secuencia
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS email_enrollments_lead_sequence_open_unique
  ON public.email_enrollments (lead_id, sequence_id)
  WHERE status IN ('pending', 'active', 'paused');

COMMENT ON INDEX public.email_enrollments_lead_sequence_open_unique IS
  'Impide más de una inscripción simultánea (pending/active/paused) por lead y secuencia.';

-- -----------------------------------------------------------------------------
-- D) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_email_enrollments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_enrollments_set_updated_at ON public.email_enrollments;
CREATE TRIGGER email_enrollments_set_updated_at
  BEFORE UPDATE ON public.email_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_email_enrollments_updated_at();

COMMENT ON FUNCTION public.set_email_enrollments_updated_at() IS
  'Actualiza email_enrollments.updated_at antes de cada UPDATE.';

-- -----------------------------------------------------------------------------
-- E) Índices — lead_id/sequence_id no duplican el índice único parcial
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS email_enrollments_lead_id_idx
  ON public.email_enrollments (lead_id);

CREATE INDEX IF NOT EXISTS email_enrollments_sequence_id_idx
  ON public.email_enrollments (sequence_id);

CREATE INDEX IF NOT EXISTS email_enrollments_status_idx
  ON public.email_enrollments (status);

CREATE INDEX IF NOT EXISTS email_enrollments_next_run_at_idx
  ON public.email_enrollments (next_run_at);

CREATE INDEX IF NOT EXISTS email_enrollments_current_step_order_idx
  ON public.email_enrollments (current_step_order);

CREATE INDEX IF NOT EXISTS email_enrollments_enrolled_at_idx
  ON public.email_enrollments (enrolled_at);

-- -----------------------------------------------------------------------------
-- F) RLS — tabla privada; solo service_role desde servidor / Warhome
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_enrollments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_enrollments FROM anon;
REVOKE ALL ON public.email_enrollments FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Gestión de inscripciones: rutas API y procesos internos con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
