import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260712210000_add_como_ser_piloto_guide_checkout_delivery.sql"), "utf8");

describe("Cómo ser Piloto guide Checkout and delivery migration", () => {
  it("uses the existing product with a closed one-time EUR catalog", () => {
    expect(migration).toContain("p.product_key = 'como_ser_piloto_guide'");
    expect(migration).toContain("pp.price_key = 'como_ser_piloto_guide_eur'");
    expect(migration).toContain("pp.unit_amount = 1495");
    expect(migration).toContain("pp.billing_type = 'one_time'");
    expect(migration).toContain("pp.stripe_product_id IS NOT NULL");
    expect(migration).toContain("pp.stripe_price_id IS NOT NULL");
  });

  it("settles the guide atomically with no entitlement and isolates its delivery token", () => {
    expect(migration).toContain("process_como_ser_piloto_guide_checkout_completed");
    expect(migration).toContain("FOR UPDATE OF ca, o, oi");
    expect(migration).toContain("INSERT INTO public.payments");
    expect(migration).toContain("SET status = 'paid'");
    expect(migration).toContain("issue_como_ser_piloto_guide_delivery_access");
    expect(migration).toContain("get_como_ser_piloto_guide_delivery_status");
    expect(migration).toContain("consume_como_ser_piloto_guide_download");
    expect(migration).not.toContain("INSERT INTO public.entitlement_grants");
  });

  it("keeps every new function server-only with a fixed search path", () => {
    expect(migration.match(/SECURITY DEFINER/g)?.length).toBe(7);
    expect(migration.match(/SET search_path = public, pg_temp/g)?.length).toBe(7);
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
