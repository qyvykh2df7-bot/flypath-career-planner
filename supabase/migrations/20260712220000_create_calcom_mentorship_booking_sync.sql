-- =============================================================================
-- FlyPath Phase 10: Cal.com mentorship booking projection.
--
-- Cal.com remains the booking, calendar, meeting and payment source of truth.
-- FlyPath stores a minimal operational projection and an idempotent event ledger;
-- it never stores the webhook body, meeting URLs, notes or payment provider data.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.mentorship_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cal_booking_id bigint NULL,
  cal_booking_uid text NOT NULL,
  cal_event_type_id bigint NULL,
  cal_event_type_slug text NULL,
  event_type_name text NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id uuid NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  attendee_name text NOT NULL,
  attendee_email text NOT NULL,
  attendee_email_hash text NOT NULL,
  scheduled_start_at timestamptz NOT NULL,
  scheduled_end_at timestamptz NOT NULL,
  attendee_timezone text NULL,
  booking_status text NOT NULL DEFAULT 'created',
  payment_status text NOT NULL DEFAULT 'unknown',
  payment_amount integer NULL,
  payment_currency char(3) NULL,
  last_provider_event_at timestamptz NULL,
  cancelled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentorship_bookings_cal_booking_uid_unique UNIQUE (cal_booking_uid),
  CONSTRAINT mentorship_bookings_cal_booking_id_unique UNIQUE (cal_booking_id),
  CONSTRAINT mentorship_bookings_cal_booking_uid_check CHECK (char_length(cal_booking_uid) BETWEEN 1 AND 255),
  CONSTRAINT mentorship_bookings_event_type_slug_check CHECK (
    cal_event_type_slug IS NULL OR char_length(cal_event_type_slug) BETWEEN 1 AND 160
  ),
  CONSTRAINT mentorship_bookings_event_type_name_check CHECK (
    event_type_name IS NULL OR char_length(event_type_name) BETWEEN 1 AND 200
  ),
  CONSTRAINT mentorship_bookings_attendee_name_check CHECK (char_length(btrim(attendee_name)) BETWEEN 1 AND 160),
  CONSTRAINT mentorship_bookings_attendee_email_check CHECK (
    attendee_email = lower(btrim(attendee_email))
    AND attendee_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    AND char_length(attendee_email) <= 320
  ),
  CONSTRAINT mentorship_bookings_attendee_email_hash_check CHECK (
    attendee_email_hash ~ '^[a-f0-9]{64}$'
    AND attendee_email_hash = encode(extensions.digest(attendee_email, 'sha256'), 'hex')
  ),
  CONSTRAINT mentorship_bookings_schedule_check CHECK (scheduled_end_at > scheduled_start_at),
  CONSTRAINT mentorship_bookings_timezone_check CHECK (
    attendee_timezone IS NULL OR char_length(attendee_timezone) BETWEEN 1 AND 80
  ),
  CONSTRAINT mentorship_bookings_status_check CHECK (
    booking_status IN ('created', 'confirmed', 'cancelled', 'rescheduled', 'rejected', 'completed', 'no_show')
  ),
  CONSTRAINT mentorship_bookings_payment_status_check CHECK (
    payment_status IN ('unknown', 'pending', 'paid', 'failed', 'refunded')
  ),
  CONSTRAINT mentorship_bookings_payment_amount_check CHECK (payment_amount IS NULL OR payment_amount >= 0),
  CONSTRAINT mentorship_bookings_payment_currency_check CHECK (
    payment_currency IS NULL OR payment_currency ~ '^[A-Z]{3}$'
  ),
  CONSTRAINT mentorship_bookings_payment_shape_check CHECK (
    (payment_amount IS NULL AND payment_currency IS NULL)
    OR (payment_amount IS NOT NULL AND payment_currency IS NOT NULL)
  ),
  CONSTRAINT mentorship_bookings_cancelled_at_check CHECK (
    (booking_status = 'cancelled' AND cancelled_at IS NOT NULL)
    OR (booking_status <> 'cancelled' AND cancelled_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS mentorship_bookings_status_schedule_idx
  ON public.mentorship_bookings (booking_status, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS mentorship_bookings_payment_status_schedule_idx
  ON public.mentorship_bookings (payment_status, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS mentorship_bookings_attendee_email_hash_idx
  ON public.mentorship_bookings (attendee_email_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS mentorship_bookings_user_id_idx
  ON public.mentorship_bookings (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS mentorship_bookings_lead_id_idx
  ON public.mentorship_bookings (lead_id, created_at DESC) WHERE lead_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_mentorship_bookings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.attendee_name = btrim(NEW.attendee_name);
  NEW.attendee_email = lower(btrim(NEW.attendee_email));
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mentorship_bookings_set_updated_at ON public.mentorship_bookings;
CREATE TRIGGER mentorship_bookings_set_updated_at
  BEFORE INSERT OR UPDATE ON public.mentorship_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_mentorship_bookings_updated_at();

CREATE TABLE IF NOT EXISTS public.cal_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash text NOT NULL UNIQUE,
  trigger_event text NOT NULL,
  cal_booking_uid text NULL,
  provider_occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'processing',
  error_code text NULL,
  CONSTRAINT cal_webhook_events_hash_check CHECK (event_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT cal_webhook_events_trigger_check CHECK (
    trigger_event IN ('BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED')
  ),
  CONSTRAINT cal_webhook_events_booking_uid_check CHECK (
    cal_booking_uid IS NULL OR char_length(cal_booking_uid) BETWEEN 1 AND 255
  ),
  CONSTRAINT cal_webhook_events_status_check CHECK (
    processing_status IN ('processing', 'processed', 'ignored', 'failed')
  ),
  CONSTRAINT cal_webhook_events_error_code_check CHECK (
    error_code IS NULL OR error_code ~ '^[a-z0-9_]{1,80}$'
  )
);

CREATE INDEX IF NOT EXISTS cal_webhook_events_booking_occurred_idx
  ON public.cal_webhook_events (cal_booking_uid, provider_occurred_at DESC)
  WHERE cal_booking_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS cal_webhook_events_status_received_idx
  ON public.cal_webhook_events (processing_status, received_at DESC);

ALTER TABLE public.mentorship_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cal_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mentorship_bookings, public.cal_webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mentorship_bookings, public.cal_webhook_events TO service_role;
REVOKE DELETE ON TABLE public.mentorship_bookings, public.cal_webhook_events FROM service_role;

CREATE OR REPLACE FUNCTION public.apply_calcom_mentorship_webhook_event(
  p_event_hash text,
  p_trigger_event text,
  p_cal_booking_id bigint,
  p_cal_booking_uid text,
  p_reschedule_from_uid text,
  p_cal_event_type_id bigint,
  p_cal_event_type_slug text,
  p_event_type_name text,
  p_attendee_name text,
  p_attendee_email text,
  p_attendee_email_hash text,
  p_scheduled_start_at timestamptz,
  p_scheduled_end_at timestamptz,
  p_attendee_timezone text,
  p_provider_occurred_at timestamptz,
  p_payment_amount integer,
  p_payment_currency text,
  p_cancelled_at timestamptz
)
RETURNS TABLE (result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_id uuid;
  v_booking public.mentorship_bookings%ROWTYPE;
  v_next_booking_status text;
  v_next_payment_status text;
  v_next_cancelled_at timestamptz;
BEGIN
  IF p_event_hash !~ '^[a-f0-9]{64}$'
    OR p_trigger_event NOT IN ('BOOKING_CREATED', 'BOOKING_PAID', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED')
    OR p_cal_booking_uid IS NULL OR char_length(p_cal_booking_uid) NOT BETWEEN 1 AND 255
    OR (p_reschedule_from_uid IS NOT NULL AND char_length(p_reschedule_from_uid) NOT BETWEEN 1 AND 255)
    OR (
      p_trigger_event = 'BOOKING_RESCHEDULED'
      AND (p_reschedule_from_uid IS NULL OR p_reschedule_from_uid = p_cal_booking_uid)
    )
    OR (p_trigger_event <> 'BOOKING_RESCHEDULED' AND p_reschedule_from_uid IS NOT NULL)
    OR p_attendee_email_hash !~ '^[a-f0-9]{64}$'
    OR p_attendee_email IS NULL OR p_attendee_email <> lower(btrim(p_attendee_email))
    OR p_attendee_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    OR p_attendee_email_hash <> encode(extensions.digest(p_attendee_email, 'sha256'), 'hex')
    OR p_attendee_name IS NULL OR char_length(btrim(p_attendee_name)) NOT BETWEEN 1 AND 160
    OR p_scheduled_start_at IS NULL OR p_scheduled_end_at IS NULL OR p_scheduled_end_at <= p_scheduled_start_at
    OR p_provider_occurred_at IS NULL
    OR (p_payment_amount IS NULL) <> (p_payment_currency IS NULL)
    OR (p_payment_amount IS NOT NULL AND p_payment_amount < 0)
    OR (p_payment_currency IS NOT NULL AND p_payment_currency !~ '^[A-Z]{3}$') THEN
    RAISE EXCEPTION 'Invalid Cal.com mentorship webhook input' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(LEAST(p_cal_booking_uid, COALESCE(p_reschedule_from_uid, p_cal_booking_uid)), 0)
  );
  IF p_reschedule_from_uid IS NOT NULL AND p_reschedule_from_uid <> p_cal_booking_uid THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(GREATEST(p_cal_booking_uid, p_reschedule_from_uid), 0));
  END IF;

  INSERT INTO public.cal_webhook_events (
    event_hash, trigger_event, cal_booking_uid, provider_occurred_at, processing_status
  ) VALUES (
    p_event_hash, p_trigger_event, p_cal_booking_uid, p_provider_occurred_at, 'processing'
  )
  ON CONFLICT (event_hash) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN QUERY SELECT 'duplicate'::text;
    RETURN;
  END IF;

  SELECT * INTO v_booking
  FROM public.mentorship_bookings
  WHERE cal_booking_uid = p_cal_booking_uid
    OR (p_trigger_event = 'BOOKING_RESCHEDULED' AND cal_booking_uid = p_reschedule_from_uid)
  ORDER BY CASE WHEN cal_booking_uid = p_cal_booking_uid THEN 0 ELSE 1 END
  LIMIT 1
  FOR UPDATE;

  IF FOUND AND v_booking.last_provider_event_at IS NOT NULL
    AND p_provider_occurred_at <= v_booking.last_provider_event_at THEN
    UPDATE public.cal_webhook_events
      SET processing_status = 'ignored', error_code = 'stale_event'
      WHERE id = v_event_id;
    RETURN QUERY SELECT 'stale'::text;
    RETURN;
  END IF;

  v_next_booking_status := CASE p_trigger_event
    WHEN 'BOOKING_CANCELLED' THEN 'cancelled'
    WHEN 'BOOKING_RESCHEDULED' THEN 'rescheduled'
    ELSE COALESCE(v_booking.booking_status, 'created')
  END;
  v_next_payment_status := CASE p_trigger_event
    WHEN 'BOOKING_PAID' THEN 'paid'
    ELSE COALESCE(v_booking.payment_status, 'unknown')
  END;
  v_next_cancelled_at := CASE
    WHEN p_trigger_event = 'BOOKING_CANCELLED' THEN COALESCE(p_cancelled_at, p_provider_occurred_at)
    WHEN p_trigger_event = 'BOOKING_RESCHEDULED' THEN NULL
    ELSE v_booking.cancelled_at
  END;

  IF NOT FOUND THEN
    INSERT INTO public.mentorship_bookings (
      cal_booking_id, cal_booking_uid, cal_event_type_id, cal_event_type_slug, event_type_name,
      attendee_name, attendee_email, attendee_email_hash, scheduled_start_at, scheduled_end_at,
      attendee_timezone, booking_status, payment_status, payment_amount, payment_currency,
      last_provider_event_at, cancelled_at
    ) VALUES (
      p_cal_booking_id, p_cal_booking_uid, p_cal_event_type_id, p_cal_event_type_slug, p_event_type_name,
      p_attendee_name, p_attendee_email, p_attendee_email_hash, p_scheduled_start_at, p_scheduled_end_at,
      p_attendee_timezone, v_next_booking_status, v_next_payment_status,
      CASE WHEN p_trigger_event = 'BOOKING_PAID' THEN p_payment_amount ELSE NULL END,
      CASE WHEN p_trigger_event = 'BOOKING_PAID' THEN p_payment_currency ELSE NULL END,
      p_provider_occurred_at, v_next_cancelled_at
    );
  ELSE
    UPDATE public.mentorship_bookings
      SET cal_booking_uid = CASE WHEN p_trigger_event = 'BOOKING_RESCHEDULED'
            THEN p_cal_booking_uid ELSE cal_booking_uid END,
          cal_booking_id = COALESCE(p_cal_booking_id, cal_booking_id),
          cal_event_type_id = COALESCE(p_cal_event_type_id, cal_event_type_id),
          cal_event_type_slug = COALESCE(p_cal_event_type_slug, cal_event_type_slug),
          event_type_name = COALESCE(p_event_type_name, event_type_name),
          attendee_name = p_attendee_name,
          attendee_email = p_attendee_email,
          attendee_email_hash = p_attendee_email_hash,
          scheduled_start_at = p_scheduled_start_at,
          scheduled_end_at = p_scheduled_end_at,
          attendee_timezone = COALESCE(p_attendee_timezone, attendee_timezone),
          booking_status = v_next_booking_status,
          payment_status = v_next_payment_status,
          payment_amount = CASE WHEN p_trigger_event = 'BOOKING_PAID' THEN p_payment_amount ELSE payment_amount END,
          payment_currency = CASE WHEN p_trigger_event = 'BOOKING_PAID' THEN p_payment_currency ELSE payment_currency END,
          last_provider_event_at = p_provider_occurred_at,
          cancelled_at = v_next_cancelled_at
      WHERE id = v_booking.id;
  END IF;

  UPDATE public.cal_webhook_events
    SET processing_status = 'processed', error_code = NULL
    WHERE id = v_event_id;

  RETURN QUERY SELECT 'processed'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.set_mentorship_bookings_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_calcom_mentorship_webhook_event(
  text, text, bigint, text, text, bigint, text, text, text, text, text,
  timestamptz, timestamptz, text, timestamptz, integer, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_calcom_mentorship_webhook_event(
  text, text, bigint, text, text, bigint, text, text, text, text, text,
  timestamptz, timestamptz, text, timestamptz, integer, text, timestamptz
) TO service_role;

COMMIT;
