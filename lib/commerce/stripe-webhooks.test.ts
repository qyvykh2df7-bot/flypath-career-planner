import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieve: vi.fn(),
  rpc: vi.fn(),
  getAdmin: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("./stripe", () => ({
  getStripeClient: () => ({
    webhooks: { constructEvent: mocks.constructEvent },
    checkout: { sessions: { retrieve: mocks.retrieve } },
  }),
  StripeConfigurationError: class StripeConfigurationError extends Error {},
  StripeProviderError: class StripeProviderError extends Error {},
}));

import { processCareerPlannerStripeWebhook, verifyStripeWebhook } from "./stripe-webhooks";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const orderId = "7b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const priceId = "8b1d8768-7a01-4e6f-b2dd-0d399857f8dd";

function event(type: string, object: Record<string, unknown> = {}) {
  return {
    id: `evt_${type.replaceAll(".", "_")}`,
    type,
    created: 1_700_000_000,
    data: { object: { id: "cs_test_valid", ...object } },
  } as never;
}

function paidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_valid",
    mode: "payment",
    payment_status: "paid",
    amount_total: 595,
    currency: "eur",
    payment_intent: "pi_test_valid",
    client_reference_id: attemptId,
    metadata: { checkout_attempt_id: attemptId, order_id: orderId, product_price_id: priceId },
    line_items: { data: [{ price: { id: "price_test_career_planner" } }] },
    ...overrides,
  };
}

function paidGuideSession(overrides: Record<string, unknown> = {}) {
  return paidSession({
    amount_total: 1495,
    metadata: {
      checkout_attempt_id: attemptId,
      order_id: orderId,
      product_price_id: priceId,
      flypath_checkout_product: "como_ser_piloto_guide",
    },
    line_items: { data: [{ price: { id: "price_test_como_ser_piloto_guide" } }] },
    ...overrides,
  });
}

describe("Career Planner Stripe webhook boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_only");
    mocks.rpc.mockResolvedValue({ error: null });
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc });
    mocks.retrieve.mockResolvedValue(paidSession());
  });

  it("accepts only a Stripe-verified signature", () => {
    const signed = event("checkout.session.completed");
    mocks.constructEvent.mockReturnValue(signed);
    expect(verifyStripeWebhook("{}", "t=1,v1=signed")).toBe(signed);
    expect(mocks.constructEvent).toHaveBeenCalledWith("{}", "t=1,v1=signed", "whsec_test_only");

    mocks.constructEvent.mockImplementation(() => { throw new Error("invalid"); });
    expect(() => verifyStripeWebhook("{}", "bad")).toThrow(expect.objectContaining({ kind: "signature" }));
  });

  it("settles only a fully validated paid Checkout session", async () => {
    await expect(processCareerPlannerStripeWebhook(event("checkout.session.completed"), "{}"))
      .resolves.toBe("processed");
    expect(mocks.retrieve).toHaveBeenCalledWith("cs_test_valid", { expand: ["line_items.data.price"] });
    expect(mocks.rpc).toHaveBeenCalledWith("process_career_planner_checkout_completed", expect.objectContaining({
      p_checkout_attempt_id: attemptId,
      p_order_id: orderId,
      p_product_price_id: priceId,
      p_stripe_price_id: "price_test_career_planner",
      p_amount: 595,
      p_currency: "eur",
    }));
  });

  it.each([
    ["amount", { amount_total: 596 }],
    ["currency", { currency: "usd" }],
    ["metadata", { metadata: { checkout_attempt_id: "invalid", order_id: orderId, product_price_id: priceId } }],
  ])("records but never settles a Checkout session with invalid %s", async (_label, override) => {
    mocks.retrieve.mockResolvedValue(paidSession(override));
    await processCareerPlannerStripeWebhook(event("checkout.session.completed"), "{}");
    expect(mocks.rpc).toHaveBeenCalledWith("record_career_planner_stripe_webhook_ignored", expect.objectContaining({
      p_error_code: "checkout_validation_failed",
    }));
    expect(mocks.rpc).not.toHaveBeenCalledWith("process_career_planner_checkout_completed", expect.anything());
  });

  it("passes the Stripe price to the atomic database boundary, which rejects a catalog mismatch", async () => {
    mocks.retrieve.mockResolvedValue(paidSession({ line_items: { data: [{ price: { id: "price_wrong" } }] } }));
    await processCareerPlannerStripeWebhook(event("checkout.session.completed"), "{}");
    expect(mocks.rpc).toHaveBeenCalledWith("process_career_planner_checkout_completed", expect.objectContaining({
      p_stripe_price_id: "price_wrong",
    }));
  });

  it("settles the guide only through its isolated product-specific database boundary", async () => {
    mocks.retrieve.mockResolvedValue(paidGuideSession());
    await expect(processCareerPlannerStripeWebhook(event("checkout.session.completed"), "{}"))
      .resolves.toBe("processed");
    expect(mocks.rpc).toHaveBeenCalledWith("process_como_ser_piloto_guide_checkout_completed", expect.objectContaining({
      p_amount: 1495,
      p_stripe_price_id: "price_test_como_ser_piloto_guide",
    }));
    expect(mocks.rpc).not.toHaveBeenCalledWith("process_career_planner_checkout_completed", expect.anything());
  });

  it("records payment success as redundant so it cannot create a second payment", async () => {
    await expect(processCareerPlannerStripeWebhook(event("payment_intent.succeeded", { id: "pi_test_valid" }), "{}"))
      .resolves.toBe("ignored");
    expect(mocks.rpc).toHaveBeenCalledWith("record_career_planner_stripe_webhook_ignored", expect.objectContaining({
      p_error_code: "redundant_payment_intent_succeeded",
    }));
  });

  it("records linked payment failures and Checkout expirations without granting access", async () => {
    await processCareerPlannerStripeWebhook(event("payment_intent.payment_failed", {
      id: "pi_test_failed",
      amount: 595,
      currency: "eur",
      metadata: { checkout_attempt_id: attemptId, order_id: orderId },
    }), "{}");
    expect(mocks.rpc).toHaveBeenCalledWith("process_career_planner_payment_failed", expect.objectContaining({ p_order_id: orderId }));

    await processCareerPlannerStripeWebhook(event("checkout.session.expired"), "{}");
    expect(mocks.rpc).toHaveBeenCalledWith("process_career_planner_checkout_expired", expect.objectContaining({ p_stripe_session_id: "cs_test_valid" }));
  });

  it("ignores events outside the closed allowlist", async () => {
    await expect(processCareerPlannerStripeWebhook(event("charge.succeeded"), "{}"))
      .resolves.toBe("ignored");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
