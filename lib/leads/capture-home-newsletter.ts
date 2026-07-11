import "server-only";

import {
  insertUserEvent,
  LeadCaptureError,
  upsertEmailSubscriptionForLead,
  upsertLeadByEmail,
} from "@/lib/leads/capture-shared";
import { HOME_NEWSLETTER_MARKETING_CONSENT_TEXT } from "@/lib/leads/home-newsletter-consent";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const SOURCE = "home_newsletter";
const LIST_KEY = "home_newsletter";
const EVENT_NAME = "home_newsletter_subscribed";
const EVENT_CATEGORY = "lead";

export class HomeNewsletterLeadCaptureError extends LeadCaptureError {
  constructor(message = "Home newsletter lead capture failed") {
    super(message);
    this.name = "HomeNewsletterLeadCaptureError";
  }
}

/**
 * Persiste lead, suscripción y evento de newsletter home.
 *
 * Nota: Supabase JS no ofrece transacciones multi-tabla sin RPC.
 * Si un paso posterior falla, los anteriores pueden quedar escritos.
 */
export async function captureHomeNewsletterSubscription(
  normalizedEmail: string,
): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();

  try {
    const leadId = await upsertLeadByEmail(admin, normalizedEmail, now, {
      source: SOURCE,
      marketingConsent: true,
    });

    await upsertEmailSubscriptionForLead(admin, leadId, now, {
      listKey: LIST_KEY,
      source: SOURCE,
      consentText: HOME_NEWSLETTER_MARKETING_CONSENT_TEXT,
    });

    await insertUserEvent(admin, {
      leadId,
      eventName: EVENT_NAME,
      eventCategory: EVENT_CATEGORY,
      source: SOURCE,
      occurredAt: now,
    });
  } catch (error) {
    if (error instanceof LeadCaptureError) {
      throw new HomeNewsletterLeadCaptureError();
    }
    throw error;
  }
}
