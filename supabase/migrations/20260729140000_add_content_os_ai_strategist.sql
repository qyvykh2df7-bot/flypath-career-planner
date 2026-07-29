-- =============================================================================
-- FlyPath Phase 12A.6.3: Content OS AI Content Strategist MVP
-- Migration: 20260729140000_add_content_os_ai_strategist.sql
--
-- Extends the private idea bank with structured, reviewable AI strategy
-- proposals. Generated proposals never reach the planner or calendar until an
-- authorized Warhome admin explicitly approves them.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Structured strategy metadata on the existing private idea bank
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_ideas
  ADD COLUMN IF NOT EXISTS strategy_idea text,
  ADD COLUMN IF NOT EXISTS strategy_hook text,
  ADD COLUMN IF NOT EXISTS strategy_platforms text[],
  ADD COLUMN IF NOT EXISTS strategy_format text,
  ADD COLUMN IF NOT EXISTS strategy_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS strategy_product_key text,
  ADD COLUMN IF NOT EXISTS strategy_cta text,
  ADD COLUMN IF NOT EXISTS strategy_priority text,
  ADD COLUMN IF NOT EXISTS strategy_pillar text,
  ADD COLUMN IF NOT EXISTS strategy_model_name text,
  ADD COLUMN IF NOT EXISTS strategy_input_hash text,
  ADD COLUMN IF NOT EXISTS strategy_fingerprint text,
  ADD COLUMN IF NOT EXISTS strategy_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS strategy_reviewed_by uuid
    REFERENCES auth.users (id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'content_ideas_strategy_fields_check'
      AND conrelid = 'public.content_ideas'::regclass
  ) THEN
    ALTER TABLE public.content_ideas
      ADD CONSTRAINT content_ideas_strategy_fields_check
      CHECK (
        proposal_source = 'manual'
        OR (
          length(btrim(strategy_idea)) > 0
          AND char_length(strategy_idea) <= 2000
          AND length(btrim(strategy_hook)) > 0
          AND char_length(strategy_hook) <= 1000
          AND strategy_platforms IS NOT NULL
          AND cardinality(strategy_platforms) BETWEEN 1 AND 4
          AND strategy_platforms <@ ARRAY[
            'tiktok_pilotfeliu',
            'instagram_pilotfeliu',
            'instagram_flypath',
            'youtube'
          ]::text[]
          AND strategy_format IN (
            'talking_head',
            'story',
            'tutorial',
            'list',
            'opinion',
            'comparison'
          )
          AND strategy_duration_seconds BETWEEN 15 AND 3600
          AND (
            strategy_product_key IS NULL
            OR strategy_product_key IN (
              'guide',
              'career_planner',
              'aerocomms',
              'mentorships'
            )
          )
          AND length(btrim(strategy_cta)) > 0
          AND char_length(strategy_cta) <= 1000
          AND strategy_priority IN ('high', 'medium', 'low')
          AND length(btrim(strategy_pillar)) > 0
          AND char_length(strategy_pillar) <= 100
          AND length(btrim(strategy_model_name)) > 0
          AND char_length(strategy_model_name) <= 160
          AND strategy_input_hash ~ '^[0-9a-f]{64}$'
          AND strategy_fingerprint ~ '^[0-9a-f]{64}$'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'content_ideas_strategy_review_check'
      AND conrelid = 'public.content_ideas'::regclass
  ) THEN
    ALTER TABLE public.content_ideas
      ADD CONSTRAINT content_ideas_strategy_review_check
      CHECK (
        proposal_source = 'manual'
        OR (
          (proposal_status = 'proposed'
            AND strategy_reviewed_at IS NULL
            AND strategy_reviewed_by IS NULL)
          OR
          (proposal_status IN ('approved', 'rejected')
            AND strategy_reviewed_at IS NOT NULL
            AND strategy_reviewed_by IS NOT NULL)
        )
      );
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS content_ideas_strategy_fingerprint_unique
  ON public.content_ideas (strategy_fingerprint)
  WHERE strategy_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_ideas_strategy_review_queue_idx
  ON public.content_ideas (proposal_status, created_at DESC)
  WHERE proposal_source = 'ai';

-- -----------------------------------------------------------------------------
-- B) Independent generation throttle
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_strategy_generation_throttles (
  workspace_key text PRIMARY KEY,
  last_requested_at timestamptz NOT NULL,
  requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT content_strategy_generation_throttles_workspace_check
    CHECK (workspace_key = 'pilotfeliu')
);

CREATE OR REPLACE FUNCTION public.claim_content_os_strategy_generation(
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
    RAISE EXCEPTION 'content_os_strategist_interval_invalid';
  END IF;

  INSERT INTO public.content_strategy_generation_throttles (
    workspace_key,
    last_requested_at,
    requested_by
  )
  VALUES ('pilotfeliu', now(), p_admin_user_id)
  ON CONFLICT (workspace_key) DO UPDATE
  SET
    last_requested_at = EXCLUDED.last_requested_at,
    requested_by = EXCLUDED.requested_by
  WHERE public.content_strategy_generation_throttles.last_requested_at
    <= now() - make_interval(secs => p_min_interval_seconds)
  RETURNING last_requested_at INTO claimed_at;

  IF claimed_at IS NULL THEN
    RAISE EXCEPTION 'content_os_strategist_rate_limited';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- C) Atomic proposal persistence with basic duplicate protection
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_content_os_strategy_proposals(
  p_admin_user_id uuid,
  p_model_name text,
  p_input_hash text,
  p_suggestions jsonb
)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  suggestion jsonb;
  suggestion_platforms text[];
  suggestion_product text;
  normalized_title text;
  new_idea_id uuid;
  new_idea_ids uuid[] := ARRAY[]::uuid[];
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

  IF length(btrim(COALESCE(p_model_name, ''))) = 0
    OR char_length(p_model_name) > 160
    OR COALESCE(p_input_hash, '') !~ '^[0-9a-f]{64}$'
    OR jsonb_typeof(p_suggestions) <> 'array'
    OR jsonb_array_length(p_suggestions) <> 10
  THEN
    RAISE EXCEPTION 'content_os_strategy_invalid';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('content_os_strategy:pilotfeliu', 0)
  );

  FOR suggestion IN SELECT value FROM jsonb_array_elements(p_suggestions)
  LOOP
    IF jsonb_typeof(suggestion) <> 'object'
      OR jsonb_typeof(suggestion->'platforms') <> 'array'
    THEN
      RAISE EXCEPTION 'content_os_strategy_suggestion_invalid';
    END IF;

    suggestion_platforms := ARRAY(
      SELECT jsonb_array_elements_text(suggestion->'platforms')
    );
    suggestion_product := NULLIF(btrim(COALESCE(suggestion->>'product_key', '')), '');
    normalized_title := lower(
      regexp_replace(btrim(COALESCE(suggestion->>'title', '')), '\s+', ' ', 'g')
    );

    IF length(normalized_title) = 0
      OR char_length(suggestion->>'title') > 160
      OR length(btrim(COALESCE(suggestion->>'idea', ''))) = 0
      OR char_length(suggestion->>'idea') > 2000
      OR length(btrim(COALESCE(suggestion->>'hook', ''))) = 0
      OR char_length(suggestion->>'hook') > 1000
      OR length(btrim(COALESCE(suggestion->>'explanation', ''))) = 0
      OR char_length(suggestion->>'explanation') > 5000
      OR cardinality(suggestion_platforms) NOT BETWEEN 1 AND 4
      OR cardinality(suggestion_platforms) <> (
        SELECT count(DISTINCT platform)
        FROM unnest(suggestion_platforms) AS platform
      )
      OR NOT suggestion_platforms <@ ARRAY[
        'tiktok_pilotfeliu',
        'instagram_pilotfeliu',
        'instagram_flypath',
        'youtube'
      ]::text[]
      OR COALESCE(suggestion->>'format', '') NOT IN (
        'talking_head',
        'story',
        'tutorial',
        'list',
        'opinion',
        'comparison'
      )
      OR COALESCE(suggestion->>'duration_seconds', '') !~ '^\d+$'
      OR (suggestion->>'duration_seconds')::integer NOT BETWEEN 15 AND 3600
      OR COALESCE(suggestion->>'objective', '') NOT IN (
        'growth',
        'community',
        'authority',
        'conversion'
      )
      OR (
        suggestion_product IS NOT NULL
        AND suggestion_product NOT IN (
          'guide',
          'career_planner',
          'aerocomms',
          'mentorships'
        )
      )
      OR length(btrim(COALESCE(suggestion->>'cta', ''))) = 0
      OR char_length(suggestion->>'cta') > 1000
      OR COALESCE(suggestion->>'priority', '') NOT IN ('high', 'medium', 'low')
      OR COALESCE(suggestion->>'pillar', '') NOT IN (
        'pilot_life',
        'aviation_career',
        'training',
        'schools_and_decisions',
        'common_mistakes',
        'professional_advice',
        'aviation_english',
        'atc_phraseology',
        'personal_stories',
        'community',
        'product_sales'
      )
      OR COALESCE(suggestion->>'fingerprint', '') !~ '^[0-9a-f]{64}$'
    THEN
      RAISE EXCEPTION 'content_os_strategy_suggestion_invalid';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.content_ideas AS idea
      WHERE lower(regexp_replace(btrim(idea.title), '\s+', ' ', 'g'))
        = normalized_title
    ) OR EXISTS (
      SELECT 1
      FROM public.content_items AS item
      WHERE item.workspace_key = 'pilotfeliu'
        AND lower(regexp_replace(btrim(item.title), '\s+', ' ', 'g'))
          = normalized_title
    ) THEN
      RAISE EXCEPTION 'content_os_strategy_duplicate';
    END IF;

    INSERT INTO public.content_ideas (
      title,
      description,
      category,
      platform,
      objective,
      status,
      proposal_source,
      proposal_status,
      strategy_idea,
      strategy_hook,
      strategy_platforms,
      strategy_format,
      strategy_duration_seconds,
      strategy_product_key,
      strategy_cta,
      strategy_priority,
      strategy_pillar,
      strategy_model_name,
      strategy_input_hash,
      strategy_fingerprint,
      created_by,
      updated_by
    )
    VALUES (
      btrim(suggestion->>'title'),
      btrim(suggestion->>'explanation'),
      CASE
        WHEN suggestion->>'pillar' IN ('personal_stories', 'community')
          THEN 'personal_brand'
        ELSE 'aviation'
      END,
      suggestion_platforms[1],
      suggestion->>'objective',
      'new',
      'ai',
      'proposed',
      btrim(suggestion->>'idea'),
      btrim(suggestion->>'hook'),
      suggestion_platforms,
      suggestion->>'format',
      (suggestion->>'duration_seconds')::integer,
      suggestion_product,
      btrim(suggestion->>'cta'),
      suggestion->>'priority',
      suggestion->>'pillar',
      btrim(p_model_name),
      p_input_hash,
      suggestion->>'fingerprint',
      p_admin_user_id,
      p_admin_user_id
    )
    RETURNING id INTO new_idea_id;

    new_idea_ids := array_append(new_idea_ids, new_idea_id);
  END LOOP;

  RETURN new_idea_ids;
END;
$$;

-- -----------------------------------------------------------------------------
-- D) Atomic and idempotent human review
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.review_content_os_strategy_proposal(
  p_idea_id uuid,
  p_admin_user_id uuid,
  p_decision text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  idea public.content_ideas%ROWTYPE;
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
    RAISE EXCEPTION 'content_os_strategy_review_invalid';
  END IF;

  SELECT *
  INTO idea
  FROM public.content_ideas
  WHERE id = p_idea_id
    AND proposal_source = 'ai'
    AND strategy_model_name IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'content_os_strategy_review_invalid';
  END IF;

  IF idea.proposal_status = p_decision THEN
    RETURN idea.id;
  END IF;

  IF idea.proposal_status <> 'proposed' THEN
    RAISE EXCEPTION 'content_os_strategy_review_invalid';
  END IF;

  UPDATE public.content_ideas
  SET
    proposal_status = p_decision,
    status = CASE WHEN p_decision = 'approved' THEN 'new' ELSE 'discarded' END,
    strategy_reviewed_at = now(),
    strategy_reviewed_by = p_admin_user_id,
    updated_by = p_admin_user_id
  WHERE id = idea.id;

  RETURN idea.id;
END;
$$;

-- Pending AI proposals must never bypass review through idea promotion.
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

  IF idea.proposal_status <> 'approved' THEN
    RAISE EXCEPTION 'content_os_idea_not_approved';
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
    COALESCE(idea.strategy_hook, idea.title),
    COALESCE(idea.strategy_idea, idea.description),
    COALESCE(idea.strategy_cta, 'Por definir'),
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
-- E) Private access
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_strategy_generation_throttles
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_strategy_generation_throttles
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.content_strategy_generation_throttles TO service_role;

REVOKE ALL ON FUNCTION public.claim_content_os_strategy_generation(uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_content_os_strategy_generation(uuid, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_content_os_strategy_proposals(
  uuid, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_content_os_strategy_proposals(
  uuid, text, text, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.review_content_os_strategy_proposal(
  uuid, uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_content_os_strategy_proposal(
  uuid, uuid, text
) TO service_role;

REVOKE ALL ON FUNCTION public.promote_content_os_idea(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_content_os_idea(uuid, uuid)
  TO service_role;

COMMIT;
