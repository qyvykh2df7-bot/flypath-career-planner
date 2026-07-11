import "server-only";

import { CAREER_PLANNER_MARKETING_CONSENT_TEXT } from "@/lib/leads/career-planner-consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SOURCE = "career_planner";
const PRODUCT_KEY = "career_planner";
const LIST_KEY = "career_planner";
const FUNNEL_STAGE = "interested";
const INTEREST_STATUS = "interested";
const SUBSCRIPTION_STATUS = "subscribed";
const EVENT_NAME = "career_planner_report_download_requested";
const EVENT_CATEGORY = "lead";

export class CareerPlannerLeadCaptureError extends Error {
  constructor(message = "Career Planner lead capture failed") {
    super(message);
    this.name = "CareerPlannerLeadCaptureError";
  }
}

/**
 * Persiste lead, interés, suscripción y evento de solicitud de descarga.
 *
 * Nota: Supabase JS no ofrece transacciones multi-tabla sin RPC.
 * Si un paso posterior falla, los anteriores pueden quedar escritos.
 */
export async function captureCareerPlannerReportDownload(
  normalizedEmail: string,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: product, error: productError } = await admin
    .from("products")
    .select("id")
    .eq("product_key", PRODUCT_KEY)
    .maybeSingle();

  if (productError || !product) {
    throw new CareerPlannerLeadCaptureError();
  }

  const leadId = await upsertLead(admin, normalizedEmail, now);
  await upsertLeadProductInterest(admin, leadId, product.id, now);
  await upsertEmailSubscription(admin, leadId, now);
  await insertDownloadRequestEvent(admin, leadId, product.id, now);
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

async function upsertLead(
  admin: AdminClient,
  normalizedEmail: string,
  now: string,
): Promise<string> {
  const { data: existingLead, error: selectError } = await admin
    .from("leads")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (selectError) {
    throw new CareerPlannerLeadCaptureError();
  }

  if (existingLead) {
    const { data: updatedLead, error: updateError } = await admin
      .from("leads")
      .update({
        latest_source: SOURCE,
        funnel_stage: FUNNEL_STAGE,
        last_seen_at: now,
        marketing_consent: true,
      })
      .eq("id", existingLead.id)
      .select("id")
      .single();

    if (updateError || !updatedLead) {
      throw new CareerPlannerLeadCaptureError();
    }

    return updatedLead.id;
  }

  const { data: insertedLead, error: insertError } = await admin
    .from("leads")
    .insert({
      email: normalizedEmail,
      first_source: SOURCE,
      latest_source: SOURCE,
      funnel_stage: FUNNEL_STAGE,
      first_seen_at: now,
      last_seen_at: now,
      marketing_consent: true,
    })
    .select("id")
    .single();

  if (insertError || !insertedLead) {
    throw new CareerPlannerLeadCaptureError();
  }

  return insertedLead.id;
}

async function upsertLeadProductInterest(
  admin: AdminClient,
  leadId: string,
  productId: string,
  now: string,
): Promise<void> {
  const { data: existingInterest, error: selectError } = await admin
    .from("lead_product_interests")
    .select("id")
    .eq("lead_id", leadId)
    .eq("product_id", productId)
    .maybeSingle();

  if (selectError) {
    throw new CareerPlannerLeadCaptureError();
  }

  if (existingInterest) {
    const { error: updateError } = await admin
      .from("lead_product_interests")
      .update({
        latest_source: SOURCE,
        status: INTEREST_STATUS,
        last_seen_at: now,
      })
      .eq("id", existingInterest.id);

    if (updateError) {
      throw new CareerPlannerLeadCaptureError();
    }
    return;
  }

  const { error: insertError } = await admin.from("lead_product_interests").insert({
    lead_id: leadId,
    product_id: productId,
    first_source: SOURCE,
    latest_source: SOURCE,
    status: INTEREST_STATUS,
    first_seen_at: now,
    last_seen_at: now,
  });

  if (insertError) {
    throw new CareerPlannerLeadCaptureError();
  }
}

async function upsertEmailSubscription(
  admin: AdminClient,
  leadId: string,
  now: string,
): Promise<void> {
  const { data: existingSubscription, error: selectError } = await admin
    .from("email_subscriptions")
    .select("id")
    .eq("lead_id", leadId)
    .eq("list_key", LIST_KEY)
    .maybeSingle();

  if (selectError) {
    throw new CareerPlannerLeadCaptureError();
  }

  if (existingSubscription) {
    const { error: updateError } = await admin
      .from("email_subscriptions")
      .update({
        status: SUBSCRIPTION_STATUS,
        source: SOURCE,
        consented_at: now,
        consent_text: CAREER_PLANNER_MARKETING_CONSENT_TEXT,
        unsubscribed_at: null,
        bounced_at: null,
        complained_at: null,
        blocked_at: null,
      })
      .eq("id", existingSubscription.id);

    if (updateError) {
      throw new CareerPlannerLeadCaptureError();
    }
    return;
  }

  const { error: insertError } = await admin.from("email_subscriptions").insert({
    lead_id: leadId,
    list_key: LIST_KEY,
    status: SUBSCRIPTION_STATUS,
    source: SOURCE,
    consented_at: now,
    consent_text: CAREER_PLANNER_MARKETING_CONSENT_TEXT,
  });

  if (insertError) {
    throw new CareerPlannerLeadCaptureError();
  }
}

async function insertDownloadRequestEvent(
  admin: AdminClient,
  leadId: string,
  productId: string,
  now: string,
): Promise<void> {
  const { error: insertError } = await admin.from("user_events").insert({
    lead_id: leadId,
    product_id: productId,
    event_name: EVENT_NAME,
    event_category: EVENT_CATEGORY,
    source: SOURCE,
    metadata: {
      download_type: "free_report",
    },
    occurred_at: now,
  });

  if (insertError) {
    throw new CareerPlannerLeadCaptureError();
  }
}
