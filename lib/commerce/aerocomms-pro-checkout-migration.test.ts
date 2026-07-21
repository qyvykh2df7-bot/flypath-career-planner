import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712240000_prepare_aerocomms_pro_subscription_checkout.sql"),
  "utf8",
);

describe("AeroComms Pro subscription Checkout migration", () => {
  it("prepares only authenticated pending Checkout state from the closed recurring catalog", () => {
    expect(migration).toContain("prepare_aerocomms_pro_subscription_checkout");
    expect(migration).toContain("p_user_id IS NULL");
    expect(migration).toContain("p.product_key = 'aerocomms_pro'");
    expect(migration).toContain("pp.price_key = 'aerocomms_pro_monthly_eur'");
    expect(migration).toContain("pp.unit_amount = 737");
    expect(migration).toContain("pp.billing_type = 'recurring'");
    expect(migration).toContain("pp.billing_interval = 'month'");
    expect(migration).toContain("INSERT INTO public.checkout_attempts");
  });

  it("is idempotent, service-role only, and cannot activate Pro", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).not.toContain("INSERT INTO public.subscriptions");
    expect(migration).not.toContain("INSERT INTO public.payments");
    expect(migration).not.toContain("INSERT INTO public.entitlement_grants");
  });
});
