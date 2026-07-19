BEGIN;

-- Directorio operativo interno de cuentas FlyPath. No crea leads ni duplica
-- actividad: compone identidad, perfil, progreso AeroComms y relación comercial
-- existente en una única lectura paginada para Warhome.
CREATE OR REPLACE FUNCTION public.get_warhome_user_directory(
  p_query text DEFAULT NULL,
  p_aerocomms_status text DEFAULT NULL,
  p_has_lead boolean DEFAULT NULL,
  p_marketing_status text DEFAULT NULL,
  p_email_confirmed boolean DEFAULT NULL,
  p_profile_incomplete boolean DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_direction text DEFAULT 'desc',
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_query text;
  v_aerocomms_status text;
  v_marketing_status text;
  v_sort_by text;
  v_sort_direction text;
  v_limit integer;
  v_offset integer;
BEGIN
  v_query := left(
    trim(regexp_replace(
      regexp_replace(coalesce(p_query, ''), '[^[:alnum:]@.+ -]', '', 'g'),
      '[[:space:]]+',
      ' ',
      'g'
    )),
    80
  );
  v_aerocomms_status := CASE
    WHEN p_aerocomms_status IN ('not_synced', 'no_activity', 'active') THEN p_aerocomms_status
    ELSE NULL
  END;
  v_marketing_status := CASE
    WHEN p_marketing_status IN ('subscribed', 'not_subscribed', 'not_applicable')
      THEN p_marketing_status
    ELSE NULL
  END;
  v_sort_by := CASE
    WHEN p_sort_by IN ('created_at', 'last_sign_in_at', 'last_aerocomms_activity_at') THEN p_sort_by
    ELSE 'created_at'
  END;
  v_sort_direction := CASE WHEN p_sort_direction = 'asc' THEN 'asc' ELSE 'desc' END;
  v_limit := least(greatest(coalesce(p_limit, 20), 1), 100);
  v_offset := least(greatest(coalesce(p_offset, 0), 0), 1000000);

  RETURN (
    WITH scoped_users AS (
      SELECT
        u.id AS user_id,
        u.email::text AS email,
        u.email_confirmed_at IS NOT NULL AS email_confirmed,
        u.created_at,
        u.last_sign_in_at,
        p.user_id AS profile_user_id,
        nullif(btrim(p.full_name), '') AS full_name
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      WHERE (
        v_query = ''
        OR lower(u.email) LIKE '%' || lower(v_query) || '%'
        OR lower(coalesce(p.full_name, '')) LIKE '%' || lower(v_query) || '%'
      )
      AND (
        p_email_confirmed IS NULL
        OR (u.email_confirmed_at IS NOT NULL) = p_email_confirmed
      )
      AND (
        p_profile_incomplete IS NULL
        OR (p.user_id IS NULL OR nullif(btrim(p.full_name), '') IS NULL) = p_profile_incomplete
      )
    ),
    scoped_progress AS (
      SELECT
        progress.user_id,
        progress.session_count,
        progress.scored_session_count,
        progress.last_activity_at,
        progress.last_activity_date,
        progress.streak_days,
        progress.legacy_imported_at,
        progress.reset_at
      FROM public.aerocomms_progress progress
      INNER JOIN scoped_users users ON users.user_id = progress.user_id
    ),
    completed_exercises AS (
      SELECT exercise.user_id, count(DISTINCT exercise.exercise_id)::integer AS completed_exercise_count
      FROM public.aerocomms_exercise_progress exercise
      INNER JOIN scoped_users users ON users.user_id = exercise.user_id
      WHERE exercise.completed_at IS NOT NULL
      GROUP BY exercise.user_id
    ),
    completed_missions AS (
      SELECT mission.user_id, count(DISTINCT mission.mission_id)::integer AS completed_mission_count
      FROM public.aerocomms_mission_progress mission
      INNER JOIN scoped_users users ON users.user_id = mission.user_id
      WHERE mission.completed_at IS NOT NULL
      GROUP BY mission.user_id
    ),
    linked_leads AS (
      SELECT lead.id AS lead_id, lead.user_id
      FROM public.leads lead
      INNER JOIN scoped_users users ON users.user_id = lead.user_id
    ),
    marketing AS (
      SELECT
        subscription.lead_id,
        bool_or(subscription.status = 'subscribed') AS has_active_subscription
      FROM public.email_subscriptions subscription
      INNER JOIN linked_leads lead ON lead.lead_id = subscription.lead_id
      GROUP BY subscription.lead_id
    ),
    enriched AS (
      SELECT
        users.user_id,
        users.email,
        users.email_confirmed,
        users.created_at,
        users.last_sign_in_at,
        users.full_name,
        (users.profile_user_id IS NULL OR users.full_name IS NULL) AS profile_incomplete,
        progress.user_id IS NOT NULL AS has_aerocomms_progress,
        coalesce(progress.session_count, 0)::integer AS session_count,
        coalesce(progress.scored_session_count, 0)::integer AS scored_session_count,
        progress.last_activity_at AS last_aerocomms_activity_at,
        progress.last_activity_date AS last_aerocomms_activity_date,
        coalesce(progress.streak_days, 0)::integer AS streak_days,
        progress.legacy_imported_at,
        progress.reset_at,
        coalesce(exercise.completed_exercise_count, 0)::integer AS completed_exercise_count,
        coalesce(mission.completed_mission_count, 0)::integer AS completed_mission_count,
        lead.lead_id,
        CASE
          WHEN lead.lead_id IS NULL THEN 'not_applicable'
          WHEN coalesce(marketing.has_active_subscription, false) THEN 'subscribed'
          ELSE 'not_subscribed'
        END AS marketing_status,
        CASE
          WHEN progress.user_id IS NULL THEN 'not_synced'
          WHEN progress.session_count > 0
            OR progress.last_activity_at IS NOT NULL
            OR progress.last_activity_date IS NOT NULL THEN 'active'
          ELSE 'no_activity'
        END AS aerocomms_status
      FROM scoped_users users
      LEFT JOIN scoped_progress progress ON progress.user_id = users.user_id
      LEFT JOIN completed_exercises exercise ON exercise.user_id = users.user_id
      LEFT JOIN completed_missions mission ON mission.user_id = users.user_id
      LEFT JOIN linked_leads lead ON lead.user_id = users.user_id
      LEFT JOIN marketing ON marketing.lead_id = lead.lead_id
    ),
    filtered AS (
      SELECT *,
        CASE v_sort_by
          WHEN 'last_sign_in_at' THEN last_sign_in_at
          WHEN 'last_aerocomms_activity_at'
            THEN coalesce(last_aerocomms_activity_at, last_aerocomms_activity_date::timestamptz)
          ELSE created_at
        END AS sort_value
      FROM enriched
      WHERE (v_aerocomms_status IS NULL OR aerocomms_status = v_aerocomms_status)
        AND (p_has_lead IS NULL OR (lead_id IS NOT NULL) = p_has_lead)
        AND (v_marketing_status IS NULL OR marketing_status = v_marketing_status)
    ),
    ordered AS (
      SELECT
        filtered.*,
        row_number() OVER (
          ORDER BY
            CASE WHEN v_sort_direction = 'asc' THEN sort_value END ASC NULLS LAST,
            CASE WHEN v_sort_direction = 'desc' THEN sort_value END DESC NULLS LAST,
            user_id ASC
        ) AS row_position
      FROM filtered
    ),
    paged AS (
      SELECT *
      FROM ordered
      WHERE row_position > v_offset AND row_position <= v_offset + v_limit
    )
    SELECT jsonb_build_object(
      'total', (SELECT count(*) FROM filtered),
      'rows', coalesce((
        SELECT jsonb_agg(
          jsonb_build_object(
            'userId', user_id,
            'email', email,
            'emailConfirmed', email_confirmed,
            'createdAt', created_at,
            'lastSignInAt', last_sign_in_at,
            'fullName', full_name,
            'profileIncomplete', profile_incomplete,
            'hasAeroCommsProgress', has_aerocomms_progress,
            'sessionCount', session_count,
            'scoredSessionCount', scored_session_count,
            'lastAeroCommsActivityAt', last_aerocomms_activity_at,
            'lastAeroCommsActivityDate', last_aerocomms_activity_date,
            'streakDays', streak_days,
            'legacyImportedAt', legacy_imported_at,
            'resetAt', reset_at,
            'completedExerciseCount', completed_exercise_count,
            'completedMissionCount', completed_mission_count,
            'hasLead', lead_id IS NOT NULL,
            'leadId', lead_id,
            'marketingStatus', marketing_status,
            'aerocommsStatus', aerocomms_status
          )
          ORDER BY row_position
        )
        FROM paged
      ), '[]'::jsonb)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_warhome_user_directory(
  text, text, boolean, text, boolean, boolean, text, text, integer, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_warhome_user_directory(
  text, text, boolean, text, boolean, boolean, text, text, integer, integer
) TO service_role;

COMMENT ON FUNCTION public.get_warhome_user_directory(
  text, text, boolean, text, boolean, boolean, text, text, integer, integer
) IS 'Directorio operativo paginado para Warhome; compone solo campos cerrados de cuenta, progreso AeroComms y relaciones existentes.';

COMMIT;
