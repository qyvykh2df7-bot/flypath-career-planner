import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712250000_sync_aerocomms_pro_subscription_entitlements.sql"),
  "utf8",
);

describe("AeroComms Pro subscription entitlement migration", () => {
  it("uses one server-only transactional boundary for the closed Stripe event set", () => {
    expect(migration).toContain("apply_aerocomms_pro_subscription_webhook_event");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.apply_aerocomms_pro_subscription_webhook_event");
    expect(migration).toContain("TO service_role");
    for (const event of [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
    ]) expect(migration).toContain(`'${event}'`);
  });

  it("keeps grants time-bounded, deduplicated, and revocable for refunds, disputes, and final cancellation", () => {
    expect(migration).toContain("grace_period_ends_at");
    expect(migration).toContain("interval '2 days'");
    expect(migration).toContain("ON CONFLICT (subscription_id, entitlement_id)");
    expect(migration).toContain("'refund'");
    expect(migration).toContain("'chargeback'");
    expect(migration).toContain("'subscription_ended'");
    expect(migration).toContain("stale_provider_event");
    expect(migration).toContain("p_subscription_status NOT IN ('active', 'canceling', 'past_due')");
  });

  it("blocks duplicate subscription attempts with an account/product lock and open-subscription constraint", () => {
    expect(migration).toContain("aerocomms_pro:' || p_user_id::text");
    expect(migration).toContain("subscriptions_one_open_per_user_price_idx");
    expect(migration).toContain("AeroComms Pro already has an open subscription");
    expect(migration).toContain("ca.status IN ('initiated', 'session_created')");
  });

  it("does not use browser storage or client-controlled Stripe commercial values", () => {
    expect(migration).not.toContain("localStorage");
    expect(migration).not.toContain("NEXT_PUBLIC");
    expect(migration).toContain("price.unit_amount = 737");
    expect(migration).toContain("price.currency = 'EUR'");
  });
});
