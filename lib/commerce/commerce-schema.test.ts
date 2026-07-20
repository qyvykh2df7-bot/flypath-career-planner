import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260712170000_create_commerce_foundation.sql"),
  "utf8",
);

describe("commerce foundation migration", () => {
  it("creates the closed commercial model without creating Stripe HTTP integration", () => {
    for (const table of [
      "product_prices", "stripe_customers", "checkout_attempts", "orders", "order_items", "payments",
      "subscriptions", "stripe_webhook_events", "entitlements", "product_entitlements", "entitlement_grants", "order_claim_tokens",
    ]) {
      expect(migration).toContain(`public.${table}`);
    }
    expect(migration).not.toContain("CREATE FUNCTION public.create_stripe");
    expect(migration).not.toContain("http://");
  });

  it("keeps Stripe payloads and guest claim tokens private and hashed", () => {
    expect(migration).toContain("Raw Stripe payloads are intentionally not stored");
    expect(migration).toContain("token_hash text NOT NULL UNIQUE");
    expect(migration).toContain("purchaser_email_hash = encode(extensions.digest(purchaser_email, 'sha256'), 'hex')");
    expect(migration).toContain("purchaser_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'");
    expect(migration).not.toContain("token text NOT NULL");
    expect(migration).not.toContain("recipient_email_hash");
  });

  it("enforces idempotent grants and service-role-only table access", () => {
    expect(migration).toContain("idempotency_key uuid NOT NULL UNIQUE");
    expect(migration).toContain("entitlement_grants_order_item_unique_idx");
    expect(migration).toContain("subscriptions_require_recurring_price");
    expect(migration).toContain("payments_one_successful_per_order_idx");
    expect(migration).toContain("order_items_require_matching_price");
    expect(migration).toContain("Consumed claim tokens cannot be reused");
    expect(migration).toContain("Entitlement is not granted by the source product");
    expect(migration).toContain("Commercial price identity is immutable");
    expect(migration).toContain("REVOKE DELETE ON TABLE public.payments");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
