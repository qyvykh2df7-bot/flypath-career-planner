import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712220000_create_calcom_mentorship_booking_sync.sql"),
  "utf8",
);

describe("Cal.com mentorship operational projection migration", () => {
  it("keeps booking data operational, constrained and separated from Commerce", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.mentorship_bookings");
    expect(migration).toContain("cal_booking_uid text NOT NULL");
    expect(migration).toContain("attendee_email_hash text NOT NULL");
    expect(migration).toContain("booking_status IN ('created', 'confirmed', 'cancelled', 'rescheduled', 'rejected', 'completed', 'no_show')");
    expect(migration).toContain("payment_status IN ('unknown', 'pending', 'paid', 'failed', 'refunded')");
    expect(migration).not.toContain("CREATE TABLE IF NOT EXISTS public.orders");
    expect(migration).not.toContain("CREATE TABLE IF NOT EXISTS public.product_prices");
  });

  it("stores only an event hash, applies events atomically and rejects stale updates", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.cal_webhook_events");
    expect(migration).toContain("event_hash text NOT NULL UNIQUE");
    expect(migration).not.toContain("payload jsonb");
    expect(migration).toContain("apply_calcom_mentorship_webhook_event");
    expect(migration).toContain("PERFORM pg_advisory_xact_lock");
    expect(migration).toContain("ON CONFLICT (event_hash) DO NOTHING");
    expect(migration).toContain("p_provider_occurred_at <= v_booking.last_provider_event_at");
    expect(migration).toContain("'stale_event'");
  });

  it("moves a rescheduled booking from the previous Cal.com UID to the new UID", () => {
    expect(migration).toContain("p_reschedule_from_uid text");
    expect(migration).toContain("cal_booking_uid = p_reschedule_from_uid");
    expect(migration).toContain("cal_booking_uid = CASE WHEN p_trigger_event = 'BOOKING_RESCHEDULED'");
  });

  it("enables RLS and grants table and RPC access only to service_role", () => {
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.mentorship_bookings, public.cal_webhook_events FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.apply_calcom_mentorship_webhook_event");
  });
});
