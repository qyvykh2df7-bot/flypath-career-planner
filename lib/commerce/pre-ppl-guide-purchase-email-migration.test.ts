import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260808190000_add_preppl_purchase_confirmation_email.sql"),
  "utf8",
);

describe("Pre-PPL purchase confirmation migration", () => {
  it("adds an order-bound transactional job without changing marketing data", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders");
    expect(migration).toContain("'preppl_purchase_confirmation'");
    expect(migration).toContain("lead_id IS NULL AND school_review_id IS NULL AND order_id IS NOT NULL");
    expect(migration).not.toContain("marketing_consent");
  });

  it("records only a verified settled Pre-PPL order through a service-role RPC", () => {
    expect(migration).toContain("record_preppl_guide_purchase_recipient");
    expect(migration).toContain("order_row.status IN ('paid', 'fulfilled')");
    expect(migration).toContain("product.product_key = 'preppl_guide'");
    expect(migration).toContain("price.price_key = 'preppl_guide_eur'");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
