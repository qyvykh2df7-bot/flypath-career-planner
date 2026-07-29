-- =============================================================================
-- FlyPath Phase 12A: Content OS PilotFeliu MVP
-- Migration: 20260729120000_create_content_os_pilotfeliu_mvp.sql
--
-- Reuses the existing private public.content_items catalog and adds the three
-- missing operational entities: ideas, calendar events and manual metrics.
-- All access remains server-only through Warhome and service_role.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Shared Content OS constraints and existing content_items extension
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS workspace_key text,
  ADD COLUMN IF NOT EXISTS source_idea_id uuid,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS script text,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS planned_recording_on date,
  ADD COLUMN IF NOT EXISTS planned_publish_on date,
  ADD COLUMN IF NOT EXISTS proposal_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS proposal_status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_status_check;

ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_status_check
    CHECK (status IN (
      'draft',
      'review',
      'production',
      'scheduled',
      'published',
      'archived'
    ));

-- PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS. Each named
-- constraint is guarded so a nominal rerun after an interrupted manual attempt
-- remains safe without masking an incompatible definition.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_workspace_key_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_workspace_key_check
      CHECK (workspace_key IS NULL OR workspace_key = 'pilotfeliu');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_platform_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_platform_check
      CHECK (platform IS NULL OR platform IN ('tiktok_pilotfeliu', 'instagram_pilotfeliu', 'instagram_flypath', 'youtube'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_objective_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_objective_check
      CHECK (objective IS NULL OR objective IN ('growth', 'community', 'authority', 'conversion'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_category_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_category_check
      CHECK (category IS NULL OR category IN ('aviation', 'personal_brand', 'lifestyle', 'sport'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_proposal_source_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_proposal_source_check
      CHECK (proposal_source IN ('manual', 'ai'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_proposal_status_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_proposal_status_check
      CHECK (proposal_status IN ('proposed', 'approved', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_content_os_required_fields_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_content_os_required_fields_check
      CHECK (workspace_key IS NULL OR (platform IS NOT NULL AND objective IS NOT NULL AND hook IS NOT NULL AND length(btrim(hook)) > 0 AND script IS NOT NULL AND length(btrim(script)) > 0 AND cta IS NOT NULL AND length(btrim(cta)) > 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_planned_dates_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_planned_dates_check
      CHECK (planned_recording_on IS NULL OR planned_publish_on IS NULL OR planned_recording_on <= planned_publish_on);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_content_os_lengths_check' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_content_os_lengths_check
      CHECK (workspace_key IS NULL OR (char_length(title) <= 160 AND char_length(hook) <= 1000 AND char_length(script) <= 30000 AND char_length(cta) <= 1000 AND (notes IS NULL OR char_length(notes) <= 10000)));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS content_items_workspace_status_idx
  ON public.content_items (workspace_key, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS content_items_workspace_platform_idx
  ON public.content_items (workspace_key, platform, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS content_items_id_workspace_key_unique
  ON public.content_items (id, workspace_key);

CREATE INDEX IF NOT EXISTS content_items_planned_publish_on_idx
  ON public.content_items (planned_publish_on)
  WHERE workspace_key = 'pilotfeliu';

-- -----------------------------------------------------------------------------
-- B) Idea bank
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  platform text NOT NULL,
  objective text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  proposal_source text NOT NULL DEFAULT 'manual',
  proposal_status text NOT NULL DEFAULT 'approved',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_ideas_title_nonempty_check
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT content_ideas_title_length_check
    CHECK (char_length(title) <= 160),
  CONSTRAINT content_ideas_description_nonempty_check
    CHECK (length(btrim(description)) > 0),
  CONSTRAINT content_ideas_description_length_check
    CHECK (char_length(description) <= 5000),
  CONSTRAINT content_ideas_category_check
    CHECK (category IN ('aviation', 'personal_brand', 'lifestyle', 'sport')),
  CONSTRAINT content_ideas_platform_check
    CHECK (platform IN (
      'tiktok_pilotfeliu',
      'instagram_pilotfeliu',
      'instagram_flypath',
      'youtube'
    )),
  CONSTRAINT content_ideas_objective_check
    CHECK (objective IN ('growth', 'community', 'authority', 'conversion')),
  CONSTRAINT content_ideas_status_check
    CHECK (status IN ('new', 'approved', 'production', 'published', 'discarded')),
  CONSTRAINT content_ideas_proposal_source_check
    CHECK (proposal_source IN ('manual', 'ai')),
  CONSTRAINT content_ideas_proposal_status_check
    CHECK (proposal_status IN ('proposed', 'approved', 'rejected'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_items_source_idea_id_fkey' AND conrelid = 'public.content_items'::regclass) THEN
    ALTER TABLE public.content_items
      ADD CONSTRAINT content_items_source_idea_id_fkey
      FOREIGN KEY (source_idea_id)
      REFERENCES public.content_ideas (id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS content_items_source_idea_unique
  ON public.content_items (source_idea_id)
  WHERE source_idea_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_ideas_status_updated_at_idx
  ON public.content_ideas (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS content_ideas_platform_status_idx
  ON public.content_ideas (platform, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS content_ideas_objective_idx
  ON public.content_ideas (objective);

-- -----------------------------------------------------------------------------
-- C) Editorial calendar
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_key text NOT NULL DEFAULT 'pilotfeliu',
  content_item_id uuid,
  title text NOT NULL,
  event_type text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  notes text,
  proposal_source text NOT NULL DEFAULT 'manual',
  proposal_status text NOT NULL DEFAULT 'approved',
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_calendar_events_title_nonempty_check
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT content_calendar_events_workspace_key_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_calendar_events_content_item_workspace_fkey
    FOREIGN KEY (content_item_id, workspace_key)
    REFERENCES public.content_items (id, workspace_key)
    ON DELETE SET NULL (content_item_id),
  CONSTRAINT content_calendar_events_title_length_check
    CHECK (char_length(title) <= 160),
  CONSTRAINT content_calendar_events_type_check
    CHECK (event_type IN ('record', 'edit', 'publish')),
  CONSTRAINT content_calendar_events_dates_check
    CHECK (ends_at > starts_at),
  CONSTRAINT content_calendar_events_timezone_check
    CHECK (length(btrim(timezone)) > 0),
  CONSTRAINT content_calendar_events_notes_length_check
    CHECK (notes IS NULL OR char_length(notes) <= 5000),
  CONSTRAINT content_calendar_events_proposal_source_check
    CHECK (proposal_source IN ('manual', 'ai')),
  CONSTRAINT content_calendar_events_proposal_status_check
    CHECK (proposal_status IN ('proposed', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS content_calendar_events_starts_at_idx
  ON public.content_calendar_events (starts_at);

CREATE INDEX IF NOT EXISTS content_calendar_events_workspace_starts_at_idx
  ON public.content_calendar_events (workspace_key, starts_at);

CREATE INDEX IF NOT EXISTS content_calendar_events_content_item_idx
  ON public.content_calendar_events (content_item_id, starts_at);

CREATE INDEX IF NOT EXISTS content_calendar_events_proposal_status_idx
  ON public.content_calendar_events (proposal_status, starts_at);

-- -----------------------------------------------------------------------------
-- D) Manual metric snapshots
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id uuid NOT NULL REFERENCES public.content_items (id) ON DELETE CASCADE,
  recorded_on date NOT NULL DEFAULT current_date,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  followers_gained integer NOT NULL DEFAULT 0,
  leads_generated integer NOT NULL DEFAULT 0,
  sales_attributed integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_metrics_nonnegative_check
    CHECK (
      views >= 0
      AND likes >= 0
      AND comments >= 0
      AND shares >= 0
      AND followers_gained >= 0
      AND leads_generated >= 0
      AND sales_attributed >= 0
      AND views <= 1000000000
      AND likes <= 1000000000
      AND comments <= 1000000000
      AND shares <= 1000000000
      AND followers_gained <= 1000000000
      AND leads_generated <= 1000000000
      AND sales_attributed <= 1000000000
    ),
  CONSTRAINT content_metrics_item_day_unique
    UNIQUE (content_item_id, recorded_on)
);

CREATE INDEX IF NOT EXISTS content_metrics_recorded_on_idx
  ON public.content_metrics (recorded_on DESC);

CREATE INDEX IF NOT EXISTS content_metrics_content_item_recorded_idx
  ON public.content_metrics (content_item_id, recorded_on DESC);

-- -----------------------------------------------------------------------------
-- E) updated_at triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_content_os_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_ideas_set_updated_at ON public.content_ideas;
CREATE TRIGGER content_ideas_set_updated_at
  BEFORE UPDATE ON public.content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_os_updated_at();

DROP TRIGGER IF EXISTS content_calendar_events_set_updated_at ON public.content_calendar_events;
CREATE TRIGGER content_calendar_events_set_updated_at
  BEFORE UPDATE ON public.content_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_os_updated_at();

DROP TRIGGER IF EXISTS content_metrics_set_updated_at ON public.content_metrics;
CREATE TRIGGER content_metrics_set_updated_at
  BEFORE UPDATE ON public.content_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_os_updated_at();

-- -----------------------------------------------------------------------------
-- F) Atomic idea promotion
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.promote_content_os_idea(
  p_idea_id uuid,
  p_admin_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  idea public.content_ideas%ROWTYPE;
  existing_item_id uuid;
  new_item_id uuid;
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

  SELECT *
  INTO idea
  FROM public.content_ideas
  WHERE id = p_idea_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'content_os_idea_not_found';
  END IF;

  SELECT id
  INTO existing_item_id
  FROM public.content_items
  WHERE source_idea_id = p_idea_id;

  IF existing_item_id IS NOT NULL THEN
    RETURN existing_item_id;
  END IF;

  IF idea.status = 'discarded' THEN
    RAISE EXCEPTION 'content_os_idea_discarded';
  END IF;

  INSERT INTO public.content_items (
    content_type,
    title,
    summary,
    status,
    visibility,
    workspace_key,
    source_idea_id,
    platform,
    objective,
    category,
    hook,
    script,
    cta,
    notes,
    proposal_source,
    proposal_status,
    created_by,
    updated_by
  )
  VALUES (
    'video',
    idea.title,
    idea.description,
    'draft',
    'internal',
    'pilotfeliu',
    idea.id,
    idea.platform,
    idea.objective,
    idea.category,
    idea.title,
    idea.description,
    'Por definir',
    NULL,
    idea.proposal_source,
    'approved',
    p_admin_user_id,
    p_admin_user_id
  )
  RETURNING id INTO new_item_id;

  UPDATE public.content_ideas
  SET
    status = 'production',
    proposal_status = 'approved',
    updated_by = p_admin_user_id
  WHERE id = p_idea_id;

  RETURN new_item_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- G) Private access
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_ideas FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.content_calendar_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.content_metrics FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_ideas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_calendar_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_metrics TO service_role;

REVOKE ALL ON FUNCTION public.promote_content_os_idea(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_content_os_idea(uuid, uuid)
  TO service_role;

COMMIT;
