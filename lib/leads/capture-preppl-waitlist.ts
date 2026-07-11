import "server-only";

import {
  insertUserEvent,
  LeadCaptureError,
  upsertEmailSubscriptionForLead,
  upsertLeadByEmail,
  upsertLeadProductInterest,
} from "@/lib/leads/capture-shared";
import { PREPPL_WAITLIST_CONSENT_TEXT } from "@/lib/leads/preppl-consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SOURCE = "preppl";
const PRODUCT_KEY = "preppl_guide";
const LIST_KEY = "preppl";
const INTEREST_STATUS = "waitlist";
const EVENT_NAME = "preppl_waitlist_joined";
const EVENT_CATEGORY = "lead";

export class PrepplWaitlistLeadCaptureError extends LeadCaptureError {
  constructor(message = "Pre-PPL waitlist lead capture failed") {
    super(message);
    this.name = "PrepplWaitlistLeadCaptureError";
  }
}

/**
 * Persiste lead, interés, suscripción y evento de lista de espera Pre-PPL.
 *
 * Nota: Supabase JS no ofrece transacciones multi-tabla sin RPC.
 * Si un paso posterior falla, los anteriores pueden quedar escritos.
 */
export async function capturePrepplWaitlistJoin(normalizedEmail: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    const { data: product, error: productError } = await admin
      .from("products")
      .select("id")
      .eq("product_key", PRODUCT_KEY)
      .maybeSingle();

    if (productError || !product) {
      throw new PrepplWaitlistLeadCaptureError();
    }

    const leadId = await upsertLeadByEmail(admin, normalizedEmail, now, {
      source: SOURCE,
      marketingConsent: true,
    });

    await upsertLeadProductInterest(admin, leadId, product.id, now, {
      source: SOURCE,
      status: INTEREST_STATUS,
    });

    await upsertEmailSubscriptionForLead(admin, leadId, now, {
      listKey: LIST_KEY,
      source: SOURCE,
      consentText: PREPPL_WAITLIST_CONSENT_TEXT,
    });

    await insertUserEvent(admin, {
      leadId,
      productId: product.id,
      eventName: EVENT_NAME,
      eventCategory: EVENT_CATEGORY,
      source: SOURCE,
      occurredAt: now,
    });
  } catch (error) {
    if (error instanceof LeadCaptureError) {
      throw new PrepplWaitlistLeadCaptureError();
    }
    throw error;
  }
}
