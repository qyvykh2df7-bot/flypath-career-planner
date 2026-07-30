BEGIN;

-- 12A.8 keeps TikTok credentials and imported drafts private to PilotFeliu.
-- Tokens are encrypted by the application before reaching PostgreSQL.

CREATE TABLE IF NOT EXISTS public.content_tiktok_connections (
  workspace_key text PRIMARY KEY,
  tiktok_open_id text NOT NULL,
  tiktok_union_id text,
  display_name text NOT NULL,
  avatar_url text,
  scopes text[] NOT NULL,
  access_token_ciphertext text NOT NULL,
  refresh_token_ciphertext text NOT NULL,
  token_key_version integer NOT NULL DEFAULT 1,
  access_token_expires_at timestamptz NOT NULL,
  refresh_token_expires_at timestamptz NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz,
  last_sync_status text NOT NULL DEFAULT 'never',
  last_sync_error_code text,
  sync_lock_id text,
  sync_lock_until timestamptz,
  token_refresh_lock_id text,
  token_refresh_lock_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_tiktok_connections_workspace_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_tiktok_connections_identity_check
    CHECK (
      char_length(tiktok_open_id) BETWEEN 1 AND 255
      AND (tiktok_union_id IS NULL OR char_length(tiktok_union_id) <= 255)
      AND char_length(display_name) BETWEEN 1 AND 255
      AND (avatar_url IS NULL OR char_length(avatar_url) <= 2000)
    ),
  CONSTRAINT content_tiktok_connections_token_check
    CHECK (
      char_length(access_token_ciphertext) BETWEEN 20 AND 10000
      AND char_length(refresh_token_ciphertext) BETWEEN 20 AND 10000
      AND token_key_version = 1
      AND access_token_expires_at > connected_at - interval '5 minutes'
      AND refresh_token_expires_at > connected_at
    ),
  CONSTRAINT content_tiktok_connections_scopes_check
    CHECK (
      cardinality(scopes) BETWEEN 2 AND 20
      AND scopes @> ARRAY['user.info.basic', 'video.list']::text[]
    ),
  CONSTRAINT content_tiktok_connections_sync_status_check
    CHECK (last_sync_status IN ('never', 'succeeded', 'partial', 'failed')),
  CONSTRAINT content_tiktok_connections_sync_error_check
    CHECK (
      (last_sync_status IN ('never', 'succeeded') AND last_sync_error_code IS NULL)
      OR (
        last_sync_status IN ('partial', 'failed')
        AND last_sync_error_code IS NOT NULL
        AND char_length(last_sync_error_code) <= 100
      )
    ),
  CONSTRAINT content_tiktok_connections_lock_pair_check
    CHECK (
      (sync_lock_id IS NULL AND sync_lock_until IS NULL)
      OR (
        sync_lock_id IS NOT NULL
        AND char_length(sync_lock_id) BETWEEN 16 AND 100
        AND sync_lock_until IS NOT NULL
      )
    ),
  CONSTRAINT content_tiktok_connections_token_lock_pair_check
    CHECK (
      (token_refresh_lock_id IS NULL AND token_refresh_lock_until IS NULL)
      OR (
        token_refresh_lock_id IS NOT NULL
        AND char_length(token_refresh_lock_id) BETWEEN 16 AND 100
        AND token_refresh_lock_until IS NOT NULL
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS content_tiktok_connections_open_id_uidx
  ON public.content_tiktok_connections (tiktok_open_id);

CREATE TABLE IF NOT EXISTS public.content_tiktok_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_key text NOT NULL DEFAULT 'pilotfeliu',
  tiktok_video_id text NOT NULL,
  share_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}'::text[],
  duration_seconds integer,
  published_at timestamptz NOT NULL,
  views integer,
  likes integer,
  comments integer,
  shares integer,
  saves integer,
  import_source text NOT NULL,
  metrics_source text NOT NULL,
  analysis_status text NOT NULL DEFAULT 'pending_analysis',
  analysis_title text,
  analysis_summary text,
  analysis_hook text,
  analysis_pillar text,
  analysis_objective text,
  analysis_related_product_key text,
  analysis_model_name text,
  analyzed_at timestamptz,
  analysis_attempt_count integer NOT NULL DEFAULT 0,
  analysis_last_failed_at timestamptz,
  analysis_next_retry_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_tiktok_videos_workspace_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_tiktok_videos_provider_check
    CHECK (
      char_length(tiktok_video_id) BETWEEN 1 AND 255
      AND char_length(share_url) BETWEEN 1 AND 2000
      AND share_url ~ '^https://'
      AND char_length(caption) <= 5000
      AND cardinality(hashtags) <= 50
      AND (duration_seconds IS NULL OR duration_seconds BETWEEN 1 AND 36000)
    ),
  CONSTRAINT content_tiktok_videos_metrics_check
    CHECK (
      (views IS NULL OR views BETWEEN 0 AND 1000000000)
      AND (likes IS NULL OR likes BETWEEN 0 AND 1000000000)
      AND (comments IS NULL OR comments BETWEEN 0 AND 1000000000)
      AND (shares IS NULL OR shares BETWEEN 0 AND 1000000000)
      AND (saves IS NULL OR saves BETWEEN 0 AND 1000000000)
    ),
  CONSTRAINT content_tiktok_videos_import_source_check
    CHECK (import_source IN ('api', 'manual_url')),
  CONSTRAINT content_tiktok_videos_metrics_source_check
    CHECK (metrics_source IN ('api', 'manual', 'mixed')),
  CONSTRAINT content_tiktok_videos_analysis_status_check
    CHECK (
      analysis_status IN (
        'pending_analysis',
        'pending_review',
        'confirmed',
        'rejected',
        'failed'
      )
    ),
  CONSTRAINT content_tiktok_videos_analysis_retry_check
    CHECK (
      analysis_attempt_count BETWEEN 0 AND 3
      AND (
        analysis_last_failed_at IS NULL
        OR analysis_status = 'failed'
      )
      AND (
        analysis_next_retry_at IS NULL
        OR analysis_status = 'failed'
      )
    ),
  CONSTRAINT content_tiktok_videos_analysis_fields_check
    CHECK (
      (analysis_title IS NULL OR char_length(analysis_title) <= 160)
      AND (analysis_summary IS NULL OR char_length(analysis_summary) <= 5000)
      AND (analysis_hook IS NULL OR char_length(analysis_hook) <= 1000)
      AND (
        analysis_pillar IS NULL
        OR analysis_pillar IN (
          'pilot_life',
          'aviation_career',
          'training',
          'personal_stories',
          'aviation_english',
          'product_sales'
        )
      )
      AND (
        analysis_objective IS NULL
        OR analysis_objective IN (
          'growth',
          'authority',
          'community',
          'conversion'
        )
      )
      AND (
        analysis_related_product_key IS NULL
        OR analysis_related_product_key IN (
          'guide',
          'career_planner',
          'aerocomms',
          'mentorships'
        )
      )
      AND (analysis_model_name IS NULL OR char_length(analysis_model_name) <= 100)
    ),
  CONSTRAINT content_tiktok_videos_review_state_check
    CHECK (
      (
        analysis_status IN ('pending_analysis', 'failed')
        AND reviewed_at IS NULL
        AND reviewed_by IS NULL
        AND content_item_id IS NULL
      )
      OR (
        analysis_status = 'pending_review'
        AND analysis_title IS NOT NULL
        AND analysis_summary IS NOT NULL
        AND analysis_hook IS NOT NULL
        AND analysis_pillar IS NOT NULL
        AND analysis_objective IS NOT NULL
        AND analysis_model_name IS NOT NULL
        AND analyzed_at IS NOT NULL
        AND reviewed_at IS NULL
        AND reviewed_by IS NULL
        AND content_item_id IS NULL
      )
      OR (
        analysis_status = 'confirmed'
        AND reviewed_at IS NOT NULL
        AND reviewed_by IS NOT NULL
        AND content_item_id IS NOT NULL
      )
      OR (
        analysis_status = 'rejected'
        AND reviewed_at IS NOT NULL
        AND reviewed_by IS NOT NULL
        AND content_item_id IS NULL
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS content_tiktok_videos_workspace_video_uidx
  ON public.content_tiktok_videos (workspace_key, tiktok_video_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_tiktok_videos_content_item_uidx
  ON public.content_tiktok_videos (content_item_id)
  WHERE content_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS content_tiktok_videos_review_queue_idx
  ON public.content_tiktok_videos (
    workspace_key,
    analysis_status,
    published_at DESC
  );

DROP TRIGGER IF EXISTS set_content_tiktok_connections_updated_at
  ON public.content_tiktok_connections;
CREATE TRIGGER set_content_tiktok_connections_updated_at
BEFORE UPDATE ON public.content_tiktok_connections
FOR EACH ROW
EXECUTE FUNCTION public.set_content_os_updated_at();

DROP TRIGGER IF EXISTS set_content_tiktok_videos_updated_at
  ON public.content_tiktok_videos;
CREATE TRIGGER set_content_tiktok_videos_updated_at
BEFORE UPDATE ON public.content_tiktok_videos
FOR EACH ROW
EXECUTE FUNCTION public.set_content_os_updated_at();

CREATE OR REPLACE FUNCTION public.upsert_content_os_tiktok_connection(
  p_admin_user_id uuid,
  p_tiktok_open_id text,
  p_tiktok_union_id text,
  p_display_name text,
  p_avatar_url text,
  p_scopes text[],
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamptz,
  p_refresh_token_expires_at timestamptz
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  IF length(btrim(p_tiktok_open_id)) NOT BETWEEN 1 AND 255
    OR length(btrim(p_display_name)) NOT BETWEEN 1 AND 255
    OR p_scopes IS NULL
    OR NOT p_scopes @> ARRAY['user.info.basic', 'video.list']::text[]
    OR length(p_access_token_ciphertext) NOT BETWEEN 20 AND 10000
    OR length(p_refresh_token_ciphertext) NOT BETWEEN 20 AND 10000
    OR p_access_token_expires_at <= now() - interval '5 minutes'
    OR p_refresh_token_expires_at <= now()
  THEN
    RAISE EXCEPTION 'content_os_tiktok_connection_invalid';
  END IF;

  INSERT INTO public.content_tiktok_connections (
    workspace_key,
    tiktok_open_id,
    tiktok_union_id,
    display_name,
    avatar_url,
    scopes,
    access_token_ciphertext,
    refresh_token_ciphertext,
    access_token_expires_at,
    refresh_token_expires_at,
    connected_at,
    last_synced_at,
    last_sync_status,
    last_sync_error_code
  )
  VALUES (
    'pilotfeliu',
    btrim(p_tiktok_open_id),
    NULLIF(btrim(p_tiktok_union_id), ''),
    btrim(p_display_name),
    NULLIF(btrim(p_avatar_url), ''),
    ARRAY(SELECT DISTINCT unnest(p_scopes)),
    p_access_token_ciphertext,
    p_refresh_token_ciphertext,
    p_access_token_expires_at,
    p_refresh_token_expires_at,
    now(),
    NULL,
    'never',
    NULL
  )
  ON CONFLICT (workspace_key) DO UPDATE
  SET
    tiktok_open_id = EXCLUDED.tiktok_open_id,
    tiktok_union_id = EXCLUDED.tiktok_union_id,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    scopes = EXCLUDED.scopes,
    access_token_ciphertext = EXCLUDED.access_token_ciphertext,
    refresh_token_ciphertext = EXCLUDED.refresh_token_ciphertext,
    access_token_expires_at = EXCLUDED.access_token_expires_at,
    refresh_token_expires_at = EXCLUDED.refresh_token_expires_at,
    connected_at = now(),
    last_synced_at = NULL,
    last_sync_status = 'never',
    last_sync_error_code = NULL,
    sync_lock_id = NULL,
    sync_lock_until = NULL,
    token_refresh_lock_id = NULL,
    token_refresh_lock_until = NULL;

  RETURN 'pilotfeliu';
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_content_os_tiktok_video(
  p_admin_user_id uuid,
  p_tiktok_video_id text,
  p_share_url text,
  p_caption text,
  p_hashtags text[],
  p_duration_seconds integer,
  p_published_at timestamptz,
  p_views integer,
  p_likes integer,
  p_comments integer,
  p_shares integer,
  p_saves integer,
  p_import_source text,
  p_metrics_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result_id uuid;
  linked_item_id uuid;
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

  IF length(btrim(p_tiktok_video_id)) NOT BETWEEN 1 AND 255
    OR length(btrim(p_share_url)) NOT BETWEEN 1 AND 2000
    OR p_share_url !~ '^https://'
    OR char_length(COALESCE(p_caption, '')) > 5000
    OR cardinality(COALESCE(p_hashtags, '{}'::text[])) > 50
    OR (p_duration_seconds IS NOT NULL AND p_duration_seconds NOT BETWEEN 1 AND 36000)
    OR p_published_at IS NULL
    OR p_import_source NOT IN ('api', 'manual_url')
    OR p_metrics_source NOT IN ('api', 'manual', 'mixed')
    OR EXISTS (
      SELECT 1
      FROM unnest(ARRAY[p_views, p_likes, p_comments, p_shares, p_saves]) metric
      WHERE metric IS NOT NULL AND metric NOT BETWEEN 0 AND 1000000000
    )
  THEN
    RAISE EXCEPTION 'content_os_tiktok_video_invalid';
  END IF;

  INSERT INTO public.content_tiktok_videos (
    workspace_key,
    tiktok_video_id,
    share_url,
    caption,
    hashtags,
    duration_seconds,
    published_at,
    views,
    likes,
    comments,
    shares,
    saves,
    import_source,
    metrics_source,
    analysis_status,
    last_synced_at
  )
  VALUES (
    'pilotfeliu',
    btrim(p_tiktok_video_id),
    btrim(p_share_url),
    COALESCE(p_caption, ''),
    COALESCE(p_hashtags, '{}'::text[]),
    p_duration_seconds,
    p_published_at,
    p_views,
    p_likes,
    p_comments,
    p_shares,
    p_saves,
    p_import_source,
    p_metrics_source,
    'pending_analysis',
    now()
  )
  ON CONFLICT (workspace_key, tiktok_video_id) DO UPDATE
  SET
    share_url = EXCLUDED.share_url,
    caption = EXCLUDED.caption,
    hashtags = EXCLUDED.hashtags,
    duration_seconds = EXCLUDED.duration_seconds,
    published_at = EXCLUDED.published_at,
    views = COALESCE(EXCLUDED.views, content_tiktok_videos.views),
    likes = COALESCE(EXCLUDED.likes, content_tiktok_videos.likes),
    comments = COALESCE(EXCLUDED.comments, content_tiktok_videos.comments),
    shares = COALESCE(EXCLUDED.shares, content_tiktok_videos.shares),
    saves = COALESCE(EXCLUDED.saves, content_tiktok_videos.saves),
    metrics_source = CASE
      WHEN content_tiktok_videos.metrics_source = EXCLUDED.metrics_source
        THEN EXCLUDED.metrics_source
      ELSE 'mixed'
    END,
    last_synced_at = now()
  RETURNING id, content_item_id INTO result_id, linked_item_id;

  IF linked_item_id IS NOT NULL THEN
    INSERT INTO public.content_metrics (
      content_item_id,
      recorded_on,
      views,
      likes,
      comments,
      shares,
      saves,
      followers_gained,
      leads_generated,
      sales_attributed,
      created_by,
      updated_by
    )
    VALUES (
      linked_item_id,
      (now() AT TIME ZONE 'Europe/Madrid')::date,
      p_views,
      p_likes,
      p_comments,
      p_shares,
      p_saves,
      NULL,
      NULL,
      NULL,
      p_admin_user_id,
      p_admin_user_id
    )
    ON CONFLICT (content_item_id, recorded_on) DO UPDATE
    SET
      views = EXCLUDED.views,
      likes = EXCLUDED.likes,
      comments = EXCLUDED.comments,
      shares = EXCLUDED.shares,
      saves = EXCLUDED.saves,
      updated_by = EXCLUDED.updated_by,
      updated_at = now();
  END IF;

  RETURN result_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_content_os_tiktok_sync(
  p_admin_user_id uuid,
  p_lock_id text,
  p_lock_until timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows integer;
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

  IF length(btrim(p_lock_id)) NOT BETWEEN 16 AND 100
    OR p_lock_until <= now()
    OR p_lock_until > now() + interval '10 minutes'
  THEN
    RAISE EXCEPTION 'content_os_tiktok_lock_invalid';
  END IF;

  UPDATE public.content_tiktok_connections
  SET
    sync_lock_id = btrim(p_lock_id),
    sync_lock_until = p_lock_until
  WHERE workspace_key = 'pilotfeliu'
    AND (
      sync_lock_until IS NULL
      OR sync_lock_until <= now()
    );

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_content_os_tiktok_sync(
  p_admin_user_id uuid,
  p_lock_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows integer;
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

  UPDATE public.content_tiktok_connections
  SET
    sync_lock_id = NULL,
    sync_lock_until = NULL
  WHERE workspace_key = 'pilotfeliu'
    AND sync_lock_id = btrim(p_lock_id);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_content_os_tiktok_token_refresh(
  p_admin_user_id uuid,
  p_lock_id text,
  p_lock_until timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows integer;
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

  IF length(btrim(p_lock_id)) NOT BETWEEN 16 AND 100
    OR p_lock_until <= now()
    OR p_lock_until > now() + interval '2 minutes'
  THEN
    RAISE EXCEPTION 'content_os_tiktok_lock_invalid';
  END IF;

  UPDATE public.content_tiktok_connections
  SET
    token_refresh_lock_id = btrim(p_lock_id),
    token_refresh_lock_until = p_lock_until
  WHERE workspace_key = 'pilotfeliu'
    AND access_token_expires_at <= now() + interval '5 minutes'
    AND refresh_token_expires_at > now()
    AND (
      token_refresh_lock_until IS NULL
      OR token_refresh_lock_until <= now()
    );

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_content_os_tiktok_refreshed_tokens(
  p_admin_user_id uuid,
  p_lock_id text,
  p_scopes text[],
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_access_token_expires_at timestamptz,
  p_refresh_token_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows integer;
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

  IF length(btrim(p_lock_id)) NOT BETWEEN 16 AND 100
    OR p_scopes IS NULL
    OR NOT p_scopes @> ARRAY['user.info.basic', 'video.list']::text[]
    OR length(p_access_token_ciphertext) NOT BETWEEN 20 AND 10000
    OR length(p_refresh_token_ciphertext) NOT BETWEEN 20 AND 10000
    OR p_access_token_expires_at <= now()
    OR p_refresh_token_expires_at <= now()
  THEN
    RAISE EXCEPTION 'content_os_tiktok_connection_invalid';
  END IF;

  UPDATE public.content_tiktok_connections
  SET
    scopes = ARRAY(SELECT DISTINCT unnest(p_scopes)),
    access_token_ciphertext = p_access_token_ciphertext,
    refresh_token_ciphertext = p_refresh_token_ciphertext,
    access_token_expires_at = p_access_token_expires_at,
    refresh_token_expires_at = p_refresh_token_expires_at,
    token_refresh_lock_id = NULL,
    token_refresh_lock_until = NULL
  WHERE workspace_key = 'pilotfeliu'
    AND token_refresh_lock_id = btrim(p_lock_id);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_content_os_tiktok_token_refresh(
  p_admin_user_id uuid,
  p_lock_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows integer;
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

  UPDATE public.content_tiktok_connections
  SET
    token_refresh_lock_id = NULL,
    token_refresh_lock_until = NULL
  WHERE workspace_key = 'pilotfeliu'
    AND token_refresh_lock_id = btrim(p_lock_id);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_content_os_tiktok_analysis_failed(
  p_admin_user_id uuid,
  p_video_ids uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_rows integer;
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

  UPDATE public.content_tiktok_videos
  SET
    analysis_status = 'failed',
    analysis_attempt_count = analysis_attempt_count + 1,
    analysis_last_failed_at = now(),
    analysis_next_retry_at = CASE
      WHEN analysis_attempt_count + 1 < 3
        THEN now() + interval '15 minutes'
      ELSE NULL
    END,
    reviewed_at = NULL,
    reviewed_by = NULL,
    content_item_id = NULL
  WHERE workspace_key = 'pilotfeliu'
    AND id = ANY(p_video_ids)
    AND content_item_id IS NULL
    AND analysis_status IN ('pending_analysis', 'failed')
    AND analysis_attempt_count < 3;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_content_os_tiktok_analysis(
  p_admin_user_id uuid,
  p_video_id uuid,
  p_title text,
  p_summary text,
  p_hook text,
  p_pillar text,
  p_objective text,
  p_related_product_key text,
  p_model_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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

  IF length(btrim(p_title)) NOT BETWEEN 1 AND 160
    OR length(btrim(p_summary)) NOT BETWEEN 1 AND 5000
    OR length(btrim(p_hook)) NOT BETWEEN 1 AND 1000
    OR p_pillar NOT IN (
      'pilot_life',
      'aviation_career',
      'training',
      'personal_stories',
      'aviation_english',
      'product_sales'
    )
    OR p_objective NOT IN ('growth', 'authority', 'community', 'conversion')
    OR (
      p_related_product_key IS NOT NULL
      AND p_related_product_key NOT IN (
        'guide',
        'career_planner',
        'aerocomms',
        'mentorships'
      )
    )
    OR length(btrim(p_model_name)) NOT BETWEEN 1 AND 100
  THEN
    RAISE EXCEPTION 'content_os_tiktok_analysis_invalid';
  END IF;

  UPDATE public.content_tiktok_videos
  SET
    analysis_status = 'pending_review',
    analysis_title = btrim(p_title),
    analysis_summary = btrim(p_summary),
    analysis_hook = btrim(p_hook),
    analysis_pillar = p_pillar,
    analysis_objective = p_objective,
    analysis_related_product_key = p_related_product_key,
    analysis_model_name = btrim(p_model_name),
    analyzed_at = now(),
    analysis_last_failed_at = NULL,
    analysis_next_retry_at = NULL,
    reviewed_at = NULL,
    reviewed_by = NULL
  WHERE id = p_video_id
    AND workspace_key = 'pilotfeliu'
    AND content_item_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'content_os_tiktok_video_not_reviewable';
  END IF;

  RETURN p_video_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_content_os_tiktok_analysis(
  p_admin_user_id uuid,
  p_video_id uuid,
  p_decision text,
  p_title text,
  p_summary text,
  p_hook text,
  p_pillar text,
  p_objective text,
  p_related_product_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  source_video public.content_tiktok_videos%ROWTYPE;
  result_item_id uuid;
  item_category text;
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
  INTO source_video
  FROM public.content_tiktok_videos
  WHERE id = p_video_id
    AND workspace_key = 'pilotfeliu'
  FOR UPDATE;

  IF NOT FOUND OR source_video.analysis_status NOT IN ('pending_review', 'rejected') THEN
    RAISE EXCEPTION 'content_os_tiktok_video_not_reviewable';
  END IF;

  IF p_decision = 'rejected' THEN
    UPDATE public.content_tiktok_videos
    SET
      analysis_status = 'rejected',
      reviewed_at = now(),
      reviewed_by = p_admin_user_id
    WHERE id = p_video_id;
    RETURN NULL;
  END IF;

  IF p_decision <> 'confirmed'
    OR length(btrim(p_title)) NOT BETWEEN 1 AND 160
    OR length(btrim(p_summary)) NOT BETWEEN 1 AND 5000
    OR length(btrim(p_hook)) NOT BETWEEN 1 AND 1000
    OR p_pillar NOT IN (
      'pilot_life',
      'aviation_career',
      'training',
      'personal_stories',
      'aviation_english',
      'product_sales'
    )
    OR p_objective NOT IN ('growth', 'authority', 'community', 'conversion')
    OR (
      p_related_product_key IS NOT NULL
      AND p_related_product_key NOT IN (
        'guide',
        'career_planner',
        'aerocomms',
        'mentorships'
      )
    )
  THEN
    RAISE EXCEPTION 'content_os_tiktok_review_invalid';
  END IF;

  item_category := CASE
    WHEN p_pillar = 'pilot_life' THEN 'lifestyle'
    WHEN p_pillar = 'personal_stories' THEN 'personal_brand'
    ELSE 'aviation'
  END;

  INSERT INTO public.content_items (
    content_type,
    title,
    summary,
    status,
    visibility,
    language_code,
    workspace_key,
    platform,
    objective,
    category,
    hook,
    script,
    cta,
    content_origin,
    source_url,
    content_pillar,
    related_product_key,
    published_at,
    proposal_source,
    proposal_status,
    created_by,
    updated_by
  )
    VALUES (
    'video',
    btrim(p_title),
    btrim(p_summary),
    'published',
    'internal',
    'es',
    'pilotfeliu',
    'tiktok_pilotfeliu',
    p_objective,
    item_category,
    btrim(p_hook),
    '',
    '',
    'historical',
    source_video.share_url,
    p_pillar,
    p_related_product_key,
    source_video.published_at,
    'ai',
    'approved',
    p_admin_user_id,
    p_admin_user_id
  )
  RETURNING id INTO result_item_id;

  INSERT INTO public.content_metrics (
    content_item_id,
    recorded_on,
    views,
    likes,
    comments,
    shares,
    saves,
    followers_gained,
    leads_generated,
    sales_attributed,
    created_by,
    updated_by
  )
  VALUES (
    result_item_id,
    (now() AT TIME ZONE 'Europe/Madrid')::date,
    source_video.views,
    source_video.likes,
    source_video.comments,
    source_video.shares,
    source_video.saves,
    NULL,
    NULL,
    NULL,
    p_admin_user_id,
    p_admin_user_id
  );

  UPDATE public.content_tiktok_videos
  SET
    analysis_status = 'confirmed',
    analysis_title = btrim(p_title),
    analysis_summary = btrim(p_summary),
    analysis_hook = btrim(p_hook),
    analysis_pillar = p_pillar,
    analysis_objective = p_objective,
    analysis_related_product_key = p_related_product_key,
    analysis_last_failed_at = NULL,
    analysis_next_retry_at = NULL,
    reviewed_at = now(),
    reviewed_by = p_admin_user_id,
    content_item_id = result_item_id
  WHERE id = p_video_id;

  RETURN result_item_id;
END;
$$;

-- TikTok metrics are partial by nature. Manual Content OS snapshots still
-- validate and write concrete numbers, while imported snapshots preserve NULL.
ALTER TABLE public.content_metrics
  ALTER COLUMN views DROP NOT NULL,
  ALTER COLUMN likes DROP NOT NULL,
  ALTER COLUMN comments DROP NOT NULL,
  ALTER COLUMN shares DROP NOT NULL,
  ALTER COLUMN saves DROP NOT NULL,
  ALTER COLUMN followers_gained DROP NOT NULL,
  ALTER COLUMN leads_generated DROP NOT NULL,
  ALTER COLUMN sales_attributed DROP NOT NULL;

ALTER TABLE public.content_tiktok_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tiktok_videos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_tiktok_connections
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.content_tiktok_videos
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.content_tiktok_connections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.content_tiktok_videos TO service_role;

REVOKE ALL ON FUNCTION public.upsert_content_os_tiktok_connection(
  uuid, text, text, text, text, text[], text, text, timestamptz, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_content_os_tiktok_connection(
  uuid, text, text, text, text, text[], text, text, timestamptz, timestamptz
) TO service_role;

REVOKE ALL ON FUNCTION public.upsert_content_os_tiktok_video(
  uuid, text, text, text, text[], integer, timestamptz,
  integer, integer, integer, integer, integer, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_content_os_tiktok_video(
  uuid, text, text, text, text[], integer, timestamptz,
  integer, integer, integer, integer, integer, text, text
) TO service_role;

REVOKE ALL ON FUNCTION public.save_content_os_tiktok_analysis(
  uuid, uuid, text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_content_os_tiktok_analysis(
  uuid, uuid, text, text, text, text, text, text, text
) TO service_role;

REVOKE ALL ON FUNCTION public.review_content_os_tiktok_analysis(
  uuid, uuid, text, text, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_content_os_tiktok_analysis(
  uuid, uuid, text, text, text, text, text, text, text
) TO service_role;

REVOKE ALL ON FUNCTION public.claim_content_os_tiktok_sync(
  uuid, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_content_os_tiktok_sync(
  uuid, text, timestamptz
) TO service_role;

REVOKE ALL ON FUNCTION public.release_content_os_tiktok_sync(
  uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_content_os_tiktok_sync(
  uuid, text
) TO service_role;

REVOKE ALL ON FUNCTION public.claim_content_os_tiktok_token_refresh(
  uuid, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_content_os_tiktok_token_refresh(
  uuid, text, timestamptz
) TO service_role;

REVOKE ALL ON FUNCTION public.save_content_os_tiktok_refreshed_tokens(
  uuid, text, text[], text, text, timestamptz, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_content_os_tiktok_refreshed_tokens(
  uuid, text, text[], text, text, timestamptz, timestamptz
) TO service_role;

REVOKE ALL ON FUNCTION public.release_content_os_tiktok_token_refresh(
  uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_content_os_tiktok_token_refresh(
  uuid, text
) TO service_role;

REVOKE ALL ON FUNCTION public.mark_content_os_tiktok_analysis_failed(
  uuid, uuid[]
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_content_os_tiktok_analysis_failed(
  uuid, uuid[]
) TO service_role;

COMMIT;
