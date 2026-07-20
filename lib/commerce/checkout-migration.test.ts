import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712180000_add_career_planner_test_checkout.sql"),
  "utf8",
);
const syncScript = readFileSync(resolve(process.cwd(), "scripts/sync-stripe-career-planner.mjs"), "utf8");

describe("Career Planner test Checkout migration and catalog sync", () => {
  it("stores both Stripe identifiers and prepares the closed price atomically", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS stripe_product_id text NULL");
    expect(migration).toContain("prepare_career_planner_premium_checkout");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("pp.unit_amount = 595");
    expect(migration).toContain("pp.currency = 'EUR'");
    expect(migration).toContain("pp.billing_type = 'one_time'");
    expect(migration).toContain("p.status = 'active'");
    expect(migration).toContain("pp.is_active");
    expect(migration).toContain("pp.stripe_product_id IS NOT NULL");
    expect(migration).toContain("pp.stripe_price_id IS NOT NULL");
  });

  it("restricts the preparation RPC to service role and never grants access", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).not.toContain("entitlement_grants");
    expect(migration).not.toContain("INSERT INTO public.payments");
  });

  it("keeps the catalog script test-only and idempotent by stable metadata and price checks", () => {
    expect(syncScript).toContain("sk_test_");
    expect(syncScript).toContain("flypath_product_key");
    expect(syncScript).toContain("products.list({ active: true");
    expect(syncScript).toContain("prices.list");
    expect(syncScript).toContain("findExistingInternalPrice");
    expect(syncScript).toContain("resolveLinkedStripeCatalog");
    expect(syncScript).toContain("idempotencyKey: `flypath:product:");
    expect(syncScript).toContain("unit_amount === UNIT_AMOUNT");
    expect(syncScript).toContain("Existing internal Career Planner price conflicts");
    expect(syncScript).toContain("Existing Stripe catalog linkage conflicts");
    expect(syncScript).not.toContain("sk_live_");
  });
});
