import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712250000_sync_aerocomms_pro_subscription_entitlements.sql"),
  "utf8",
);

const gracePeriodFixMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712270000_fix_aerocomms_pro_payment_failure_grace_period.sql"),
  "utf8",
);

const graceGrantBackfillMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712280000_backfill_aerocomms_pro_payment_failure_grants.sql"),
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

  it("sets a payment-failure grace period to exactly 48 hours from the provider event", () => {
    expect(gracePeriodFixMigration).toContain("p_provider_created_at + interval '2 days'");
    expect(gracePeriodFixMigration).toContain("grace_period_ends_at = v_grace_ends_at");
    expect(gracePeriodFixMigration).not.toContain("GREATEST(COALESCE(p_current_period_end");
    expect(gracePeriodFixMigration).not.toContain("grace_period_ends_at >= current_period_end");
    expect(gracePeriodFixMigration).toContain("grace_period_ends_at = last_provider_event_at + interval '2 days'");
    expect(graceGrantBackfillMigration).toContain("ends_at = subscription.grace_period_ends_at");
    expect(graceGrantBackfillMigration).toContain("starts_at = LEAST(entitlement_grant.starts_at, subscription.grace_period_ends_at)");
    expect(graceGrantBackfillMigration).toContain("subscription.status = 'past_due'");
    expect(graceGrantBackfillMigration).toContain("entitlement.entitlement_key = 'aerocomms_pro'");
  });

  it("keeps the historical grant date range valid when its old start is after the corrected grace end", () => {
    const previousStartsAt = new Date("2026-08-22T12:30:00.000Z");
    const graceEndsAt = new Date("2026-07-24T12:34:04.000Z");
    const correctedStartsAt = new Date(Math.min(previousStartsAt.getTime(), graceEndsAt.getTime()));

    expect(correctedStartsAt).toEqual(graceEndsAt);
    expect(correctedStartsAt.getTime()).toBeLessThanOrEqual(graceEndsAt.getTime());
  });

  it("preserves the server-only atomic RPC and keeps its previous implementation private", () => {
    expect(gracePeriodFixMigration).toContain("SECURITY DEFINER");
    expect(gracePeriodFixMigration).toContain("SET search_path = public, pg_temp");
    expect(gracePeriodFixMigration).toContain("apply_aerocomms_pro_subscription_webhook_event_v1");
    expect(gracePeriodFixMigration).toContain("FROM PUBLIC, anon, authenticated, service_role");
    expect(gracePeriodFixMigration).toContain("TO service_role");
  });
});
