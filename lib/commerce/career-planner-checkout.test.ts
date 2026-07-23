import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionState: vi.fn(),
  getAdmin: vi.fn(),
  getStripeClient: vi.fn(),
  getStripeConfiguration: vi.fn(),
  resolveAppUrl: vi.fn(),
  toProviderError: vi.fn(),
  rpc: vi.fn(),
  single: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  or: vi.fn(),
  select: vi.fn(),
  ownerSelect: vi.fn(),
  ownerEq: vi.fn(),
  ownerMaybeSingle: vi.fn(),
  sessionMaybeSingle: vi.fn(),
  create: vi.fn(),
  retrieve: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getFlyPathSessionState: mocks.getSessionState }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getAdmin }));
vi.mock("./stripe", () => ({
  getStripeClient: mocks.getStripeClient,
  getStripeConfiguration: mocks.getStripeConfiguration,
  resolveStripeAppUrl: mocks.resolveAppUrl,
  toStripeProviderError: mocks.toProviderError,
}));

import {
  CAREER_PLANNER_PREMIUM_CHECKOUT_EXPECTED_VALUES,
  CommerceCheckoutError,
  createCareerPlannerPremiumCheckout,
} from "./career-planner-checkout";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const accountId = "6b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const prepared = {
  checkout_attempt_id: attemptId,
  order_id: "7b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  product_price_id: "8b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  stripe_price_id: "price_1TvO3TKuujVRKb0PLb2gr8tI",
  stripe_checkout_session_id: null,
  checkout_status: "initiated",
};

describe("Career Planner Premium Checkout server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionState.mockResolvedValue({ status: "anonymous" });
    mocks.getStripeConfiguration.mockReturnValue({ mode: "test" });
    mocks.single.mockResolvedValue({ data: prepared, error: null });
    mocks.rpc.mockReturnValue({ single: mocks.single });
    mocks.or.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ maybeSingle: mocks.sessionMaybeSingle });
    mocks.sessionMaybeSingle.mockResolvedValue({ data: { id: attemptId }, error: null });
    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: null }, error: null });
    mocks.ownerEq.mockReturnValue({ maybeSingle: mocks.ownerMaybeSingle });
    mocks.ownerSelect.mockReturnValue({ eq: mocks.ownerEq });
    mocks.eq.mockReturnValue({ or: mocks.or });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ update: mocks.update, select: mocks.ownerSelect });
    mocks.getAdmin.mockReturnValue({ rpc: mocks.rpc, from: mocks.from });
    mocks.resolveAppUrl.mockReturnValue("http://localhost:3000");
    mocks.create.mockResolvedValue({ id: "cs_test_career", url: "https://checkout.stripe.com/c/pay/cs_test_career" });
    mocks.retrieve.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_existing" });
    mocks.getStripeClient.mockReturnValue({ checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } } });
    mocks.toProviderError.mockReturnValue(new CommerceCheckoutError("provider"));
  });

  it("creates a guest attempt using only server-owned price, currency, URLs and metadata", async () => {
    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_career",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("prepare_stripe_catalog_checkout", {
      p_product_key: "career_planner",
      p_price_key: "career_planner_premium_eur",
      p_stripe_mode: "test",
      p_idempotency_key: attemptId,
      p_user_id: null,
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      line_items: [{ price: prepared.stripe_price_id, quantity: 1 }],
      success_url: "http://localhost:3000/career-planner/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/career-planner/checkout/cancel",
      client_reference_id: attemptId,
      metadata: expect.objectContaining({ checkout_attempt_id: attemptId }),
      payment_intent_data: {
        metadata: {
          checkout_attempt_id: attemptId,
          order_id: prepared.order_id,
        },
      },
    }), { idempotencyKey: attemptId });
    expect(mocks.create.mock.calls[0][0].metadata).not.toHaveProperty("flypath_user_id");
  });

  it("uses the authenticated identity only after server validation", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", account: { id: accountId, email: null } });
    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: accountId }, error: null });
    await createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" });

    expect(mocks.rpc).toHaveBeenCalledWith("prepare_stripe_catalog_checkout", {
      p_product_key: "career_planner",
      p_price_key: "career_planner_premium_eur",
      p_stripe_mode: "test",
      p_idempotency_key: attemptId,
      p_user_id: accountId,
    });
    expect(mocks.create.mock.calls[0][0].metadata).toHaveProperty("flypath_user_id", accountId);
  });

  it("reuses an existing Stripe session instead of creating a duplicate", async () => {
    mocks.single.mockResolvedValue({ data: { ...prepared, stripe_checkout_session_id: "cs_test_existing" }, error: null });
    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_existing",
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.retrieve).toHaveBeenCalledWith("cs_test_existing");
  });

  it("allows a new intent after the previous Checkout session is complete", async () => {
    mocks.single.mockResolvedValue({ data: { ...prepared, stripe_checkout_session_id: "cs_test_complete" }, error: null });
    mocks.retrieve.mockResolvedValue({ status: "complete", url: null });

    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({
      kind: "intent_conflict",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects reuse when the idempotency cookie belongs to another account", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", account: { id: accountId, email: null } });
    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: "9b1d8768-7a01-4e6f-b2dd-0d399857f8dd" }, error: null });

    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({
      kind: "intent_conflict",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps a Stripe-created session recoverable when persisting its ID fails", async () => {
    mocks.sessionMaybeSingle.mockResolvedValue({ data: null, error: new Error("database unavailable") });
    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({
      kind: "persistence",
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.any(Object), { idempotencyKey: attemptId });
  });

  it("classifies a provider failure without leaking provider details", async () => {
    mocks.create.mockRejectedValue(new Error("provider detail"));
    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({
      kind: "provider",
      message: "Checkout could not be created",
    });
  });

  it("does not start checkout when the server session state is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable" });
    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({
      kind: "session",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed when the prepared price belongs to another Stripe mode", async () => {
    mocks.getStripeConfiguration.mockReturnValue({ mode: "live" });

    await expect(createCareerPlannerPremiumCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" }))
      .rejects.toMatchObject({ kind: "catalog" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps the approved commercial constants explicit", () => {
    expect(CAREER_PLANNER_PREMIUM_CHECKOUT_EXPECTED_VALUES).toEqual({
      currency: "EUR",
      priceKey: "career_planner_premium_eur",
      unitAmount: 595,
    });
  });
});
