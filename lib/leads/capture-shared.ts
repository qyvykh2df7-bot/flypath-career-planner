import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TrackingContext } from "@/lib/tracking/events";
import { getTrackingContextMetadata } from "@/lib/tracking/server";

export type LeadCaptureAdminClient = ReturnType<typeof getSupabaseAdmin>;

export class LeadCaptureError extends Error {
  constructor(message = "Lead capture failed") {
    super(message);
    this.name = "LeadCaptureError";
  }
}

export type UserEventInsertResult = "inserted" | "duplicate";

const SUBSCRIPTION_STATUS = "subscribed";
const DEFAULT_FUNNEL_STAGE = "interested";
const SUPPRESSED_EMAIL_SUBSCRIPTION_STATUSES = new Set([
  "bounced",
  "complained",
  "blocked",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export type EmailSubscriptionStatus =
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "blocked";

export type EmailSubscriptionEventType = "subscribed" | "resubscribed";

async function insertEmailSubscriptionEvent(
  admin: LeadCaptureAdminClient,
  input: {
    subscriptionId: string;
    leadId: string;
    listKey: string;
    eventType: EmailSubscriptionEventType;
    source: string;
    consentText: string;
    occurredAt: string;
  },
): Promise<void> {
  const { error } = await admin.from("email_subscription_events").insert({
    subscription_id: input.subscriptionId,
    lead_id: input.leadId,
    list_key: input.listKey,
    event_type: input.eventType,
    source: input.source,
    consent_text: input.consentText,
    occurred_at: input.occurredAt,
  });

  if (error) throw new LeadCaptureError();
}

export async function upsertLeadByEmail(
  admin: LeadCaptureAdminClient,
  normalizedEmail: string,
  now: string,
  options: {
    source: string;
    marketingConsent: boolean;
    funnelStage?: string;
    fullName?: string;
    touchMarketingConsent?: boolean;
  },
): Promise<string> {
  const funnelStage = options.funnelStage ?? DEFAULT_FUNNEL_STAGE;
  const normalizedFullName = options.fullName?.trim() || null;

  const { data: existingLead, error: selectError } = await admin
    .from("leads")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (selectError) {
    throw new LeadCaptureError();
  }

  if (existingLead) {
    const updatePayload: {
      latest_source: string;
      funnel_stage: string;
      last_seen_at: string;
      marketing_consent?: boolean;
      full_name?: string;
    } = {
      latest_source: options.source,
      funnel_stage: funnelStage,
      last_seen_at: now,
    };

    if (options.touchMarketingConsent !== false) {
      updatePayload.marketing_consent = options.marketingConsent;
    }

    if (normalizedFullName) {
      updatePayload.full_name = normalizedFullName;
    }

    const { data: updatedLead, error: updateError } = await admin
      .from("leads")
      .update(updatePayload)
      .eq("id", existingLead.id)
      .select("id")
      .single();

    if (updateError || !updatedLead) {
      throw new LeadCaptureError();
    }

    return updatedLead.id;
  }

  const { data: insertedLead, error: insertError } = await admin
    .from("leads")
    .insert({
      email: normalizedEmail,
      full_name: normalizedFullName,
      first_source: options.source,
      latest_source: options.source,
      funnel_stage: funnelStage,
      first_seen_at: now,
      last_seen_at: now,
      marketing_consent: options.marketingConsent,
    })
    .select("id")
    .single();

  if (insertError || !insertedLead) {
    throw new LeadCaptureError();
  }

  return insertedLead.id;
}

export async function upsertEmailSubscriptionForLead(
  admin: LeadCaptureAdminClient,
  leadId: string,
  now: string,
  options: {
    listKey: string;
    source: string;
    consentText: string;
  },
): Promise<EmailSubscriptionStatus> {
  const { data: existingSubscription, error: selectError } = await admin
    .from("email_subscriptions")
    .select("id,status")
    .eq("lead_id", leadId)
    .eq("list_key", options.listKey)
    .maybeSingle();

  if (selectError) {
    throw new LeadCaptureError();
  }

  if (existingSubscription) {
    if (
      typeof existingSubscription.status === "string" &&
      SUPPRESSED_EMAIL_SUBSCRIPTION_STATUSES.has(existingSubscription.status)
    ) {
      return existingSubscription.status as EmailSubscriptionStatus;
    }

    if (existingSubscription.status === SUBSCRIPTION_STATUS) {
      return SUBSCRIPTION_STATUS;
    }

    const { error: updateError } = await admin
      .from("email_subscriptions")
      .update({
        status: SUBSCRIPTION_STATUS,
        source: options.source,
        consented_at: now,
        consent_text: options.consentText,
        unsubscribed_at: null,
        bounced_at: null,
        complained_at: null,
        blocked_at: null,
      })
      .eq("id", existingSubscription.id);

    if (updateError) {
      throw new LeadCaptureError();
    }

    await insertEmailSubscriptionEvent(admin, {
      subscriptionId: existingSubscription.id,
      leadId,
      listKey: options.listKey,
      eventType: "resubscribed",
      source: options.source,
      consentText: options.consentText,
      occurredAt: now,
    });
    return SUBSCRIPTION_STATUS;
  }

  const { data: insertedSubscription, error: insertError } = await admin
    .from("email_subscriptions")
    .insert({
      lead_id: leadId,
      list_key: options.listKey,
      status: SUBSCRIPTION_STATUS,
      source: options.source,
      consented_at: now,
      consent_text: options.consentText,
    })
    .select("id")
    .single();

  if (insertError || !isRecord(insertedSubscription) || typeof insertedSubscription.id !== "string") {
    throw new LeadCaptureError();
  }

  await insertEmailSubscriptionEvent(admin, {
    subscriptionId: insertedSubscription.id,
    leadId,
    listKey: options.listKey,
    eventType: "subscribed",
    source: options.source,
    consentText: options.consentText,
    occurredAt: now,
  });

  return SUBSCRIPTION_STATUS;
}

export async function upsertLeadProductInterest(
  admin: LeadCaptureAdminClient,
  leadId: string,
  productId: string,
  now: string,
  options: {
    source: string;
    status: string;
  },
): Promise<void> {
  const { data: existingInterest, error: selectError } = await admin
    .from("lead_product_interests")
    .select("id")
    .eq("lead_id", leadId)
    .eq("product_id", productId)
    .maybeSingle();

  if (selectError) {
    throw new LeadCaptureError();
  }

  if (existingInterest) {
    const { error: updateError } = await admin
      .from("lead_product_interests")
      .update({
        latest_source: options.source,
        status: options.status,
        last_seen_at: now,
      })
      .eq("id", existingInterest.id);

    if (updateError) {
      throw new LeadCaptureError();
    }
    return;
  }

  const { error: insertError } = await admin.from("lead_product_interests").insert({
    lead_id: leadId,
    product_id: productId,
    first_source: options.source,
    latest_source: options.source,
    status: options.status,
    first_seen_at: now,
    last_seen_at: now,
  });

  if (insertError) {
    throw new LeadCaptureError();
  }
}

export async function insertUserEvent(
  admin: LeadCaptureAdminClient,
  options: {
    leadId: string;
    productId?: string | null;
    eventName: string;
    eventCategory: string;
    source: string;
    metadata?: Record<string, unknown>;
    trackingContext?: TrackingContext | null;
    idempotencyKey?: string;
    occurredAt: string;
  },
): Promise<UserEventInsertResult> {
  const trackingContext = options.trackingContext ?? null;
  const { error: insertError } = await admin.from("user_events").insert({
    lead_id: options.leadId,
    product_id: options.productId ?? null,
    event_name: options.eventName,
    event_category: options.eventCategory,
    source: options.source,
    session_id: trackingContext?.session_id ?? null,
    anonymous_id: trackingContext?.anonymous_id ?? null,
    page_path: trackingContext?.page_path ?? null,
    referrer: trackingContext?.referrer ?? null,
    idempotency_key: options.idempotencyKey ?? null,
    metadata: {
      ...getTrackingContextMetadata(trackingContext),
      ...(options.metadata ?? {}),
    },
    occurred_at: options.occurredAt,
  });

  if (
    insertError &&
    typeof insertError === "object" &&
    "code" in insertError &&
    insertError.code === "23505" &&
    options.idempotencyKey
  ) {
    return "duplicate";
  }

  if (insertError) {
    throw new LeadCaptureError();
  }

  return "inserted";
}
