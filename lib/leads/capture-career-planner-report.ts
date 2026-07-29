import "server-only";

import { CAREER_PLANNER_MARKETING_CONSENT_TEXT } from "@/lib/leads/career-planner-consent";
import {
  insertUserEvent,
  LeadCaptureError,
  upsertLeadByEmail,
  upsertLeadProductInterest,
} from "@/lib/leads/capture-shared";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TrackingContext } from "@/lib/tracking/events";
import { queueCareerPlannerConfirmation } from "@/lib/email/send-transactional-email";
import { requestMarketingConfirmation } from "./marketing-confirmation";

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
 * Persiste lead, interés y evento. El marketing explícito requiere double opt-in.
 *
 * Nota: Supabase JS no ofrece transacciones multi-tabla sin RPC.
 * Si un paso posterior falla, los anteriores pueden quedar escritos.
 */
export async function captureCareerPlannerReportDownload(
  normalizedEmail: string,
  idempotencyKey: string,
  trackingContext?: TrackingContext | null,
  options: { marketingConsent?: boolean; publicOrigin?: string } = {},
): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  let leadId: string;
  let productId: string;

  try {
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id")
      .eq("product_key", PRODUCT_KEY)
      .maybeSingle();

    if (productError || !product) {
      throw new CareerPlannerLeadCaptureError();
    }

    productId = product.id;
    leadId = await upsertLeadByEmail(admin, normalizedEmail, now, {
      source: SOURCE,
      marketingConsent: false,
      touchMarketingConsent: false,
    });

    await upsertLeadProductInterest(admin, leadId, productId, now, {
      source: SOURCE,
      status: INTEREST_STATUS,
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

  try {
    await insertUserEvent(admin, {
      leadId,
      productId,
      eventName: EVENT_NAME,
      eventCategory: EVENT_CATEGORY,
      source: SOURCE,
      metadata: {
        download_type: "free_report",
        form_id: "career_planner_report",
      },
      trackingContext,
      idempotencyKey,
      occurredAt: now,
    });
  } catch {
    console.error("[FlyPath] Career Planner conversion event persistence failed.");
  }

  try {
    await queueCareerPlannerConfirmation(admin, { leadId, idempotencyKey });
  } catch {
    console.error("[FlyPath] Career Planner confirmation email processing failed.");
  }

  if (options.marketingConsent) {
    if (!options.publicOrigin) throw new CareerPlannerLeadCaptureError();
    try {
      await requestMarketingConfirmation(admin, {
        leadId,
        listKey: LIST_KEY,
        source: SOURCE,
        consentText: CAREER_PLANNER_MARKETING_CONSENT_TEXT,
        requestId: idempotencyKey,
        recipientEmail: normalizedEmail,
        publicOrigin: options.publicOrigin,
      });
    } catch {
      throw new CareerPlannerLeadCaptureError();
    }
  }
}
