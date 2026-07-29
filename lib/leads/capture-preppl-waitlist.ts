import "server-only";

import {
  insertUserEvent,
  LeadCaptureError,
  upsertLeadByEmail,
  upsertLeadProductInterest,
} from "@/lib/leads/capture-shared";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TrackingContext } from "@/lib/tracking/events";
import { queuePrepplWaitlistConfirmation } from "@/lib/email/send-transactional-email";

const SOURCE = "preppl";
const PRODUCT_KEY = "preppl_guide";
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
 * Persiste lead, interés y evento de lista de espera Pre-PPL sin consentimiento de marketing implícito.
 *
 * Nota: Supabase JS no ofrece transacciones multi-tabla sin RPC.
 * Si un paso posterior falla, los anteriores pueden quedar escritos.
 */
export async function capturePrepplWaitlistJoin(
  normalizedEmail: string,
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
      throw new PrepplWaitlistLeadCaptureError();
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
    if (error instanceof LeadCaptureError) {
      throw new PrepplWaitlistLeadCaptureError();
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
        popup_id: "preppl_waitlist",
        form_id: "preppl_waitlist",
        product_key: PRODUCT_KEY,
      },
      trackingContext,
      idempotencyKey,
      occurredAt: now,
    });
  } catch {
    console.error("[FlyPath] Pre-PPL conversion event persistence failed.");
  }

  try {
    await queuePrepplWaitlistConfirmation(admin, { leadId, idempotencyKey });
  } catch {
    console.error("[FlyPath] Pre-PPL confirmation email processing failed.");
  }
}
