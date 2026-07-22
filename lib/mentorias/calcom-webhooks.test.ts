import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getAdmin: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));

import {
  applyCalcomMentorshipWebhook,
  CalcomWebhookError,
  parseCalcomMentorshipWebhook,
  verifyCalcomWebhookSignature,
} from "./calcom-webhooks";

const secret = "calcom_test_webhook_secret_123456";
const environment = {
  CALCOM_WEBHOOK_SECRET: secret,
  CALCOM_MENTORSHIP_EVENT_TYPE_ID: "9001",
};

function payload(triggerEvent = "BOOKING_CREATED", overrides: Record<string, unknown> = {}) {
  const booking: Record<string, unknown> = {
    bookingId: 7001,
    uid: "cal-booking-uid-1",
    eventType: { id: 9001, slug: "mentoria-flypath", title: "Mentoría FlyPath" },
    startTime: "2026-08-01T10:00:00.000Z",
    endTime: "2026-08-01T10:45:00.000Z",
    attendees: [{ name: "Ada Lovelace", email: "ADA@EXAMPLE.TEST", timeZone: "Europe/Madrid" }],
    ...overrides,
  };
  if (triggerEvent === "BOOKING_PAID" && booking.price === undefined && !booking.payment) {
    booking.price = 4495;
    booking.currency = "eur";
  }
  if (triggerEvent === "BOOKING_RESCHEDULED" && booking.rescheduleUid === undefined) {
    booking.rescheduleUid = "cal-booking-uid-original";
  }
  return JSON.stringify({ triggerEvent, createdAt: "2026-07-21T12:00:00.000Z", payload: booking });
}

function signed(raw: string) {
  return createHmac("sha256", secret).update(raw).digest("hex");
}

function rpcResponse(result: "processed" | "duplicate" | "stale") {
  const single = vi.fn().mockResolvedValue({ data: { result }, error: null });
  mocks.rpc.mockReturnValue({ single });
  return single;
}

describe("Cal.com mentorship webhook boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
  });

  it("verifies the raw HMAC SHA-256 payload without accepting an altered signature", () => {
    const raw = payload();
    expect(() => verifyCalcomWebhookSignature(raw, signed(raw), environment)).not.toThrow();
    expect(() => verifyCalcomWebhookSignature(`${raw} `, signed(raw), environment))
      .toThrow(expect.objectContaining({ kind: "signature" }));
    expect(() => verifyCalcomWebhookSignature(raw, "invalid", { CALCOM_WEBHOOK_SECRET: secret }))
      .toThrow(expect.objectContaining({ kind: "signature" }));
  });

  it("keeps unavailable configuration distinct from an invalid provider signature", () => {
    expect(() => verifyCalcomWebhookSignature(payload(), signed(payload()), {}))
      .toThrow(expect.objectContaining({ kind: "configuration" }));
  });

  it.each([
    ["BOOKING_CREATED", "created", "unknown"],
    ["BOOKING_PAID", "created", "paid"],
    ["BOOKING_CANCELLED", "cancelled", "unknown"],
    ["BOOKING_RESCHEDULED", "rescheduled", "unknown"],
  ])("parses a %s event into the closed operational projection", (triggerEvent, bookingStatus, paymentStatus) => {
    const event = parseCalcomMentorshipWebhook(payload(triggerEvent), environment);
    expect(event.triggerEvent).toBe(triggerEvent);
    expect(event.attendeeEmail).toBe("ada@example.test");
    expect(event.attendeeEmailHash).toMatch(/^[a-f0-9]{64}$/);
    expect(event.calBookingUid).toBe("cal-booking-uid-1");
    expect(event.rescheduleFromUid).toBe(
      triggerEvent === "BOOKING_RESCHEDULED" ? "cal-booking-uid-original" : null,
    );
    expect(event.scheduledEndAt).toBe("2026-08-01T10:45:00.000Z");
    if (paymentStatus === "paid") {
      expect(event.paymentAmount).toBe(4495);
      expect(event.paymentCurrency).toBe("EUR");
    } else {
      expect(event.paymentAmount).toBeNull();
    }
    if (bookingStatus === "cancelled") expect(event.cancelledAt).toBe("2026-07-21T12:00:00.000Z");
  });

  it("rejects incomplete booking data rather than persisting an unsafe partial projection", () => {
    expect(() => parseCalcomMentorshipWebhook(payload("BOOKING_CREATED", { attendees: [] }), environment))
      .toThrow(CalcomWebhookError);
    expect(() => parseCalcomMentorshipWebhook(payload("BOOKING_PAID", { payment: { amount: 4495 } }), environment))
      .toThrow(CalcomWebhookError);
    expect(() => parseCalcomMentorshipWebhook(JSON.stringify({ triggerEvent: "BOOKING_DELETED", payload: {} }), environment))
      .toThrow(CalcomWebhookError);
  });

  it("accepts Cal.com's documented flat booking fields without confusing the booking id with the event type id", () => {
    const raw = JSON.stringify({
      triggerEvent: "BOOKING_CREATED",
      createdAt: "2026-07-21T12:00:00.000Z",
      payload: {
        id: 7001,
        uid: "cal-booking-uid-1",
        eventTypeId: 9001,
        type: "standard-event-type",
        title: "Mentoría FlyPath",
        startTime: "2026-08-01T10:00:00Z",
        endTime: "2026-08-01T10:45:00Z",
        attendees: [{ name: "Ada Lovelace", email: "ada@example.test", timeZone: "Europe/Madrid" }],
      },
    });
    const event = parseCalcomMentorshipWebhook(raw, environment);
    expect(event.calBookingId).toBe(7001);
    expect(event.calEventTypeId).toBe(9001);
    expect(event.calEventTypeSlug).toBe("standard-event-type");
    expect(event.eventTypeName).toBe("Mentoría FlyPath");
  });

  it("accepts Cal.com's documented BOOKING_PAID price and currency fields", () => {
    const event = parseCalcomMentorshipWebhook(payload("BOOKING_PAID"), environment);

    expect(event.paymentAmount).toBe(4495);
    expect(event.paymentCurrency).toBe("EUR");
  });

  it("preserves Cal.com's previous booking UID when a booking is rescheduled", () => {
    const event = parseCalcomMentorshipWebhook(payload("BOOKING_RESCHEDULED", {
      uid: "cal-booking-uid-new",
      bookingId: 7002,
      rescheduleUid: "cal-booking-uid-original",
      rescheduleId: 7001,
    }), environment);

    expect(event.calBookingUid).toBe("cal-booking-uid-new");
    expect(event.rescheduleFromUid).toBe("cal-booking-uid-original");
  });

  it("rejects a reschedule that cannot identify the previous booking", () => {
    expect(() => parseCalcomMentorshipWebhook(payload("BOOKING_RESCHEDULED", {
      rescheduleUid: null,
    }), environment)).toThrow(expect.objectContaining({ kind: "payload" }));
    expect(() => parseCalcomMentorshipWebhook(payload("BOOKING_RESCHEDULED", {
      rescheduleUid: "cal-booking-uid-1",
    }), environment)).toThrow(expect.objectContaining({ kind: "payload" }));
  });

  it("accepts only events from the configured mentorship event type", () => {
    expect(() => parseCalcomMentorshipWebhook(payload(), environment)).not.toThrow();
    expect(() => parseCalcomMentorshipWebhook(payload("BOOKING_CREATED", {
      eventType: { id: 9002, slug: "other-event", title: "Other event" },
    }), environment)).toThrow(expect.objectContaining({ kind: "payload" }));
  });

  it("fails closed when the mentorship event type is not configured", () => {
    expect(() => parseCalcomMentorshipWebhook(payload(), { CALCOM_WEBHOOK_SECRET: secret }))
      .toThrow(expect.objectContaining({ kind: "configuration" }));
  });

  it("calls the atomic RPC with a normalized booking and payment update", async () => {
    rpcResponse("processed");
    const event = parseCalcomMentorshipWebhook(payload("BOOKING_PAID"), environment);
    await expect(applyCalcomMentorshipWebhook(event)).resolves.toBe("processed");
    expect(mocks.rpc).toHaveBeenCalledWith("apply_calcom_mentorship_webhook_event", expect.objectContaining({
      p_trigger_event: "BOOKING_PAID",
      p_cal_booking_uid: "cal-booking-uid-1",
      p_reschedule_from_uid: null,
      p_attendee_email: "ada@example.test",
      p_payment_amount: 4495,
      p_payment_currency: "EUR",
    }));
  });

  it("passes both booking UIDs to the atomic RPC for a reschedule", async () => {
    rpcResponse("processed");
    const event = parseCalcomMentorshipWebhook(payload("BOOKING_RESCHEDULED", {
      uid: "cal-booking-uid-new",
      rescheduleUid: "cal-booking-uid-original",
    }), environment);

    await expect(applyCalcomMentorshipWebhook(event)).resolves.toBe("processed");
    expect(mocks.rpc).toHaveBeenCalledWith("apply_calcom_mentorship_webhook_event", expect.objectContaining({
      p_cal_booking_uid: "cal-booking-uid-new",
      p_reschedule_from_uid: "cal-booking-uid-original",
    }));
  });

  it.each(["duplicate", "stale"] as const)("preserves the database idempotency result %s", async (result) => {
    rpcResponse(result);
    await expect(applyCalcomMentorshipWebhook(parseCalcomMentorshipWebhook(payload(), environment))).resolves.toBe(result);
  });

  it("fails closed when the server RPC returns an unexpected result", async () => {
    const single = vi.fn().mockResolvedValue({ data: { result: "anything" }, error: null });
    mocks.rpc.mockReturnValue({ single });
    await expect(applyCalcomMentorshipWebhook(parseCalcomMentorshipWebhook(payload(), environment))).rejects
      .toThrow(expect.objectContaining({ kind: "unavailable" }));
  });
});
