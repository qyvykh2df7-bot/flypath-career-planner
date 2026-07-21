import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260712190000_add_career_planner_payment_delivery.sql"), "utf8");
const failedPaymentMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260712200000_fix_career_planner_payment_failed_state.sql"), "utf8");

describe("Career Planner webhook settlement and delivery migration", () => {
  it("keeps webhook processing atomic, closed and service-role only", () => {
    expect(migration).toContain("process_career_planner_checkout_completed");
    expect(migration).toContain("FOR UPDATE OF ca, o, oi");
    expect(migration).toContain("INSERT INTO public.payments");
    expect(migration).toContain("SET status = 'paid'");
    expect(migration).toContain("SET fulfillment_status = 'available'");
    expect(migration).toContain("v_catalog_stripe_price_id IS DISTINCT FROM p_stripe_price_id");
    expect(migration).toContain("checkout.session.expired");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).not.toContain("INSERT INTO public.entitlement_grants");
  });

  it("stores only hashed, expiring, limited-use delivery access", () => {
    expect(migration).toContain("checkout_delivery_tokens");
    expect(migration).toContain("token_hash text NOT NULL UNIQUE");
    expect(migration).toContain("download_count BETWEEN 0 AND 5");
    expect(migration).toContain("max_downloads BETWEEN 1 AND 5");
    expect(migration).toContain("p_checkout_intent_id uuid");
    expect(migration).not.toContain("report_snapshot");
    expect(migration).not.toContain("pdf_body");
  });

  it("moves a validated failed payment into non-confirmed internal states", () => {
    expect(failedPaymentMigration).toContain("SET status = 'failed'");
    expect(failedPaymentMigration).toContain("SET status = 'payment_failed'");
    expect(failedPaymentMigration).toContain("status IN ('initiated', 'session_created', 'failed')");
    expect(failedPaymentMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(failedPaymentMigration).toContain("TO service_role");
  });
});
