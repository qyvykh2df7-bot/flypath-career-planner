import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712300000_add_stripe_live_catalog_bindings.sql"),
  "utf8",
);

describe("Stripe Test/Live catalog bindings migration", () => {
  it("preserves immutable product prices and creates closed per-mode bindings", () => {
    expect(migration).toContain("CREATE TABLE public.stripe_catalog_bindings");
    expect(migration).toContain("UNIQUE (product_price_id, stripe_mode)");
    expect(migration).toContain("UNIQUE (stripe_mode, stripe_price_id)");
    expect(migration).toContain("Stripe catalog binding identity is immutable");
    expect(migration).not.toContain("UPDATE public.product_prices SET stripe_price_id");
  });

  it("adds only the approved Live product and Price pairs while retaining Test history", () => {
    expect(migration).toContain("'prod_UwBTbbxIuxOWFo', 'price_1TwJ6VKuujVRKb0PexWeKrvD'");
    expect(migration).toContain("'prod_UwBTIYeQ69e225', 'price_1TwJ6cKuujVRKb0PPKY1Y8El'");
    expect(migration).toContain("'prod_UwBTzck12AoM3X', 'price_1TwJ6gKuujVRKb0PzHL9PjjN'");
    expect(migration).toContain("'aerocomms_pro_monthly_eur'");
    expect(migration).toContain("'aerocomms_pro_monthly_eur_599'");
    expect(migration).toContain("stripe_mode text NOT NULL DEFAULT 'test'");
    expect(migration).toContain("LEAST(COALESCE(p_current_period_start, p_provider_created_at), v_grant_ends_at)");
    expect(migration).toContain("Existing Stripe Live binding conflicts with the closed FlyPath catalog");
  });

  it("keeps mode selection and all writes server-only", () => {
    expect(migration).toContain("prepare_stripe_catalog_checkout");
    expect(migration).toContain("prepare_aerocomms_pro_subscription_checkout_v2");
    expect(migration).toContain("settle_stripe_catalog_checkout_v2");
    expect(migration.match(/SECURITY DEFINER/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration.match(/SET search_path = public, pg_temp/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
