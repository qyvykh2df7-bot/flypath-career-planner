BEGIN;

CREATE TABLE IF NOT EXISTS public.aerocomms_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  schema_version smallint NOT NULL DEFAULT 1 CHECK (schema_version = 1),
  content_version text NOT NULL CHECK (content_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  accuracy smallint NULL CHECK (accuracy BETWEEN 0 AND 100),
  score_sum integer NOT NULL DEFAULT 0 CHECK (score_sum >= 0),
  session_count integer NOT NULL DEFAULT 0 CHECK (session_count >= 0),
  scored_session_count integer NOT NULL DEFAULT 0 CHECK (scored_session_count >= 0),
  streak_days integer NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_activity_at timestamptz NULL,
  last_activity_date date NULL,
  activity_timezone text NULL CHECK (char_length(activity_timezone) BETWEEN 1 AND 80),
  legacy_imported_at timestamptz NULL,
  reset_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scored_session_count <= session_count),
  CHECK (score_sum <= scored_session_count::numeric * 100),
  CHECK (
    (scored_session_count = 0 AND accuracy IS NULL)
    OR (scored_session_count > 0 AND accuracy IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.aerocomms_exercise_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL CHECK (char_length(exercise_id) BETWEEN 1 AND 160),
  content_version text NOT NULL CHECK (content_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  completed_at timestamptz NULL,
  last_attempt_at timestamptz NULL,
  best_score smallint NULL CHECK (best_score BETWEEN 0 AND 100),
  attempt_count integer NULL CHECK (attempt_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id, content_version)
);

CREATE INDEX IF NOT EXISTS aerocomms_exercise_progress_user_updated_idx
  ON public.aerocomms_exercise_progress (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.aerocomms_mission_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id text NOT NULL CHECK (char_length(mission_id) BETWEEN 1 AND 160),
  content_version text NOT NULL CHECK (content_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  level_id text NOT NULL CHECK (level_id IN ('cadet', 'student-pilot', 'ready-for-radio', 'airline-prep', 'advanced-ops')),
  best_score smallint NULL CHECK (best_score BETWEEN 0 AND 100),
  last_score smallint NULL CHECK (last_score BETWEEN 0 AND 100),
  best_stars smallint NULL CHECK (best_stars BETWEEN 0 AND 3),
  last_stars smallint NULL CHECK (last_stars BETWEEN 0 AND 3),
  attempt_count integer NOT NULL CHECK (attempt_count >= 1),
  completed_at timestamptz NULL,
  last_attempt_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_id, content_version)
);

CREATE INDEX IF NOT EXISTS aerocomms_mission_progress_user_level_updated_idx
  ON public.aerocomms_mission_progress (user_id, level_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.aerocomms_skill_stats (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL CHECK (skill_id IN ('listening', 'readbacks', 'phraseology', 'speaking', 'confidence')),
  content_version text NOT NULL CHECK (content_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  score_sum integer NOT NULL DEFAULT 0 CHECK (score_sum >= 0),
  scored_count integer NOT NULL DEFAULT 0 CHECK (scored_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id, content_version)
);

CREATE TABLE IF NOT EXISTS public.aerocomms_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_session_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('exercise', 'mission')),
  exercise_id text NULL CHECK (char_length(exercise_id) BETWEEN 1 AND 160),
  mission_id text NULL CHECK (char_length(mission_id) BETWEEN 1 AND 160),
  source text NOT NULL CHECK (source IN ('train', 'atc-mission')),
  level_id text NULL CHECK (level_id IN ('cadet', 'student-pilot', 'ready-for-radio', 'airline-prep', 'advanced-ops')),
  score smallint NULL CHECK (score BETWEEN 0 AND 100),
  stars smallint NULL CHECK (stars BETWEEN 0 AND 3),
  is_scored boolean NOT NULL,
  duration_sec integer NULL CHECK (duration_sec >= 0),
  occurred_at timestamptz NOT NULL,
  activity_date date NOT NULL,
  activity_timezone text NOT NULL CHECK (char_length(activity_timezone) BETWEEN 1 AND 80),
  content_version text NOT NULL CHECK (content_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_session_id),
  CHECK (
    (activity_type = 'exercise' AND exercise_id IS NOT NULL AND mission_id IS NULL AND source = 'train' AND stars IS NULL)
    OR
    (activity_type = 'mission' AND mission_id IS NOT NULL AND exercise_id IS NULL AND source = 'atc-mission')
  ),
  CHECK ((is_scored AND score IS NOT NULL) OR (NOT is_scored AND score IS NULL))
);

CREATE INDEX IF NOT EXISTS aerocomms_sessions_user_occurred_idx
  ON public.aerocomms_sessions (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS aerocomms_sessions_user_exercise_occurred_idx
  ON public.aerocomms_sessions (user_id, exercise_id, occurred_at DESC)
  WHERE exercise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS aerocomms_sessions_user_mission_occurred_idx
  ON public.aerocomms_sessions (user_id, mission_id, occurred_at DESC)
  WHERE mission_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.aerocomms_sync_receipts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  payload_hash text NOT NULL CHECK (char_length(payload_hash) = 32),
  schema_version smallint NOT NULL CHECK (schema_version = 1),
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, operation_id)
);

CREATE OR REPLACE FUNCTION public.set_aerocomms_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_aerocomms_progress_updated_at
BEFORE UPDATE ON public.aerocomms_progress
FOR EACH ROW EXECUTE FUNCTION public.set_aerocomms_updated_at();

CREATE TRIGGER set_aerocomms_exercise_progress_updated_at
BEFORE UPDATE ON public.aerocomms_exercise_progress
FOR EACH ROW EXECUTE FUNCTION public.set_aerocomms_updated_at();

CREATE TRIGGER set_aerocomms_mission_progress_updated_at
BEFORE UPDATE ON public.aerocomms_mission_progress
FOR EACH ROW EXECUTE FUNCTION public.set_aerocomms_updated_at();

CREATE TRIGGER set_aerocomms_skill_stats_updated_at
BEFORE UPDATE ON public.aerocomms_skill_stats
FOR EACH ROW EXECUTE FUNCTION public.set_aerocomms_updated_at();

ALTER TABLE public.aerocomms_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerocomms_exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerocomms_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerocomms_skill_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerocomms_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aerocomms_sync_receipts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.aerocomms_progress, public.aerocomms_exercise_progress,
  public.aerocomms_mission_progress, public.aerocomms_skill_stats,
  public.aerocomms_sessions, public.aerocomms_sync_receipts FROM anon, authenticated;

GRANT SELECT ON TABLE public.aerocomms_progress, public.aerocomms_exercise_progress,
  public.aerocomms_mission_progress, public.aerocomms_skill_stats, public.aerocomms_sessions TO authenticated;
GRANT ALL ON TABLE public.aerocomms_progress, public.aerocomms_exercise_progress,
  public.aerocomms_mission_progress, public.aerocomms_skill_stats,
  public.aerocomms_sessions, public.aerocomms_sync_receipts TO service_role;

CREATE POLICY aerocomms_progress_read_own ON public.aerocomms_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY aerocomms_exercise_progress_read_own ON public.aerocomms_exercise_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY aerocomms_mission_progress_read_own ON public.aerocomms_mission_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY aerocomms_skill_stats_read_own ON public.aerocomms_skill_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY aerocomms_sessions_read_own ON public.aerocomms_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_aerocomms_progress_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'schemaVersion', p.schema_version,
    'contentVersion', p.content_version,
    'summary', jsonb_build_object(
      'accuracy', p.accuracy,
      'scoreSum', p.score_sum,
      'sessionCount', p.session_count,
      'scoredSessionCount', p.scored_session_count,
      'streakDays', p.streak_days,
      'lastActivityAt', p.last_activity_at,
      'lastActivityDate', p.last_activity_date,
      'activityTimezone', p.activity_timezone,
      'legacyImportedAt', p.legacy_imported_at,
      'resetAt', p.reset_at
    ),
    'completedExerciseIds', COALESCE((
      SELECT jsonb_agg(ep.exercise_id ORDER BY ep.exercise_id)
      FROM (
        SELECT DISTINCT exercise_id
        FROM public.aerocomms_exercise_progress
        WHERE user_id = p.user_id
      ) ep
    ), '[]'::jsonb),
    'missions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'missionId', mp.mission_id,
        'levelId', mp.level_id,
        'bestScore', mp.best_score,
        'lastScore', mp.last_score,
        'bestStars', mp.best_stars,
        'lastStars', mp.last_stars,
        'attemptCount', mp.attempt_count,
        'completedAt', mp.completed_at,
        'lastAttemptAt', mp.last_attempt_at
      ) ORDER BY mp.last_attempt_at DESC)
      FROM (
        SELECT
          mission_id,
          (array_agg(level_id ORDER BY last_attempt_at DESC))[1] AS level_id,
          max(best_score) AS best_score,
          (array_agg(last_score ORDER BY last_attempt_at DESC))[1] AS last_score,
          max(best_stars) AS best_stars,
          (array_agg(last_stars ORDER BY last_attempt_at DESC))[1] AS last_stars,
          sum(attempt_count)::integer AS attempt_count,
          min(completed_at) AS completed_at,
          max(last_attempt_at) AS last_attempt_at
        FROM public.aerocomms_mission_progress
        WHERE user_id = p.user_id
        GROUP BY mission_id
      ) mp
    ), '[]'::jsonb),
    'skillStats', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'skillId', ss.skill_id,
        'scoreSum', ss.score_sum,
        'scoredCount', ss.scored_count
      ) ORDER BY ss.skill_id)
      FROM (
        SELECT skill_id, sum(score_sum)::integer AS score_sum, sum(scored_count)::integer AS scored_count
        FROM public.aerocomms_skill_stats
        WHERE user_id = p.user_id
        GROUP BY skill_id
      ) ss
    ), '[]'::jsonb),
    'sessions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'clientSessionId', recent.client_session_id,
        'activityType', recent.activity_type,
        'source', recent.source,
        'exerciseId', recent.exercise_id,
        'missionId', recent.mission_id,
        'levelId', recent.level_id,
        'score', recent.score,
        'stars', recent.stars,
        'isScored', recent.is_scored,
        'occurredAt', recent.occurred_at,
        'activityDate', recent.activity_date,
        'activityTimezone', recent.activity_timezone
      ) ORDER BY recent.occurred_at DESC)
      FROM (
        SELECT * FROM public.aerocomms_sessions s
        WHERE s.user_id = p.user_id
        ORDER BY s.occurred_at DESC
        LIMIT 100
      ) recent
    ), '[]'::jsonb)
  )
  FROM public.aerocomms_progress p
  WHERE p.user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.apply_aerocomms_progress_sync(
  p_user_id uuid,
  p_operation_id uuid,
  p_schema_version smallint,
  p_content_version text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_initial_import boolean;
  v_receipt uuid;
  v_existing_payload_hash text;
  v_reset_at timestamptz;
  v_inserted_sessions jsonb := '[]'::jsonb;
  v_new_session_count integer := 0;
  v_new_scored_count integer := 0;
  v_new_score_sum integer := 0;
  v_latest_activity_at timestamptz;
  v_latest_activity_date date;
  v_latest_timezone text;
  v_streak_days integer := 0;
  v_summary jsonb;
BEGIN
  IF p_user_id IS NULL OR p_operation_id IS NULL OR p_schema_version <> 1
    OR p_content_version !~ '^[0-9]{4}\.[0-9]{2}$'
    OR jsonb_typeof(p_payload) <> 'object'
    OR jsonb_typeof(p_payload->'completed_exercise_ids') <> 'array'
    OR jsonb_typeof(p_payload->'missions') <> 'array'
    OR jsonb_typeof(p_payload->'skill_stats') <> 'array'
    OR jsonb_typeof(p_payload->'sessions') <> 'array'
    OR jsonb_typeof(p_payload->'summary') <> 'object'
    OR jsonb_array_length(p_payload->'completed_exercise_ids') > 500
    OR jsonb_array_length(p_payload->'missions') > 100
    OR jsonb_array_length(p_payload->'skill_stats') > 5
    OR jsonb_array_length(p_payload->'sessions') > 100
  THEN
    RAISE EXCEPTION 'Invalid AeroComms progress payload';
  END IF;

  -- Serialize concurrent batches for one account so aggregate counters remain exact.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  INSERT INTO public.aerocomms_sync_receipts (user_id, operation_id, payload_hash, schema_version)
  VALUES (p_user_id, p_operation_id, md5(p_payload::text), p_schema_version)
  ON CONFLICT (user_id, operation_id) DO NOTHING
  RETURNING operation_id INTO v_receipt;

  IF v_receipt IS NULL THEN
    SELECT payload_hash INTO v_existing_payload_hash
    FROM public.aerocomms_sync_receipts
    WHERE user_id = p_user_id AND operation_id = p_operation_id;
    IF v_existing_payload_hash IS DISTINCT FROM md5(p_payload::text) THEN
      RAISE EXCEPTION 'AeroComms sync operation payload mismatch' USING ERRCODE = '22023';
    END IF;
    RETURN public.get_aerocomms_progress_snapshot(p_user_id);
  END IF;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.aerocomms_progress WHERE user_id = p_user_id
  ) INTO v_initial_import;
  SELECT reset_at INTO v_reset_at FROM public.aerocomms_progress WHERE user_id = p_user_id;
  v_summary := p_payload->'summary';

  INSERT INTO public.aerocomms_progress (
    user_id, schema_version, content_version, accuracy, score_sum, session_count,
    scored_session_count, streak_days, legacy_imported_at, last_activity_date
  ) VALUES (
    p_user_id,
    p_schema_version,
    p_content_version,
    CASE WHEN COALESCE((v_summary->>'scored_session_count')::integer, 0) > 0
      THEN round((v_summary->>'score_sum')::numeric /
        (v_summary->>'scored_session_count')::integer)::smallint ELSE NULL END,
    COALESCE((v_summary->>'score_sum')::integer, 0),
    COALESCE((v_summary->>'session_count')::integer, 0),
    COALESCE((v_summary->>'scored_session_count')::integer, 0),
    COALESCE((v_summary->>'legacy_streak_days')::integer, 0),
    now(),
    (v_summary->>'legacy_last_activity_date')::date
  )
  ON CONFLICT (user_id) DO UPDATE
  SET schema_version = EXCLUDED.schema_version,
      content_version = EXCLUDED.content_version;

  -- Legacy aggregates are a one-time baseline. Later writes derive only from
  -- newly accepted idempotent session facts, so attempts cannot be double-counted.
  IF v_initial_import THEN
    INSERT INTO public.aerocomms_exercise_progress (
      user_id, exercise_id, content_version, completed_at
    )
    SELECT p_user_id, item.exercise_id, p_content_version, NULL
    FROM jsonb_array_elements_text(p_payload->'completed_exercise_ids') AS item(exercise_id)
    WHERE char_length(item.exercise_id) BETWEEN 1 AND 160
    ON CONFLICT (user_id, exercise_id, content_version) DO NOTHING;

    INSERT INTO public.aerocomms_mission_progress (
    user_id, mission_id, content_version, level_id, best_score, last_score,
    best_stars, last_stars, attempt_count, completed_at, last_attempt_at
  )
  SELECT
    p_user_id,
    item.mission_id,
    p_content_version,
    item.level_id,
    item.best_score,
    item.last_score,
    item.best_stars,
    item.last_stars,
    item.attempt_count,
    item.completed_at,
    item.last_attempt_at
  FROM jsonb_to_recordset(p_payload->'missions') AS item(
    mission_id text, level_id text, best_score smallint, last_score smallint,
    best_stars smallint, last_stars smallint, attempt_count integer,
    completed_at timestamptz, last_attempt_at timestamptz
  )
  WHERE item.mission_id IS NOT NULL
    AND item.level_id IN ('cadet', 'student-pilot', 'ready-for-radio', 'airline-prep', 'advanced-ops')
    AND item.best_score BETWEEN 0 AND 100
    AND item.last_score BETWEEN 0 AND 100
    AND item.best_stars BETWEEN 0 AND 3
    AND item.last_stars BETWEEN 0 AND 3
    AND item.attempt_count >= 1
    AND item.completed_at IS NOT NULL
    AND item.last_attempt_at IS NOT NULL
    ON CONFLICT (user_id, mission_id, content_version) DO NOTHING;
  END IF;

  IF v_initial_import THEN
    INSERT INTO public.aerocomms_skill_stats (
      user_id, skill_id, content_version, score_sum, scored_count
    )
    SELECT p_user_id, item.skill_id, p_content_version, item.score_sum, item.scored_count
    FROM jsonb_to_recordset(p_payload->'skill_stats') AS item(
      skill_id text, score_sum integer, scored_count integer
    )
    WHERE item.skill_id IN ('listening', 'readbacks', 'phraseology', 'speaking', 'confidence')
      AND item.score_sum >= 0 AND item.scored_count >= 0
    ON CONFLICT (user_id, skill_id, content_version) DO NOTHING;
  END IF;

  WITH inserted AS (
    INSERT INTO public.aerocomms_sessions (
      user_id, client_session_id, activity_type, exercise_id, mission_id, source,
      level_id, score, stars, is_scored, occurred_at, activity_date,
      activity_timezone, content_version
    )
    SELECT
      p_user_id,
      item.client_session_id,
      item.activity_type,
      item.exercise_id,
      item.mission_id,
      item.source,
      item.level_id,
      item.score,
      item.stars,
      item.is_scored,
      item.occurred_at,
      item.activity_date,
      item.activity_timezone,
      p_content_version
    FROM jsonb_to_recordset(p_payload->'sessions') AS item(
      client_session_id uuid, activity_type text, exercise_id text, mission_id text,
      source text, level_id text, score smallint, stars smallint, is_scored boolean,
      occurred_at timestamptz, activity_date date, activity_timezone text
    )
    WHERE item.client_session_id IS NOT NULL
      AND item.activity_type IN ('exercise', 'mission')
      AND item.source IN ('train', 'atc-mission')
      AND (item.level_id IS NULL OR item.level_id IN ('cadet', 'student-pilot', 'ready-for-radio', 'airline-prep', 'advanced-ops'))
      AND item.occurred_at <= now() + interval '5 minutes'
      AND (v_reset_at IS NULL OR item.occurred_at > v_reset_at)
      AND item.activity_date IS NOT NULL
      AND char_length(item.activity_timezone) BETWEEN 1 AND 80
    ON CONFLICT (user_id, client_session_id) DO NOTHING
    RETURNING *
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(inserted)), '[]'::jsonb) INTO v_inserted_sessions
  FROM inserted;

  SELECT
    count(*),
    count(*) FILTER (WHERE is_scored),
    COALESCE(sum(score) FILTER (WHERE is_scored), 0),
    max(occurred_at),
    max(activity_date)
  INTO v_new_session_count, v_new_scored_count, v_new_score_sum, v_latest_activity_at, v_latest_activity_date
  FROM jsonb_to_recordset(v_inserted_sessions) AS item(
    is_scored boolean, score smallint, occurred_at timestamptz, activity_date date
  );

  SELECT item.activity_timezone INTO v_latest_timezone
  FROM jsonb_to_recordset(v_inserted_sessions) AS item(
    occurred_at timestamptz, activity_timezone text
  )
  ORDER BY item.occurred_at DESC
  LIMIT 1;

  IF v_new_session_count > 0 THEN
    INSERT INTO public.aerocomms_exercise_progress (
      user_id, exercise_id, content_version, completed_at, last_attempt_at, best_score, attempt_count
    )
    SELECT p_user_id, item.exercise_id, p_content_version, min(item.occurred_at), max(item.occurred_at),
      max(item.score), CASE WHEN v_initial_import THEN NULL ELSE count(*)::integer END
    FROM jsonb_to_recordset(v_inserted_sessions) AS item(
      activity_type text, exercise_id text, occurred_at timestamptz, score smallint
    )
    WHERE item.activity_type = 'exercise' AND item.exercise_id IS NOT NULL
    GROUP BY item.exercise_id
    ON CONFLICT (user_id, exercise_id, content_version) DO UPDATE
    SET completed_at = CASE
          WHEN public.aerocomms_exercise_progress.completed_at IS NULL THEN EXCLUDED.completed_at
          ELSE LEAST(public.aerocomms_exercise_progress.completed_at, EXCLUDED.completed_at)
        END,
        last_attempt_at = GREATEST(public.aerocomms_exercise_progress.last_attempt_at, EXCLUDED.last_attempt_at),
        best_score = CASE
          WHEN public.aerocomms_exercise_progress.best_score IS NULL THEN EXCLUDED.best_score
          WHEN EXCLUDED.best_score IS NULL THEN public.aerocomms_exercise_progress.best_score
          ELSE GREATEST(public.aerocomms_exercise_progress.best_score, EXCLUDED.best_score)
        END,
        attempt_count = CASE
          WHEN v_initial_import THEN public.aerocomms_exercise_progress.attempt_count
          WHEN public.aerocomms_exercise_progress.attempt_count IS NULL THEN NULL
          ELSE public.aerocomms_exercise_progress.attempt_count + EXCLUDED.attempt_count
        END;

  END IF;

  IF NOT v_initial_import AND v_new_session_count > 0 THEN
    INSERT INTO public.aerocomms_mission_progress (
      user_id, mission_id, content_version, level_id, best_score, last_score, best_stars,
      last_stars, attempt_count, completed_at, last_attempt_at
    )
    SELECT p_user_id, item.mission_id, p_content_version, max(item.level_id), max(item.score),
      (array_agg(item.score ORDER BY item.occurred_at DESC))[1], max(item.stars),
      (array_agg(item.stars ORDER BY item.occurred_at DESC))[1], count(*)::integer,
      min(item.occurred_at), max(item.occurred_at)
    FROM jsonb_to_recordset(v_inserted_sessions) AS item(
      activity_type text, mission_id text, level_id text, occurred_at timestamptz,
      score smallint, stars smallint
    )
    WHERE item.activity_type = 'mission' AND item.mission_id IS NOT NULL AND item.level_id IS NOT NULL
    GROUP BY item.mission_id
    ON CONFLICT (user_id, mission_id, content_version) DO UPDATE
    SET best_score = GREATEST(public.aerocomms_mission_progress.best_score, EXCLUDED.best_score),
        best_stars = GREATEST(public.aerocomms_mission_progress.best_stars, EXCLUDED.best_stars),
        last_score = CASE WHEN EXCLUDED.last_attempt_at >= public.aerocomms_mission_progress.last_attempt_at
          THEN EXCLUDED.last_score ELSE public.aerocomms_mission_progress.last_score END,
        last_stars = CASE WHEN EXCLUDED.last_attempt_at >= public.aerocomms_mission_progress.last_attempt_at
          THEN EXCLUDED.last_stars ELSE public.aerocomms_mission_progress.last_stars END,
        last_attempt_at = GREATEST(public.aerocomms_mission_progress.last_attempt_at, EXCLUDED.last_attempt_at),
        completed_at = LEAST(public.aerocomms_mission_progress.completed_at, EXCLUDED.completed_at),
        attempt_count = public.aerocomms_mission_progress.attempt_count + EXCLUDED.attempt_count;

    WITH incoming AS (
      SELECT item.client_session_id, item.score, item.skill_ids
      FROM jsonb_to_recordset(p_payload->'sessions') AS item(
        client_session_id uuid, score smallint, skill_ids jsonb
      )
      JOIN jsonb_to_recordset(v_inserted_sessions) AS inserted(client_session_id uuid)
        USING (client_session_id)
      WHERE item.score IS NOT NULL AND jsonb_typeof(item.skill_ids) = 'array'
    ), deltas AS (
      SELECT skill_id, sum(incoming.score)::integer AS score_sum, count(*)::integer AS scored_count
      FROM incoming
      CROSS JOIN LATERAL jsonb_array_elements_text(incoming.skill_ids) AS skill_id
      WHERE skill_id IN ('listening', 'readbacks', 'phraseology', 'speaking', 'confidence')
      GROUP BY skill_id
    )
    INSERT INTO public.aerocomms_skill_stats (user_id, skill_id, content_version, score_sum, scored_count)
    SELECT p_user_id, skill_id, p_content_version, score_sum, scored_count FROM deltas
    ON CONFLICT (user_id, skill_id, content_version) DO UPDATE
    SET score_sum = public.aerocomms_skill_stats.score_sum + EXCLUDED.score_sum,
        scored_count = public.aerocomms_skill_stats.scored_count + EXCLUDED.scored_count;
  END IF;

  IF v_latest_activity_at IS NOT NULL THEN
    WITH RECURSIVE activity_dates AS (
      SELECT DISTINCT activity_date FROM public.aerocomms_sessions WHERE user_id = p_user_id
    ), consecutive(activity_date) AS (
      SELECT max(activity_date) FROM activity_dates
      UNION ALL
      SELECT consecutive.activity_date - 1
      FROM consecutive
      JOIN activity_dates ON activity_dates.activity_date = consecutive.activity_date - 1
    )
    SELECT count(*)::integer INTO v_streak_days FROM consecutive;

    UPDATE public.aerocomms_progress
    SET last_activity_at = GREATEST(COALESCE(last_activity_at, v_latest_activity_at), v_latest_activity_at),
        last_activity_date = GREATEST(
          last_activity_date,
          (SELECT max(activity_date) FROM public.aerocomms_sessions WHERE user_id = p_user_id)
        ),
        activity_timezone = COALESCE(v_latest_timezone, activity_timezone),
        streak_days = CASE WHEN v_initial_import THEN GREATEST(streak_days, v_streak_days) ELSE v_streak_days END
    WHERE user_id = p_user_id;
  END IF;

  IF NOT v_initial_import AND v_new_session_count > 0 THEN
    UPDATE public.aerocomms_progress
    SET
      accuracy = CASE
        WHEN scored_session_count + v_new_scored_count = 0 THEN NULL
        WHEN v_new_scored_count = 0 THEN accuracy
        ELSE round((score_sum + v_new_score_sum)::numeric /
          (scored_session_count + v_new_scored_count))::smallint
      END,
      score_sum = score_sum + v_new_score_sum,
      session_count = session_count + v_new_session_count,
      scored_session_count = scored_session_count + v_new_scored_count
    WHERE user_id = p_user_id;
  END IF;

  RETURN public.get_aerocomms_progress_snapshot(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_aerocomms_progress(
  p_user_id uuid,
  p_operation_id uuid,
  p_content_version text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_receipt uuid;
  v_existing_payload_hash text;
  v_reset_hash text := md5('aerocomms-progress-reset-v1');
BEGIN
  IF p_user_id IS NULL OR p_operation_id IS NULL OR p_content_version !~ '^[0-9]{4}\.[0-9]{2}$' THEN
    RAISE EXCEPTION 'Invalid AeroComms progress reset' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  INSERT INTO public.aerocomms_sync_receipts (user_id, operation_id, payload_hash, schema_version)
  VALUES (p_user_id, p_operation_id, v_reset_hash, 1)
  ON CONFLICT (user_id, operation_id) DO NOTHING
  RETURNING operation_id INTO v_receipt;

  IF v_receipt IS NULL THEN
    SELECT payload_hash INTO v_existing_payload_hash
    FROM public.aerocomms_sync_receipts
    WHERE user_id = p_user_id AND operation_id = p_operation_id;
    IF v_existing_payload_hash IS DISTINCT FROM v_reset_hash THEN
      RAISE EXCEPTION 'AeroComms reset operation payload mismatch' USING ERRCODE = '22023';
    END IF;
    RETURN public.get_aerocomms_progress_snapshot(p_user_id);
  END IF;

  DELETE FROM public.aerocomms_exercise_progress WHERE user_id = p_user_id;
  DELETE FROM public.aerocomms_mission_progress WHERE user_id = p_user_id;
  DELETE FROM public.aerocomms_skill_stats WHERE user_id = p_user_id;
  DELETE FROM public.aerocomms_sessions WHERE user_id = p_user_id;

  INSERT INTO public.aerocomms_progress (
    user_id, schema_version, content_version, accuracy, score_sum, session_count,
    scored_session_count, streak_days, reset_at
  ) VALUES (
    p_user_id, 1, p_content_version, NULL, 0, 0, 0, 0, now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET schema_version = EXCLUDED.schema_version,
      content_version = EXCLUDED.content_version,
      accuracy = NULL,
      score_sum = 0,
      session_count = 0,
      scored_session_count = 0,
      streak_days = 0,
      last_activity_at = NULL,
      last_activity_date = NULL,
      activity_timezone = NULL,
      reset_at = EXCLUDED.reset_at;

  RETURN public.get_aerocomms_progress_snapshot(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_aerocomms_progress_snapshot(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_aerocomms_progress_sync(uuid, uuid, smallint, text, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reset_aerocomms_progress(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_aerocomms_progress_snapshot(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_aerocomms_progress_sync(uuid, uuid, smallint, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_aerocomms_progress(uuid, uuid, text) TO service_role;

COMMENT ON TABLE public.aerocomms_progress IS
  'Resumen de progreso AeroComms por cuenta; no representa acceso, plan ni entitlement.';
COMMENT ON TABLE public.aerocomms_sessions IS
  'Historial mínimo idempotente de actividades AeroComms; excluye audio, transcripciones y estado de UI.';
COMMENT ON TABLE public.aerocomms_sync_receipts IS
  'Recibos de idempotencia operativa para lotes de sincronización AeroComms.';
COMMENT ON FUNCTION public.apply_aerocomms_progress_sync(uuid, uuid, smallint, text, jsonb) IS
  'Aplica un lote AeroComms validado de forma transaccional, idempotente y con merge monotónico.';
COMMENT ON FUNCTION public.reset_aerocomms_progress(uuid, uuid, text) IS
  'Restablece de forma persistente el progreso AeroComms de una cuenta y evita reimportar sesiones anteriores al corte.';

COMMIT;
