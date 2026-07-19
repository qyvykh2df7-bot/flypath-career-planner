-- =============================================================================
-- FlyPath: backend privado de opiniones verificadas de escuelas
--
-- Crea opiniones, tokens opacos, versiones append-only y eventos de moderación.
-- Las tablas no son públicas: toda escritura y lectura operativa ocurre desde
-- rutas server-side con service_role. Crear una opinión no crea leads, cuentas,
-- suscripciones de marketing ni compras.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_review_status') THEN
    CREATE TYPE public.school_review_status AS ENUM (
      'awaiting_email_verification', 'pending', 'approved', 'rejected',
      'hidden', 'deletion_requested', 'deleted'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_review_relationship') THEN
    CREATE TYPE public.school_review_relationship AS ENUM (
      'current_student', 'former_student', 'completed_training', 'transferred_school', 'information_requester'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_review_answer') THEN
    CREATE TYPE public.school_review_answer AS ENUM ('yes', 'no', 'partial', 'unknown');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_review_token_purpose') THEN
    CREATE TYPE public.school_review_token_purpose AS ENUM ('verify_email', 'manage_review');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_review_moderation_reason') THEN
    CREATE TYPE public.school_review_moderation_reason AS ENUM (
      'approved', 'insufficient_detail', 'not_relevant', 'policy_violation',
      'personal_data', 'spam', 'duplicate', 'author_request', 'other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_review_version_action') THEN
    CREATE TYPE public.school_review_version_action AS ENUM ('created', 'edited', 'status_changed', 'deletion_requested');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.school_reviews (
  review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE,
  school_id text NOT NULL REFERENCES public.schools (school_id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  author_email citext NOT NULL,
  author_email_hash text NOT NULL,
  status public.school_review_status NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT true,
  rating_general smallint NOT NULL,
  rating_costs smallint NOT NULL,
  rating_availability smallint NOT NULL,
  rating_organization smallint NOT NULL,
  rating_instructors smallint NOT NULL,
  rating_support smallint NOT NULL,
  rating_contract smallint NOT NULL,
  final_cost_answer public.school_review_answer NOT NULL,
  contract_before_payment_answer public.school_review_answer NOT NULL,
  refund_clarity_answer public.school_review_answer NOT NULL,
  would_choose_again_answer public.school_review_answer NOT NULL,
  relationship public.school_review_relationship NOT NULL,
  program_phase text,
  approximate_year smallint,
  best_part text NOT NULL,
  improvements text NOT NULL,
  advice text NOT NULL,
  consent_at timestamptz NOT NULL,
  email_verified_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  hidden_at timestamptz,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  moderator_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  moderation_reason public.school_review_moderation_reason,
  moderation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_reviews_email_hash_check CHECK (author_email_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT school_reviews_email_nonempty_check CHECK (length(btrim(author_email::text)) BETWEEN 3 AND 320),
  CONSTRAINT school_reviews_rating_range_check CHECK (
    rating_general BETWEEN 1 AND 10 AND rating_costs BETWEEN 1 AND 10
    AND rating_availability BETWEEN 1 AND 10 AND rating_organization BETWEEN 1 AND 10
    AND rating_instructors BETWEEN 1 AND 10 AND rating_support BETWEEN 1 AND 10
    AND rating_contract BETWEEN 1 AND 10
  ),
  CONSTRAINT school_reviews_program_phase_length_check CHECK (program_phase IS NULL OR length(program_phase) BETWEEN 2 AND 120),
  CONSTRAINT school_reviews_approximate_year_check CHECK (approximate_year IS NULL OR approximate_year BETWEEN 1950 AND 2100),
  CONSTRAINT school_reviews_text_length_check CHECK (
    length(best_part) BETWEEN 20 AND 3000 AND length(improvements) BETWEEN 20 AND 3000
    AND length(advice) BETWEEN 20 AND 3000
  ),
  CONSTRAINT school_reviews_moderation_note_length_check CHECK (moderation_note IS NULL OR length(moderation_note) <= 1000),
  CONSTRAINT school_reviews_verification_state_check CHECK (
    (status = 'awaiting_email_verification' AND email_verified_at IS NULL)
    OR (status <> 'awaiting_email_verification' AND email_verified_at IS NOT NULL)
  ),
  CONSTRAINT school_reviews_status_timestamps_check CHECK (
    (status <> 'approved' OR approved_at IS NOT NULL)
    AND (status <> 'rejected' OR rejected_at IS NOT NULL)
    AND (status <> 'hidden' OR hidden_at IS NOT NULL)
    AND (status <> 'deletion_requested' OR deletion_requested_at IS NOT NULL)
    AND (status <> 'deleted' OR deleted_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS school_reviews_active_school_email_unique
  ON public.school_reviews (school_id, author_email_hash)
  WHERE status <> 'deleted';

CREATE UNIQUE INDEX IF NOT EXISTS school_reviews_active_school_user_unique
  ON public.school_reviews (school_id, user_id)
  WHERE user_id IS NOT NULL AND status <> 'deleted';

CREATE INDEX IF NOT EXISTS school_reviews_moderation_idx
  ON public.school_reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS school_reviews_public_read_idx
  ON public.school_reviews (school_id, approved_at DESC)
  WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS school_reviews_author_hash_idx
  ON public.school_reviews (author_email_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS school_reviews_user_id_idx
  ON public.school_reviews (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_school_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.author_email = lower(btrim(NEW.author_email::text))::citext;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS school_reviews_set_updated_at ON public.school_reviews;
CREATE TRIGGER school_reviews_set_updated_at
  BEFORE INSERT OR UPDATE ON public.school_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_school_reviews_updated_at();

CREATE TABLE IF NOT EXISTS public.school_review_tokens (
  token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.school_reviews (review_id) ON DELETE CASCADE,
  purpose public.school_review_token_purpose NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  sent_count integer NOT NULL DEFAULT 1,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_review_tokens_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT school_review_tokens_sent_count_check CHECK (sent_count BETWEEN 1 AND 3),
  CONSTRAINT school_review_tokens_expiry_check CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS school_review_tokens_active_purpose_unique
  ON public.school_review_tokens (review_id, purpose)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS school_review_tokens_review_purpose_idx
  ON public.school_review_tokens (review_id, purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS school_review_tokens_expiry_idx
  ON public.school_review_tokens (expires_at)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.school_review_versions (
  version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.school_reviews (review_id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  action public.school_review_version_action NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_review_versions_number_positive_check CHECK (version_number > 0),
  CONSTRAINT school_review_versions_snapshot_object_check CHECK (jsonb_typeof(snapshot) = 'object'),
  CONSTRAINT school_review_versions_review_number_unique UNIQUE (review_id, version_number)
);
CREATE INDEX IF NOT EXISTS school_review_versions_review_idx
  ON public.school_review_versions (review_id, version_number DESC);

CREATE TABLE IF NOT EXISTS public.school_review_moderation_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.school_reviews (review_id) ON DELETE CASCADE,
  from_status public.school_review_status,
  to_status public.school_review_status NOT NULL,
  reason public.school_review_moderation_reason NOT NULL,
  internal_note text,
  moderator_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_review_moderation_events_note_length_check CHECK (internal_note IS NULL OR length(internal_note) <= 1000)
);
CREATE INDEX IF NOT EXISTS school_review_moderation_events_review_idx
  ON public.school_review_moderation_events (review_id, created_at DESC);
CREATE INDEX IF NOT EXISTS school_review_moderation_events_status_idx
  ON public.school_review_moderation_events (to_status, created_at DESC);

-- La verificación transaccional pertenece a una opinión, no a un lead. El job
-- conserva la infraestructura operativa existente sin crear captación comercial.
ALTER TABLE public.email_jobs
  ADD COLUMN IF NOT EXISTS school_review_id uuid REFERENCES public.school_reviews (review_id) ON DELETE CASCADE;

ALTER TABLE public.email_jobs
  ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE public.email_jobs
  DROP CONSTRAINT IF EXISTS email_jobs_template_key_check,
  DROP CONSTRAINT IF EXISTS email_jobs_job_references_check;

ALTER TABLE public.email_jobs
  ADD CONSTRAINT email_jobs_template_key_check
    CHECK (
      template_key IS NULL OR template_key IN (
        'career_planner_confirmation', 'preppl_waitlist_confirmation',
        'mentorship_request_confirmation', 'mentorship_internal_alert',
        'school_review_verification'
      )
    ),
  ADD CONSTRAINT email_jobs_job_references_check
    CHECK (
      (
        job_type = 'sequence' AND enrollment_id IS NOT NULL AND sequence_step_id IS NOT NULL
        AND lead_id IS NOT NULL AND school_review_id IS NULL
      )
      OR (
        job_type = 'transactional' AND enrollment_id IS NULL AND sequence_step_id IS NULL
        AND template_key IS NOT NULL AND idempotency_key IS NOT NULL
        AND (
          (lead_id IS NOT NULL AND school_review_id IS NULL AND template_key <> 'school_review_verification')
          OR (lead_id IS NULL AND school_review_id IS NOT NULL AND template_key = 'school_review_verification')
        )
      )
    );
CREATE INDEX IF NOT EXISTS email_jobs_school_review_id_idx ON public.email_jobs (school_review_id);

ALTER TABLE public.school_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_review_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_review_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_review_moderation_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.school_reviews, public.school_review_tokens, public.school_review_versions, public.school_review_moderation_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.school_reviews, public.school_review_tokens TO service_role;
GRANT SELECT, INSERT ON public.school_review_versions, public.school_review_moderation_events TO service_role;

COMMENT ON TABLE public.school_reviews IS
  'Opiniones privadas de escuelas. Solo las aprobadas podrán proyectarse públicamente en una fase posterior.';
COMMENT ON COLUMN public.school_reviews.author_email IS
  'Email privado normalizado. Nunca se serializa en DTOs públicos.';
COMMENT ON COLUMN public.school_reviews.author_email_hash IS
  'SHA-256 del email normalizado para deduplicación privada.';
COMMENT ON TABLE public.school_review_tokens IS
  'Tokens opacos de un solo uso; solo se guarda SHA-256, nunca el token plano.';
COMMENT ON TABLE public.school_review_versions IS
  'Historial append-only interno de snapshots de una opinión.';
COMMENT ON TABLE public.school_review_moderation_events IS
  'Historial append-only interno de transiciones de moderación.';

COMMIT;
