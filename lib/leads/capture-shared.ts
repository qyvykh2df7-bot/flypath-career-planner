import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type LeadCaptureAdminClient = ReturnType<typeof getSupabaseAdmin>;

export class LeadCaptureError extends Error {
  constructor(message = "Lead capture failed") {
    super(message);
    this.name = "LeadCaptureError";
  }
}

const SUBSCRIPTION_STATUS = "subscribed";
const DEFAULT_FUNNEL_STAGE = "interested";

export async function upsertLeadByEmail(
  admin: LeadCaptureAdminClient,
  normalizedEmail: string,
  now: string,
  options: {
    source: string;
    marketingConsent: boolean;
    funnelStage?: string;
  },
): Promise<string> {
  const funnelStage = options.funnelStage ?? DEFAULT_FUNNEL_STAGE;

  const { data: existingLead, error: selectError } = await admin
    .from("leads")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (selectError) {
    throw new LeadCaptureError();
  }

  if (existingLead) {
    const { data: updatedLead, error: updateError } = await admin
      .from("leads")
      .update({
        latest_source: options.source,
        funnel_stage: funnelStage,
        last_seen_at: now,
        marketing_consent: options.marketingConsent,
      })
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
): Promise<void> {
  const { data: existingSubscription, error: selectError } = await admin
    .from("email_subscriptions")
    .select("id")
    .eq("lead_id", leadId)
    .eq("list_key", options.listKey)
    .maybeSingle();

  if (selectError) {
    throw new LeadCaptureError();
  }

  if (existingSubscription) {
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
    return;
  }

  const { error: insertError } = await admin.from("email_subscriptions").insert({
    lead_id: leadId,
    list_key: options.listKey,
    status: SUBSCRIPTION_STATUS,
    source: options.source,
    consented_at: now,
    consent_text: options.consentText,
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
    occurredAt: string;
  },
): Promise<void> {
  const { error: insertError } = await admin.from("user_events").insert({
    lead_id: options.leadId,
    product_id: options.productId ?? null,
    event_name: options.eventName,
    event_category: options.eventCategory,
    source: options.source,
    metadata: options.metadata ?? {},
    occurred_at: options.occurredAt,
  });

  if (insertError) {
    throw new LeadCaptureError();
  }
}
