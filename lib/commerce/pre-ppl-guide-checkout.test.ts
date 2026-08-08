import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionState: vi.fn(), getAdmin: vi.fn(), getStripeClient: vi.fn(), getStripeConfiguration: vi.fn(),
  resolveAppUrl: vi.fn(), toProviderError: vi.fn(), rpc: vi.fn(), single: vi.fn(), from: vi.fn(),
  update: vi.fn(), eq: vi.fn(), or: vi.fn(), select: vi.fn(), ownerSelect: vi.fn(), ownerEq: vi.fn(),
  ownerMaybeSingle: vi.fn(), sessionMaybeSingle: vi.fn(), create: vi.fn(), retrieve: vi.fn(),
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

import { CommerceCheckoutError } from "./career-planner-checkout";
import { createPrePplGuideCheckout, PRE_PPL_GUIDE_CHECKOUT_EXPECTED_VALUES } from "./pre-ppl-guide-checkout";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const prepared = {
  checkout_attempt_id: attemptId,
  order_id: "7b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  product_price_id: "8b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  stripe_price_id: "price_1U2Cf6KuujVRKb0PVULrzLEY",
  stripe_checkout_session_id: null,
  checkout_status: "initiated",
};

describe("Pre-PPL Checkout server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionState.mockResolvedValue({ status: "anonymous" });
    mocks.getStripeConfiguration.mockReturnValue({ mode: "live" });
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
    mocks.resolveAppUrl.mockReturnValue("https://www.flypath.es");
    mocks.create.mockResolvedValue({ id: "cs_live_preppl", url: "https://checkout.stripe.com/c/pay/cs_live_preppl" });
    mocks.retrieve.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_live_existing" });
    mocks.getStripeClient.mockReturnValue({ checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } } });
    mocks.toProviderError.mockReturnValue(new CommerceCheckoutError("provider"));
  });

  it("creates a guest order from only server-owned Pre-PPL Live catalog values", async () => {
    await expect(createPrePplGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "https://www.flypath.es" })).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_live_preppl",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("prepare_stripe_catalog_checkout", {
      p_product_key: "preppl_guide", p_price_key: "preppl_guide_eur", p_stripe_mode: "live", p_idempotency_key: attemptId, p_user_id: null,
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment", line_items: [{ price: prepared.stripe_price_id, quantity: 1 }],
      success_url: "https://www.flypath.es/pre-ppl/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://www.flypath.es/pre-ppl/checkout/cancel",
      metadata: expect.objectContaining({ flypath_checkout_product: "preppl_guide" }),
    }), { idempotencyKey: attemptId });
    expect(mocks.create.mock.calls[0][0].metadata).not.toHaveProperty("flypath_user_id");
  });

  it("fails closed outside a catalog mode that has no Pre-PPL binding", async () => {
    mocks.getStripeConfiguration.mockReturnValue({ mode: "test" });
    await expect(createPrePplGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "https://www.flypath.es" }))
      .rejects.toMatchObject({ kind: "catalog" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("keeps the approved commercial constants explicit", () => {
    expect(PRE_PPL_GUIDE_CHECKOUT_EXPECTED_VALUES).toEqual({ currency: "EUR", priceKey: "preppl_guide_eur", unitAmount: 2395 });
  });
});
