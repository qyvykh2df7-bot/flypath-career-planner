-- =============================================================================
-- FlyPath: transición atómica de moderación de opiniones de escuelas
--
-- Una moderación modifica el estado y añade su evento de auditoría como una sola
-- sentencia transaccional. Si cualquiera de los pasos falla, PostgreSQL revierte
-- ambos: nunca queda un cambio de estado sin historial append-only.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.moderate_school_review_atomically(
  p_review_id uuid,
  p_expected_status public.school_review_status,
  p_target_status public.school_review_status,
  p_reason public.school_review_moderation_reason,
  p_internal_note text,
  p_moderator_user_id uuid
)
RETURNS TABLE (
  result text,
  status public.school_review_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_review public.school_reviews%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  -- Defense in depth: the server authorizes Warhome first, while the RPC also
  -- refuses a missing, inactive or invalid administrative identity.
  IF p_moderator_user_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE user_id = p_moderator_user_id
        AND is_active = true
        AND role IN ('admin', 'owner')
    ) THEN
    RAISE EXCEPTION 'moderator authorization required' USING ERRCODE = '42501';
  END IF;

  IF p_expected_status IS NULL
    OR p_target_status IS NULL
    OR p_reason IS NULL
    OR (p_internal_note IS NOT NULL AND length(p_internal_note) > 1000)
    OR (p_target_status = 'approved' AND p_reason <> 'approved')
    OR (p_target_status <> 'approved' AND p_reason = 'approved') THEN
    RETURN QUERY SELECT 'invalid_transition'::text, NULL::public.school_review_status;
    RETURN;
  END IF;

  SELECT *
  INTO v_review
  FROM public.school_reviews
  WHERE review_id = p_review_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::public.school_review_status;
    RETURN;
  END IF;

  -- A repeated, identical request is successful without a second event. A
  -- different concurrent change remains a conflict rather than being accepted.
  IF v_review.status = p_target_status AND v_review.status <> p_expected_status THEN
    IF EXISTS (
      SELECT 1
      FROM public.school_review_moderation_events
      WHERE review_id = p_review_id
        AND from_status = p_expected_status
        AND to_status = p_target_status
        AND reason = p_reason
        AND internal_note IS NOT DISTINCT FROM p_internal_note
        AND moderator_user_id = p_moderator_user_id
    ) THEN
      RETURN QUERY SELECT 'already_applied'::text, v_review.status;
    ELSE
      RETURN QUERY SELECT 'state_conflict'::text, v_review.status;
    END IF;
    RETURN;
  END IF;

  IF v_review.status <> p_expected_status THEN
    RETURN QUERY SELECT 'state_conflict'::text, v_review.status;
    RETURN;
  END IF;

  IF NOT (
    (p_expected_status = 'pending' AND p_target_status IN ('approved', 'rejected'))
    OR (p_expected_status = 'approved' AND p_target_status = 'hidden')
    OR (p_expected_status = 'hidden' AND p_target_status = 'pending')
    OR (p_expected_status = 'rejected' AND p_target_status = 'pending')
    OR (p_expected_status = 'deletion_requested' AND p_target_status = 'deleted')
  ) THEN
    RETURN QUERY SELECT 'invalid_transition'::text, v_review.status;
    RETURN;
  END IF;

  UPDATE public.school_reviews
  SET
    status = p_target_status,
    approved_at = CASE WHEN p_target_status = 'approved' THEN v_now ELSE approved_at END,
    rejected_at = CASE WHEN p_target_status = 'rejected' THEN v_now ELSE rejected_at END,
    hidden_at = CASE WHEN p_target_status = 'hidden' THEN v_now ELSE hidden_at END,
    deleted_at = CASE WHEN p_target_status = 'deleted' THEN v_now ELSE deleted_at END,
    moderation_reason = p_reason,
    moderation_note = NULLIF(btrim(p_internal_note), ''),
    moderator_user_id = p_moderator_user_id
  WHERE review_id = p_review_id;

  INSERT INTO public.school_review_moderation_events (
    review_id,
    from_status,
    to_status,
    reason,
    internal_note,
    moderator_user_id,
    created_at
  ) VALUES (
    p_review_id,
    p_expected_status,
    p_target_status,
    p_reason,
    NULLIF(btrim(p_internal_note), ''),
    p_moderator_user_id,
    v_now
  );

  RETURN QUERY SELECT 'applied'::text, p_target_status;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_school_review_atomically(
  uuid,
  public.school_review_status,
  public.school_review_status,
  public.school_review_moderation_reason,
  text,
  uuid
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.moderate_school_review_atomically(
  uuid,
  public.school_review_status,
  public.school_review_status,
  public.school_review_moderation_reason,
  text,
  uuid
) TO service_role;

COMMENT ON FUNCTION public.moderate_school_review_atomically(
  uuid,
  public.school_review_status,
  public.school_review_status,
  public.school_review_moderation_reason,
  text,
  uuid
) IS 'Transición atómica de moderación: bloquea la opinión, actualiza estado e inserta auditoría append-only en una única transacción.';

COMMIT;
