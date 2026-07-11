import "server-only";

import {
  insertUserEvent,
  LeadCaptureError,
  upsertLeadByEmail,
  upsertLeadProductInterest,
} from "@/lib/leads/capture-shared";
import {
  MENTORSHIP_SUPPORT_CONTACT_CONSENT_TEXT,
  type MentorshipSupportSituation,
} from "@/lib/leads/mentorship-support-consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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
      throw new MentorshipSupportLeadCaptureError();
    }

    const leadId = await upsertLeadByEmail(admin, input.normalizedEmail, now, {
      source: LEAD_SOURCE,
      marketingConsent: false,
      touchMarketingConsent: false,
      fullName: input.fullName,
      funnelStage: "qualified",
    });

    await upsertLeadProductInterest(admin, leadId, product.id, now, {
      source: LEAD_SOURCE,
      status: INTEREST_STATUS,
    });

    await insertUserEvent(admin, {
      leadId,
      productId: product.id,
      eventName: EVENT_NAME,
      eventCategory: EVENT_CATEGORY,
      source: EVENT_SOURCE,
      metadata: {
        full_name: input.fullName.trim(),
        phone: input.phone?.trim() || null,
        situation: input.situation,
        help_text: input.helpText.trim(),
        contact_consent: true,
        contact_consent_text: MENTORSHIP_SUPPORT_CONTACT_CONSENT_TEXT,
        interest_intent: "inquiry",
      },
      occurredAt: now,
    });
  } catch (error) {
    if (error instanceof LeadCaptureError) {
      throw new MentorshipSupportLeadCaptureError();
    }
    throw error;
  }
}
