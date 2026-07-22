import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const CALCOM_MENTORSHIP_WEBHOOK_EVENTS = [
  "BOOKING_CREATED",
  "BOOKING_PAID",
  "BOOKING_CANCELLED",
  "BOOKING_RESCHEDULED",
] as const;

export type CalcomMentorshipWebhookEventType = (typeof CALCOM_MENTORSHIP_WEBHOOK_EVENTS)[number];
export type CalcomMentorshipWebhookResult = "processed" | "duplicate" | "stale";

type CalcomWebhookEnvironment = {
  CALCOM_WEBHOOK_SECRET?: string;
  CALCOM_MENTORSHIP_EVENT_TYPE_ID?: string;
};

type CalcomWebhookAdmin = Pick<ReturnType<typeof getSupabaseAdmin>, "rpc">;

export type CalcomMentorshipWebhook = {
  eventHash: string;
  triggerEvent: CalcomMentorshipWebhookEventType;
  calBookingId: number | null;
  calBookingUid: string;
  rescheduleFromUid: string | null;
  calEventTypeId: number | null;
  calEventTypeSlug: string | null;
  eventTypeName: string | null;
  attendeeName: string;
  attendeeEmail: string;
  attendeeEmailHash: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  attendeeTimezone: string | null;
  providerOccurredAt: string;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  cancelledAt: string | null;
};

export class CalcomWebhookError extends Error {
  constructor(public readonly kind: "configuration" | "signature" | "payload" | "unavailable") {
    super("Cal.com webhook could not be processed");
    this.name = "CalcomWebhookError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedEvent(value: unknown): value is CalcomMentorshipWebhookEventType {
  return typeof value === "string" && (CALCOM_MENTORSHIP_WEBHOOK_EVENTS as readonly string[]).includes(value);
}

function safeText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum ? normalized : null;
}

function optionalText(value: unknown, maximum: number): string | null {
  return value === null || value === undefined ? null : safeText(value, maximum);
}

function safeInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function safeTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function safeEmail(value: unknown): string | null {
  const email = safeText(value, 320)?.toLowerCase() ?? null;
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  return values.find(isRecord) ?? null;
}

function firstValue(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function firstValueFromRecords(records: Array<Record<string, unknown> | null>, ...keys: string[]): unknown {
  for (const record of records) {
    if (!record) continue;
    const value = firstValue(record, ...keys);
    if (value !== undefined) return value;
  }
  return undefined;
}

function attendees(payload: Record<string, unknown>): Record<string, unknown> | null {
  const candidate = payload.attendees;
  if (Array.isArray(candidate) && candidate.length > 0 && isRecord(candidate[0])) return candidate[0];
  return firstRecord(payload.attendee);
}

function payment(payload: Record<string, unknown>): Record<string, unknown> | null {
  return firstRecord(payload.payment, payload.paymentInfo, payload.payment_info);
}

function hmacSignature(value: string): string | null {
  const normalized = value.trim().replace(/^sha256=/i, "");
  return /^[a-f0-9]{64}$/i.test(normalized) ? normalized.toLowerCase() : null;
}

function getWebhookSecret(environment: CalcomWebhookEnvironment = process.env as CalcomWebhookEnvironment): string {
  const secret = environment.CALCOM_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) throw new CalcomWebhookError("configuration");
  return secret;
}

function getMentorshipEventTypeId(
  environment: CalcomWebhookEnvironment = process.env as CalcomWebhookEnvironment,
): number {
  const eventTypeId = safeInteger(environment.CALCOM_MENTORSHIP_EVENT_TYPE_ID?.trim());
  if (eventTypeId === null || eventTypeId <= 0) throw new CalcomWebhookError("configuration");
  return eventTypeId;
}

export function isSupportedCalcomMentorshipWebhookEvent(value: unknown): value is CalcomMentorshipWebhookEventType {
  return isSupportedEvent(value);
}

export function verifyCalcomWebhookSignature(
  rawPayload: string,
  signature: string,
  environment: CalcomWebhookEnvironment = process.env as CalcomWebhookEnvironment,
): void {
  const received = hmacSignature(signature);
  if (!received) throw new CalcomWebhookError("signature");

  const expected = createHmac("sha256", getWebhookSecret(environment)).update(rawPayload).digest("hex");
  const receivedBytes = Buffer.from(received, "hex");
  const expectedBytes = Buffer.from(expected, "hex");
  if (receivedBytes.length !== expectedBytes.length || !timingSafeEqual(receivedBytes, expectedBytes)) {
    throw new CalcomWebhookError("signature");
  }
}

export function parseCalcomMentorshipWebhook(
  rawPayload: string,
  environment: CalcomWebhookEnvironment = process.env as CalcomWebhookEnvironment,
): CalcomMentorshipWebhook {
  let decoded: unknown;
  try {
    decoded = JSON.parse(rawPayload);
  } catch {
    throw new CalcomWebhookError("payload");
  }

  if (!isRecord(decoded) || !isSupportedEvent(decoded.triggerEvent) || !isRecord(decoded.payload)) {
    throw new CalcomWebhookError("payload");
  }

  const payload = decoded.payload;
  const attendee = attendees(payload);
  const eventType = firstRecord(payload.eventType, payload.event_type);
  const paymentDetails = payment(payload);
  const triggerEvent = decoded.triggerEvent;
  const calBookingUid = safeText(firstValue(payload, "uid", "bookingUid", "booking_uid"), 255);
  const rescheduleFromUid = triggerEvent === "BOOKING_RESCHEDULED"
    ? safeText(firstValue(payload, "rescheduleUid", "reschedule_uid"), 255)
    : null;
  const calEventTypeId = safeInteger(
    (eventType ? firstValue(eventType, "id") : undefined)
    ?? firstValue(payload, "eventTypeId", "event_type_id"),
  );
  const attendeeName = attendee ? safeText(firstValue(attendee, "name", "fullName", "full_name"), 160) : null;
  const attendeeEmail = attendee ? safeEmail(firstValue(attendee, "email")) : null;
  const scheduledStartAt = safeTimestamp(firstValue(payload, "startTime", "start", "startAt"));
  const scheduledEndAt = safeTimestamp(firstValue(payload, "endTime", "end", "endAt"));
  const providerOccurredAt = safeTimestamp(firstValue(decoded, "createdAt", "created_at"))
    ?? safeTimestamp(firstValue(payload, "createdAt", "created_at"));
  const paymentAmount = triggerEvent === "BOOKING_PAID"
    ? safeInteger(firstValueFromRecords([paymentDetails, payload], "price", "amount", "amountPaid", "amount_paid"))
    : null;
  const paymentCurrency = triggerEvent === "BOOKING_PAID"
    ? safeText(firstValueFromRecords([paymentDetails, payload], "currency"), 3)?.toUpperCase() ?? null
    : null;
  const cancelledAt = triggerEvent === "BOOKING_CANCELLED"
    ? safeTimestamp(firstValue(payload, "cancelledAt", "cancelled_at")) ?? providerOccurredAt
    : null;

  if (
    !calBookingUid ||
    (triggerEvent === "BOOKING_RESCHEDULED" && (!rescheduleFromUid || rescheduleFromUid === calBookingUid)) ||
    calEventTypeId === null || calEventTypeId !== getMentorshipEventTypeId(environment) ||
    !attendeeName || !attendeeEmail || !scheduledStartAt || !scheduledEndAt ||
    Date.parse(scheduledEndAt) <= Date.parse(scheduledStartAt) || !providerOccurredAt ||
    (triggerEvent === "BOOKING_PAID" && (paymentAmount === null || !paymentCurrency || !/^[A-Z]{3}$/.test(paymentCurrency)))
  ) {
    throw new CalcomWebhookError("payload");
  }

  return {
    eventHash: createHash("sha256").update(rawPayload).digest("hex"),
    triggerEvent,
    calBookingId: safeInteger(firstValue(payload, "bookingId", "booking_id", "id")),
    calBookingUid,
    rescheduleFromUid,
    calEventTypeId,
    calEventTypeSlug: optionalText(firstValueFromRecords([eventType, payload], "slug", "eventTypeSlug", "event_type_slug", "type"), 160),
    eventTypeName: optionalText(firstValueFromRecords([eventType, payload], "title", "name", "eventTypeName", "event_type_name"), 200),
    attendeeName,
    attendeeEmail,
    attendeeEmailHash: createHash("sha256").update(attendeeEmail).digest("hex"),
    scheduledStartAt,
    scheduledEndAt,
    attendeeTimezone: attendee ? optionalText(firstValue(attendee, "timeZone", "timezone"), 80) : null,
    providerOccurredAt,
    paymentAmount,
    paymentCurrency,
    cancelledAt,
  };
}

function isRpcResult(value: unknown): value is { result: CalcomMentorshipWebhookResult } {
  return isRecord(value) && (value.result === "processed" || value.result === "duplicate" || value.result === "stale");
}

export async function applyCalcomMentorshipWebhook(
  event: CalcomMentorshipWebhook,
  admin: CalcomWebhookAdmin = getSupabaseAdmin(),
): Promise<CalcomMentorshipWebhookResult> {
  const { data, error } = await admin.rpc("apply_calcom_mentorship_webhook_event", {
    p_event_hash: event.eventHash,
    p_trigger_event: event.triggerEvent,
    p_cal_booking_id: event.calBookingId,
    p_cal_booking_uid: event.calBookingUid,
    p_reschedule_from_uid: event.rescheduleFromUid,
    p_cal_event_type_id: event.calEventTypeId,
    p_cal_event_type_slug: event.calEventTypeSlug,
    p_event_type_name: event.eventTypeName,
    p_attendee_name: event.attendeeName,
    p_attendee_email: event.attendeeEmail,
    p_attendee_email_hash: event.attendeeEmailHash,
    p_scheduled_start_at: event.scheduledStartAt,
    p_scheduled_end_at: event.scheduledEndAt,
    p_attendee_timezone: event.attendeeTimezone,
    p_provider_occurred_at: event.providerOccurredAt,
    p_payment_amount: event.paymentAmount,
    p_payment_currency: event.paymentCurrency,
    p_cancelled_at: event.cancelledAt,
  }).single();

  if (error || !isRpcResult(data)) throw new CalcomWebhookError("unavailable");
  return data.result;
}
