import "server-only";

import { CAREER_PLANNER_MARKETING_CONSENT_TEXT } from "@/lib/leads/career-planner-consent";
import {
  insertUserEvent,
  LeadCaptureError,
  upsertEmailSubscriptionForLead,
  upsertLeadByEmail,
} from "@/lib/leads/capture-shared";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SOURCE = "career_planner";
const PRODUCT_KEY = "career_planner";
const LIST_KEY = "career_planner";
const INTEREST_STATUS = "interested";
const EVENT_NAME = "career_planner_report_download_requested";
const EVENT_CATEGORY = "lead";

export class CareerPlannerLeadCaptureError extends LeadCaptureError {
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

  try {
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id")
      .eq("product_key", PRODUCT_KEY)
      .maybeSingle();

    if (productError || !product) {
      throw new CareerPlannerLeadCaptureError();
    }

    const leadId = await upsertLeadByEmail(admin, normalizedEmail, now, {
      source: SOURCE,
      marketingConsent: true,
    });

    await upsertLeadProductInterest(admin, leadId, product.id, now);
    await upsertEmailSubscriptionForLead(admin, leadId, now, {
      listKey: LIST_KEY,
      source: SOURCE,
      consentText: CAREER_PLANNER_MARKETING_CONSENT_TEXT,
    });
    await insertUserEvent(admin, {
      leadId,
      productId: product.id,
      eventName: EVENT_NAME,
      eventCategory: EVENT_CATEGORY,
      source: SOURCE,
      metadata: {
        download_type: "free_report",
      },
      occurredAt: now,
    });
  } catch (error) {
    if (error instanceof CareerPlannerLeadCaptureError) {
      throw error;
    }
    if (error instanceof LeadCaptureError) {
      throw new CareerPlannerLeadCaptureError();
    }
    throw error;
  }
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

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
