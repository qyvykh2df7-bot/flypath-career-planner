import "server-only";

import {
  insertUserEvent,
  LeadCaptureError,
  upsertLeadByEmail,
  upsertLeadProductInterest,
} from "@/lib/leads/capture-shared";
import type { MentorshipSupportSituation } from "@/lib/leads/mentorship-support-consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TrackingContext } from "@/lib/tracking/events";
import {
  queueMentorshipInternalAlert,
  queueMentorshipRequestConfirmation,
} from "@/lib/email/send-transactional-email";

const LEAD_SOURCE = "mentoring";
const EVENT_SOURCE = "mentorship";
const PRODUCT_KEY = "flypath_accompaniment";
const INTEREST_STATUS = "interested";
const EVENT_NAME = "mentorship_support_requested";
const EVENT_CATEGORY = "lead";

export type MentorshipSupportCaptureInput = {
  fullName: string;
  normalizedEmail: string;
  phone?: string | null;
  situation: MentorshipSupportSituation;
  helpText: string;
};

export class MentorshipSupportLeadCaptureError extends LeadCaptureError {
  constructor(message = "Mentorship support lead capture failed") {
    super(message);
    this.name = "MentorshipSupportLeadCaptureError";
  }
}

/**
 * Persiste lead, interés y evento de solicitud de acompañamiento.
 *
 * Nota: Supabase JS no ofrece transacciones multi-tabla sin RPC.
 * Si un paso posterior falla, los anteriores pueden quedar escritos.
 */
export async function captureMentorshipSupportRequest(
  input: MentorshipSupportCaptureInput,
  idempotencyKey: string,
  trackingContext?: TrackingContext | null,
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
      throw new MentorshipSupportLeadCaptureError();
    }

    productId = product.id;
    leadId = await upsertLeadByEmail(admin, input.normalizedEmail, now, {
      source: LEAD_SOURCE,
      marketingConsent: false,
      touchMarketingConsent: false,
      fullName: input.fullName,
      funnelStage: "qualified",
    });

    await upsertLeadProductInterest(admin, leadId, productId, now, {
      source: LEAD_SOURCE,
      status: INTEREST_STATUS,
    });
  } catch (error) {
    if (error instanceof LeadCaptureError) {
      throw new MentorshipSupportLeadCaptureError();
    }
    throw error;
  }

  try {
    await insertUserEvent(admin, {
      leadId,
      productId,
      eventName: EVENT_NAME,
      eventCategory: EVENT_CATEGORY,
      source: EVENT_SOURCE,
      metadata: {
        interest_intent: "inquiry",
        popup_id: "mentorship_support",
        form_id: "mentorship_support",
      },
      trackingContext,
      idempotencyKey,
      occurredAt: now,
    });
  } catch {
    console.error("[FlyPath] Mentorship conversion event persistence failed.");
  }

  try {
    await queueMentorshipRequestConfirmation(admin, { leadId, idempotencyKey });
  } catch {
    console.error("[FlyPath] Mentorship confirmation email processing failed.");
  }

  try {
    await queueMentorshipInternalAlert(admin, {
      leadId,
      idempotencyKey,
      templateInput: {
        fullName: input.fullName,
        email: input.normalizedEmail,
        phone: input.phone ?? null,
        situation: input.situation,
        helpText: input.helpText,
        receivedAt: now,
      },
    });
  } catch {
    console.error("[FlyPath] Mentorship internal alert email processing failed.");
  }
}
