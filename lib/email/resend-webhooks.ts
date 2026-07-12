import "server-only";

import { Resend } from "resend";

import type { getSupabaseAdmin } from "@/lib/supabase/admin";

export const RESEND_EMAIL_WEBHOOK_EVENT_TYPES = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.failed",
  "email.opened",
  "email.clicked",
  "email.complained",
  "email.suppressed",
] as const;

type ResendEmailWebhookEventType = (typeof RESEND_EMAIL_WEBHOOK_EVENT_TYPES)[number];

export type ResendWebhookHeaders = {
  id: string;
  timestamp: string;
  signature: string;
};

export type VerifiedResendWebhookEvent = {
  type: string;
  providerEventId: string;
  providerMessageId: string | null;
  occurredAt: string | null;
};

export type ProcessableResendWebhookEvent = VerifiedResendWebhookEvent & {
  type: ResendEmailWebhookEventType;
  providerMessageId: string;
  occurredAt: string;
};

export type ResendWebhookApplyResult = "processed" | "duplicate" | "delivery_not_found";

type ResendWebhookClient = {
  webhooks: {
    verify(input: {
      payload: string;
      headers: ResendWebhookHeaders;
      webhookSecret: string;
    }): unknown;
  };
};

type EmailAdminClient = ReturnType<typeof getSupabaseAdmin>;

export class ResendWebhookPayloadError extends Error {
  constructor() {
    super("Resend webhook payload is invalid");
    this.name = "ResendWebhookPayloadError";
  }
}

export class ResendWebhookPersistenceError extends Error {
  constructor() {
    super("Resend webhook persistence failed");
    this.name = "ResendWebhookPersistenceError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeExternalIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 255;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export function isAllowedResendEmailWebhookEvent(
  eventType: string,
): eventType is ResendEmailWebhookEventType {
  return (RESEND_EMAIL_WEBHOOK_EVENT_TYPES as readonly string[]).includes(eventType);
}

export function parseVerifiedResendWebhookEvent(
  payload: unknown,
  providerEventId: string,
): VerifiedResendWebhookEvent {
  if (!isSafeExternalIdentifier(providerEventId) || !isRecord(payload) || typeof payload.type !== "string") {
    throw new ResendWebhookPayloadError();
  }

  if (!isAllowedResendEmailWebhookEvent(payload.type)) {
    return {
      type: payload.type,
      providerEventId,
      providerMessageId: null,
      occurredAt: null,
    };
  }

  const data = isRecord(payload.data) ? payload.data : null;
  if (!data || !isSafeExternalIdentifier(data.email_id) || !isTimestamp(payload.created_at)) {
    throw new ResendWebhookPayloadError();
  }

  return {
    type: payload.type,
    providerEventId,
    providerMessageId: data.email_id,
    occurredAt: new Date(payload.created_at).toISOString(),
  };
}

export function isProcessableResendWebhookEvent(
  event: VerifiedResendWebhookEvent,
): event is ProcessableResendWebhookEvent {
  return (
    isAllowedResendEmailWebhookEvent(event.type) &&
    typeof event.providerMessageId === "string" &&
    typeof event.occurredAt === "string"
  );
}

export function verifyResendWebhook(
  input: { payload: string; headers: ResendWebhookHeaders; webhookSecret: string },
  client: ResendWebhookClient = new Resend(),
): VerifiedResendWebhookEvent {
  const verifiedPayload = client.webhooks.verify(input);
  return parseVerifiedResendWebhookEvent(verifiedPayload, input.headers.id);
}

export async function applyResendWebhookEvent(
  admin: EmailAdminClient,
  event: ProcessableResendWebhookEvent,
): Promise<ResendWebhookApplyResult> {
  if (!isProcessableResendWebhookEvent(event)) {
    throw new ResendWebhookPayloadError();
  }

  const { data, error } = await admin
    .rpc("apply_resend_email_webhook_event", {
      p_provider: "resend",
      p_provider_event_id: event.providerEventId,
      p_event_type: event.type,
      p_provider_message_id: event.providerMessageId,
      p_occurred_at: event.occurredAt,
    })
    .single();

  if (
    error ||
    !isRecord(data) ||
    (data.result !== "processed" && data.result !== "duplicate" && data.result !== "delivery_not_found")
  ) {
    throw new ResendWebhookPersistenceError();
  }

  return data.result;
}
