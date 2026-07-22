import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712290000_update_aerocomms_pro_monthly_price.sql"),
  "utf8",
);

describe("AeroComms Pro 5.99 EUR price migration", () => {
  it("creates a separate active price without changing the immutable legacy price", () => {
    expect(migration).toContain("'aerocomms_pro_monthly_eur_599'");
    expect(migration).toContain("599");
    expect(migration).toContain("'price_1Tw6JqKuujVRKb0Pr4jCc5oQ'");
    expect(migration).toContain("SET is_active = false");
    expect(migration).toContain("'aerocomms_pro_monthly_eur'");
    expect(migration).not.toContain("UPDATE public.product_prices\n    SET price_key");
    expect(migration).not.toContain("SET unit_amount = 599");
  });

  it("uses the new price for Checkout and prevents an account from opening a second legacy subscription", () => {
    expect(migration).toContain("price.price_key = 'aerocomms_pro_monthly_eur_599'");
    expect(migration).toContain("price.unit_amount = 599");
    expect(migration).toContain("'price_1Tw6JqKuujVRKb0Pr4jCc5oQ'");
    expect(migration).toContain("subscription_price.product_id = v_product_id");
    expect(migration).toContain("'AeroComms Pro already has an open subscription'");
  });

  it("keeps the private webhook projection closed to the current and legacy Stripe prices", () => {
    expect(migration).toContain("apply_aerocomms_pro_subscription_webhook_event_v1");
    expect(migration).toContain("'price_1TvgG4KuujVRKb0PkofwZMz7'");
    expect(migration).toContain("'price_1Tw6JqKuujVRKb0Pr4jCc5oQ'");
    expect(migration).toContain("p_amount IS DISTINCT FROM v_catalog_price_amount");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated, service_role");
  });
});
