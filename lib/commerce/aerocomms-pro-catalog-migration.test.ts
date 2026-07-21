import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712230000_add_aerocomms_pro_subscription_catalog.sql"),
  "utf8",
);

describe("AeroComms Pro subscription catalog migration", () => {
  it("creates the closed product, monthly price, and subscription entitlement mapping", () => {
    expect(migration).toContain("'aerocomms_pro'");
    expect(migration).toContain("'aerocomms_pro_monthly_eur'");
    expect(migration).toContain("'AeroComms Pro'");
    expect(migration).toContain("'subscription'");
    expect(migration).toContain("'stripe'");
    expect(migration).toContain("'EUR'");
    expect(migration).toContain("737");
    expect(migration).toContain("'recurring'");
    expect(migration).toContain("'month'");
    expect(migration).toContain("'subscription_period'");
  });

  it("links only the verified Stripe Test pair, idempotently, without granting access", () => {
    expect(migration).toContain("BEGIN;");
    expect(migration).toContain("COMMIT;");
    expect(migration).toContain("ON CONFLICT (product_key)");
    expect(migration).toContain("ON CONFLICT (price_key) DO NOTHING");
    expect(migration).toContain("ON CONFLICT (product_id, entitlement_id) DO UPDATE");
    expect(migration).not.toContain("INSERT INTO public.entitlement_grants");
    expect(migration).not.toContain("CREATE TABLE public.subscriptions");
    expect(migration).toContain("'prod_UvXKn9mQPp3G17'");
    expect(migration).toContain("'price_1TvgG4KuujVRKb0PkofwZMz7'");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.prepare_");
    expect(migration).not.toContain("stripe.checkout.sessions.create");
  });

  it("rejects an incompatible pre-existing price instead of silently changing its immutable identity", () => {
    expect(migration).toContain("Existing AeroComms Pro price conflicts with the closed catalog contract");
    expect(migration).toContain("v_price_billing_type <> 'recurring'");
    expect(migration).toContain("v_price_interval <> 'month'");
    expect(migration).toContain("v_price_amount <> 737");
  });
});
