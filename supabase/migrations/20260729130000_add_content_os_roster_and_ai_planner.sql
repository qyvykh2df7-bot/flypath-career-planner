-- =============================================================================
-- FlyPath Phase 12A.6.1 + 12A.6.2: Content OS roster and AI planner
-- Migration: 20260729130000_add_content_os_roster_and_ai_planner.sql
--
-- Adds private availability and reviewable AI planning proposals. AI proposals
-- never modify the editorial calendar until an authorized Warhome admin
-- explicitly approves them through the transactional review RPC.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Manual PilotFeliu availability
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_key text NOT NULL DEFAULT 'pilotfeliu',
  availability_type text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  notes text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_availability_slots_workspace_key_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_availability_slots_type_check
    CHECK (availability_type IN ('work', 'rest', 'travel', 'recording_available')),
  CONSTRAINT content_availability_slots_dates_check
    CHECK (ends_at > starts_at AND ends_at <= starts_at + interval '31 days'),
  CONSTRAINT content_availability_slots_timezone_check
    CHECK (timezone = 'Europe/Madrid'),
  CONSTRAINT content_availability_slots_notes_length_check
    CHECK (notes IS NULL OR char_length(notes) <= 5000)
);

CREATE INDEX IF NOT EXISTS content_availability_slots_workspace_starts_at_idx
  ON public.content_availability_slots (workspace_key, starts_at);

CREATE INDEX IF NOT EXISTS content_availability_slots_workspace_type_idx
  ON public.content_availability_slots (workspace_key, availability_type, starts_at);

CREATE OR REPLACE FUNCTION public.enforce_content_os_availability_slot_conflict()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended('content_os_availability:pilotfeliu', 0)
  );

  IF EXISTS (
    SELECT 1
    FROM public.content_availability_slots AS existing_slot
    WHERE existing_slot.workspace_key = NEW.workspace_key
      AND existing_slot.id IS DISTINCT FROM NEW.id
      AND existing_slot.starts_at < NEW.ends_at
      AND existing_slot.ends_at > NEW.starts_at
      AND (
        existing_slot.availability_type = NEW.availability_type
        OR existing_slot.availability_type IN ('work', 'travel')
        OR NEW.availability_type IN ('work', 'travel')
      )
  ) THEN
    RAISE EXCEPTION 'content_os_availability_conflict';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_availability_slots_prevent_conflict
  ON public.content_availability_slots;
CREATE TRIGGER content_availability_slots_prevent_conflict
  BEFORE INSERT OR UPDATE OF availability_type, starts_at, ends_at
  ON public.content_availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_content_os_availability_slot_conflict();

-- -----------------------------------------------------------------------------
-- B) Reviewable AI planning proposals
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_planning_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_key text NOT NULL DEFAULT 'pilotfeliu',
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  summary text NOT NULL,
  model_name text NOT NULL,
  input_hash text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_planning_proposals_workspace_key_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_planning_proposals_period_check
    CHECK (period_end >= period_start AND period_end <= period_start + 13),
  CONSTRAINT content_planning_proposals_status_check
    CHECK (status IN ('proposed', 'approved', 'rejected')),
  CONSTRAINT content_planning_proposals_summary_check
    CHECK (length(btrim(summary)) > 0 AND char_length(summary) <= 5000),
  CONSTRAINT content_planning_proposals_model_name_check
    CHECK (length(btrim(model_name)) > 0 AND char_length(model_name) <= 160),
  CONSTRAINT content_planning_proposals_input_hash_check
    CHECK (input_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT content_planning_proposals_review_check
    CHECK (
      (status = 'proposed' AND reviewed_at IS NULL AND reviewed_by IS NULL)
      OR
      (status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.content_planning_proposal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL
    REFERENCES public.content_planning_proposals (id) ON DELETE CASCADE,
  workspace_key text NOT NULL DEFAULT 'pilotfeliu',
  content_item_id uuid,
  content_idea_id uuid REFERENCES public.content_ideas (id) ON DELETE SET NULL,
  title text NOT NULL,
  event_type text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_planning_proposal_events_workspace_key_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_planning_proposal_events_item_workspace_fkey
    FOREIGN KEY (content_item_id, workspace_key)
    REFERENCES public.content_items (id, workspace_key)
    ON DELETE SET NULL (content_item_id),
  CONSTRAINT content_planning_proposal_events_title_check
    CHECK (length(btrim(title)) > 0 AND char_length(title) <= 160),
  CONSTRAINT content_planning_proposal_events_type_check
    CHECK (event_type IN ('record', 'edit', 'publish')),
  CONSTRAINT content_planning_proposal_events_dates_check
    CHECK (ends_at > starts_at AND ends_at <= starts_at + interval '24 hours'),
  CONSTRAINT content_planning_proposal_events_timezone_check
    CHECK (timezone = 'Europe/Madrid'),
  CONSTRAINT content_planning_proposal_events_notes_length_check
    CHECK (notes IS NULL OR char_length(notes) <= 5000)
);

CREATE INDEX IF NOT EXISTS content_planning_proposals_workspace_generated_idx
  ON public.content_planning_proposals (workspace_key, generated_at DESC);

CREATE INDEX IF NOT EXISTS content_planning_proposals_workspace_status_idx
  ON public.content_planning_proposals (workspace_key, status, generated_at DESC);

CREATE INDEX IF NOT EXISTS content_planning_proposal_events_proposal_starts_idx
  ON public.content_planning_proposal_events (proposal_id, starts_at);

CREATE TABLE IF NOT EXISTS public.content_planning_generation_throttles (
  workspace_key text PRIMARY KEY DEFAULT 'pilotfeliu',
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_planning_generation_throttles_workspace_key_check
    CHECK (workspace_key = 'pilotfeliu')
);

ALTER TABLE public.content_calendar_events
  ADD COLUMN IF NOT EXISTS source_proposal_event_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'content_calendar_events_source_proposal_event_fkey'
      AND conrelid = 'public.content_calendar_events'::regclass
  ) THEN
    ALTER TABLE public.content_calendar_events
      ADD CONSTRAINT content_calendar_events_source_proposal_event_fkey
      FOREIGN KEY (source_proposal_event_id)
      REFERENCES public.content_planning_proposal_events (id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS content_calendar_events_source_proposal_event_unique
  ON public.content_calendar_events (source_proposal_event_id)
  WHERE source_proposal_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_content_os_ai_calendar_event_conflict()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended('content_os_calendar:pilotfeliu', 0)
  );

  IF NEW.proposal_source = 'ai' AND EXISTS (
    SELECT 1
    FROM public.content_calendar_events AS existing_event
    WHERE existing_event.workspace_key = NEW.workspace_key
      AND existing_event.id IS DISTINCT FROM NEW.id
      AND existing_event.starts_at < NEW.ends_at
      AND existing_event.ends_at > NEW.starts_at
  ) THEN
    RAISE EXCEPTION 'content_os_proposal_calendar_conflict';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_calendar_events_prevent_ai_conflict
  ON public.content_calendar_events;
CREATE TRIGGER content_calendar_events_prevent_ai_conflict
  BEFORE INSERT OR UPDATE OF workspace_key, starts_at, ends_at, proposal_source
  ON public.content_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_content_os_ai_calendar_event_conflict();

-- -----------------------------------------------------------------------------
-- C) updated_at triggers
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS content_availability_slots_set_updated_at
  ON public.content_availability_slots;
CREATE TRIGGER content_availability_slots_set_updated_at
  BEFORE UPDATE ON public.content_availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_os_updated_at();

DROP TRIGGER IF EXISTS content_planning_proposals_set_updated_at
  ON public.content_planning_proposals;
CREATE TRIGGER content_planning_proposals_set_updated_at
  BEFORE UPDATE ON public.content_planning_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_os_updated_at();

-- -----------------------------------------------------------------------------
-- D) Atomic proposal creation
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_content_os_planning_generation(
  p_admin_user_id uuid,
  p_min_interval_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  claimed_at timestamptz;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = p_admin_user_id
      AND is_active = true
      AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'content_os_admin_required';
  END IF;

  IF p_min_interval_seconds < 15 OR p_min_interval_seconds > 3600 THEN
    RAISE EXCEPTION 'content_os_planner_interval_invalid';
  END IF;

  INSERT INTO public.content_planning_generation_throttles (
    workspace_key,
    last_requested_at,
    requested_by
  )
  VALUES (
    'pilotfeliu',
    now(),
    p_admin_user_id
  )
  ON CONFLICT (workspace_key) DO UPDATE
  SET
    last_requested_at = EXCLUDED.last_requested_at,
    requested_by = EXCLUDED.requested_by
  WHERE public.content_planning_generation_throttles.last_requested_at
    <= now() - make_interval(secs => p_min_interval_seconds)
  RETURNING last_requested_at INTO claimed_at;

  IF claimed_at IS NULL THEN
    RAISE EXCEPTION 'content_os_planner_rate_limited';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_content_os_planning_proposal(
  p_admin_user_id uuid,
  p_period_start date,
  p_period_end date,
  p_summary text,
  p_model_name text,
  p_input_hash text,
  p_suggestions jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_proposal_id uuid;
  suggestion jsonb;
  suggestion_item_id uuid;
  suggestion_idea_id uuid;
  suggestion_starts_at timestamptz;
  suggestion_ends_at timestamptz;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = p_admin_user_id
      AND is_active = true
      AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'content_os_admin_required';
  END IF;

  IF p_period_end < p_period_start OR p_period_end > p_period_start + 13 THEN
    RAISE EXCEPTION 'content_os_proposal_period_invalid';
  END IF;

  IF length(btrim(p_summary)) = 0 OR char_length(p_summary) > 5000
    OR length(btrim(p_model_name)) = 0 OR char_length(p_model_name) > 160
    OR COALESCE(p_input_hash, '') !~ '^[0-9a-f]{64}$'
    OR jsonb_typeof(p_suggestions) <> 'array'
    OR jsonb_array_length(p_suggestions) < 1
    OR jsonb_array_length(p_suggestions) > 30
  THEN
    RAISE EXCEPTION 'content_os_proposal_invalid';
  END IF;

  INSERT INTO public.content_planning_proposals (
    workspace_key,
    period_start,
    period_end,
    status,
    summary,
    model_name,
    input_hash,
    created_by
  )
  VALUES (
    'pilotfeliu',
    p_period_start,
    p_period_end,
    'proposed',
    btrim(p_summary),
    btrim(p_model_name),
    p_input_hash,
    p_admin_user_id
  )
  RETURNING id INTO new_proposal_id;

  FOR suggestion IN SELECT value FROM jsonb_array_elements(p_suggestions)
  LOOP
    BEGIN
      suggestion_item_id := NULLIF(suggestion->>'content_item_id', '')::uuid;
      suggestion_idea_id := NULLIF(suggestion->>'content_idea_id', '')::uuid;
      suggestion_starts_at := (suggestion->>'starts_at')::timestamptz;
      suggestion_ends_at := (suggestion->>'ends_at')::timestamptz;
    EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow THEN
      RAISE EXCEPTION 'content_os_proposal_event_invalid';
    END;

    IF jsonb_typeof(suggestion) <> 'object'
      OR length(btrim(COALESCE(suggestion->>'title', ''))) = 0
      OR char_length(suggestion->>'title') > 160
      OR COALESCE(suggestion->>'event_type', '') NOT IN ('record', 'edit', 'publish')
      OR (suggestion_item_id IS NULL AND suggestion_idea_id IS NULL)
      OR suggestion_ends_at <= suggestion_starts_at
      OR suggestion_ends_at > suggestion_starts_at + interval '24 hours'
      OR (suggestion_starts_at AT TIME ZONE 'Europe/Madrid')::date < p_period_start
      OR (suggestion_starts_at AT TIME ZONE 'Europe/Madrid')::date > p_period_end
      OR char_length(COALESCE(suggestion->>'notes', '')) > 5000
    THEN
      RAISE EXCEPTION 'content_os_proposal_event_invalid';
    END IF;

    IF suggestion_item_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.content_items
      WHERE id = suggestion_item_id
        AND workspace_key = 'pilotfeliu'
    ) THEN
      RAISE EXCEPTION 'content_os_proposal_item_invalid';
    END IF;

    IF suggestion_idea_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM public.content_ideas
      WHERE id = suggestion_idea_id
        AND status <> 'discarded'
    ) THEN
      RAISE EXCEPTION 'content_os_proposal_idea_invalid';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.content_planning_proposal_events AS existing_event
      WHERE existing_event.proposal_id = new_proposal_id
        AND existing_event.starts_at < suggestion_ends_at
        AND existing_event.ends_at > suggestion_starts_at
    ) THEN
      RAISE EXCEPTION 'content_os_proposal_event_conflict';
    END IF;

    INSERT INTO public.content_planning_proposal_events (
      proposal_id,
      workspace_key,
      content_item_id,
      content_idea_id,
      title,
      event_type,
      starts_at,
      ends_at,
      timezone,
      notes
    )
    VALUES (
      new_proposal_id,
      'pilotfeliu',
      suggestion_item_id,
      suggestion_idea_id,
      btrim(suggestion->>'title'),
      suggestion->>'event_type',
      suggestion_starts_at,
      suggestion_ends_at,
      'Europe/Madrid',
      NULLIF(btrim(COALESCE(suggestion->>'notes', '')), '')
    );
  END LOOP;

  RETURN new_proposal_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- E) Atomic and idempotent manual review
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_content_os_planning_proposal(
  p_proposal_id uuid,
  p_admin_user_id uuid,
  p_decision text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  proposal public.content_planning_proposals%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = p_admin_user_id
      AND is_active = true
      AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'content_os_admin_required';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'content_os_proposal_decision_invalid';
  END IF;

  SELECT *
  INTO proposal
  FROM public.content_planning_proposals
  WHERE id = p_proposal_id
    AND workspace_key = 'pilotfeliu'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'content_os_proposal_not_found';
  END IF;

  IF proposal.status = p_decision THEN
    RETURN proposal.id;
  END IF;

  IF proposal.status <> 'proposed' THEN
    RAISE EXCEPTION 'content_os_proposal_already_reviewed';
  END IF;

  IF p_decision = 'approved' THEN
    PERFORM pg_advisory_xact_lock(
      hashtextextended('content_os_calendar:pilotfeliu', 0)
    );

    IF EXISTS (
      SELECT 1
      FROM public.content_planning_proposal_events AS first_event
      JOIN public.content_planning_proposal_events AS second_event
        ON second_event.proposal_id = first_event.proposal_id
        AND second_event.id > first_event.id
        AND second_event.starts_at < first_event.ends_at
        AND second_event.ends_at > first_event.starts_at
      WHERE first_event.proposal_id = proposal.id
    ) THEN
      RAISE EXCEPTION 'content_os_proposal_event_conflict';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.content_planning_proposal_events AS proposal_event
      JOIN public.content_calendar_events AS calendar_event
        ON calendar_event.workspace_key = proposal_event.workspace_key
        AND calendar_event.starts_at < proposal_event.ends_at
        AND calendar_event.ends_at > proposal_event.starts_at
      WHERE proposal_event.proposal_id = proposal.id
    ) THEN
      RAISE EXCEPTION 'content_os_proposal_calendar_conflict';
    END IF;

    INSERT INTO public.content_calendar_events (
      workspace_key,
      content_item_id,
      title,
      event_type,
      starts_at,
      ends_at,
      timezone,
      notes,
      proposal_source,
      proposal_status,
      source_proposal_event_id,
      created_by,
      updated_by
    )
    SELECT
      event.workspace_key,
      event.content_item_id,
      event.title,
      event.event_type,
      event.starts_at,
      event.ends_at,
      event.timezone,
      event.notes,
      'ai',
      'approved',
      event.id,
      p_admin_user_id,
      p_admin_user_id
    FROM public.content_planning_proposal_events AS event
    WHERE event.proposal_id = proposal.id
    ON CONFLICT (source_proposal_event_id) WHERE source_proposal_event_id IS NOT NULL
    DO NOTHING;
  END IF;

  UPDATE public.content_planning_proposals
  SET
    status = p_decision,
    reviewed_at = now(),
    reviewed_by = p_admin_user_id
  WHERE id = proposal.id;

  RETURN proposal.id;
END;
$$;

-- -----------------------------------------------------------------------------
-- F) Private access
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_planning_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_planning_proposal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_planning_generation_throttles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_availability_slots FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.content_planning_proposals FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.content_planning_proposal_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.content_planning_generation_throttles FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_availability_slots TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_planning_proposals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_planning_proposal_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_planning_generation_throttles TO service_role;

REVOKE ALL ON FUNCTION public.claim_content_os_planning_generation(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_content_os_planning_generation(uuid, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_content_os_planning_proposal(
  uuid, date, date, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_content_os_planning_proposal(
  uuid, date, date, text, text, text, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.review_content_os_planning_proposal(
  uuid, uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_content_os_planning_proposal(
  uuid, uuid, text
) TO service_role;

COMMIT;
