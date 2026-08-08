import "server-only";

import { queuePrePplPurchaseConfirmation, type TransactionalEmailDispatchResult } from "@/lib/email/send-transactional-email";
import type { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isCommerceUuid } from "./contracts";

type CommerceAdminClient = ReturnType<typeof getSupabaseAdmin>;

type PrePplPurchaseEmailInput = {
  stripeMode: "test" | "live";
  stripeSessionId: string;
  checkoutAttemptId: string;
  orderId: string;
  purchaserEmail: string;
};

export class PrePplPurchaseEmailError extends Error {
  constructor() {
    super("Pre-PPL purchase email is unavailable");
    this.name = "PrePplPurchaseEmailError";
  }
}

function isPurchaserEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidInput(input: PrePplPurchaseEmailInput): boolean {
  return (
    (input.stripeMode === "test" || input.stripeMode === "live")
    && /^cs_(?:test|live)_[A-Za-z0-9_]{8,240}$/.test(input.stripeSessionId)
    && isCommerceUuid(input.checkoutAttemptId)
    && isCommerceUuid(input.orderId)
    && isPurchaserEmail(input.purchaserEmail.trim())
  );
}

export async function recordAndQueuePrePplPurchaseEmail(
  admin: CommerceAdminClient,
  input: PrePplPurchaseEmailInput,
): Promise<TransactionalEmailDispatchResult> {
  if (!isValidInput(input)) throw new PrePplPurchaseEmailError();

  const { data, error } = await admin.rpc("record_preppl_guide_purchase_recipient", {
    p_stripe_mode: input.stripeMode,
    p_stripe_session_id: input.stripeSessionId,
    p_checkout_attempt_id: input.checkoutAttemptId,
    p_order_id: input.orderId,
    p_purchaser_email: input.purchaserEmail.trim(),
  });
  if (error || (data !== "recorded" && data !== "existing")) {
    throw new PrePplPurchaseEmailError();
  }

  return queuePrePplPurchaseConfirmation(admin, {
    orderId: input.orderId,
    // A purchase has a stable UUID, and email_jobs enforces one template/job per key.
    idempotencyKey: input.orderId,
  });
}
