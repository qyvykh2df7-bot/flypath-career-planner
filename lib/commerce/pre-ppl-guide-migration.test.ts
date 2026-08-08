import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260808180000_launch_preppl_digital_guide.sql"),
  "utf8",
);

describe("Pre-PPL digital guide migration", () => {
  it("activates the existing product with one immutable EUR price and its Live-only Stripe binding", () => {
    expect(migration).toContain("product_key = 'preppl_guide'");
    expect(migration).toContain("'preppl_guide_eur', 'EUR', 2395, 'one_time'");
    expect(migration).toContain("'live', 'prod_V2HDiunAEOVO9p', 'price_1U2Cf6KuujVRKb0PVULrzLEY'");
    expect(migration).toContain("ON CONFLICT (product_price_id, stripe_mode) DO NOTHING");
    expect(migration).toContain("Pre-PPL Live Stripe binding conflicts with the catalog");
    expect(migration).toContain("Pre-PPL must have exactly one active price");
  });

  it("extends only the closed one-time Checkout catalog and never grants an entitlement", () => {
    expect(migration).toContain("('preppl_guide', 'preppl_guide_eur')");
    expect(migration).toContain("price.unit_amount = 2395");
    expect(migration).toContain("p_product_key = 'preppl_guide'");
    expect(migration).toContain("INSERT INTO public.payments");
    expect(migration).not.toContain("INSERT INTO public.entitlement_grants");
  });

  it("keeps delivery isolated and all new RPCs service-role only", () => {
    expect(migration).toContain("issue_preppl_guide_delivery_access");
    expect(migration).toContain("get_preppl_guide_delivery_status");
    expect(migration).toContain("consume_preppl_guide_download");
    expect(migration).toContain("product.product_key <> 'preppl_guide'");
    expect(migration.match(/SECURITY DEFINER/g)?.length).toBe(7);
    expect(migration.match(/SET search_path = public, pg_temp/g)?.length).toBe(7);
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });

  it("keeps the download counter atomic under concurrent requests", () => {
    expect(migration).toContain("FOR UPDATE OF token");
    expect(migration).toContain("IF v_download_count >= v_max_downloads THEN RETURN 'limit_reached'; END IF;");
    expect(migration).toContain("SET download_count = download_count + 1");
  });
});
