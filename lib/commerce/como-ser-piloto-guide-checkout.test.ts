import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionState: vi.fn(),
  getAdmin: vi.fn(),
  getStripeClient: vi.fn(),
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
  resolveStripeAppUrl: mocks.resolveAppUrl,
  toStripeProviderError: mocks.toProviderError,
}));

import { CommerceCheckoutError } from "./career-planner-checkout";
import {
  COMO_SER_PILOTO_GUIDE_CHECKOUT_EXPECTED_VALUES,
  createComoSerPilotoGuideCheckout,
} from "./como-ser-piloto-guide-checkout";

const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const accountId = "6b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const prepared = {
  checkout_attempt_id: attemptId,
  order_id: "7b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  product_price_id: "8b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  stripe_price_id: "price_test_como_ser_piloto_guide",
  stripe_checkout_session_id: null,
  checkout_status: "initiated",
};

describe("Cómo ser Piloto guide Checkout server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionState.mockResolvedValue({ status: "anonymous" });
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
    mocks.create.mockResolvedValue({ id: "cs_test_guide", url: "https://checkout.stripe.com/c/pay/cs_test_guide" });
    mocks.retrieve.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_existing" });
    mocks.getStripeClient.mockReturnValue({ checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } } });
    mocks.toProviderError.mockReturnValue(new CommerceCheckoutError("provider"));
  });

  it("creates a guest guide order from only server-owned catalog values", async () => {
    await expect(createComoSerPilotoGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_guide",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("prepare_como_ser_piloto_guide_checkout", {
      p_idempotency_key: attemptId,
      p_user_id: null,
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      line_items: [{ price: prepared.stripe_price_id, quantity: 1 }],
      success_url: "http://localhost:3000/guia-como-ser-piloto/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/guia-como-ser-piloto/checkout/cancel",
      client_reference_id: attemptId,
      metadata: expect.objectContaining({ flypath_checkout_product: "como_ser_piloto_guide" }),
    }), { idempotencyKey: attemptId });
    expect(mocks.create.mock.calls[0][0].metadata).not.toHaveProperty("flypath_user_id");
  });

  it("uses a validated authenticated identity but never accepts it from the browser", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", account: { id: accountId, email: null } });
    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: accountId }, error: null });
    await createComoSerPilotoGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" });
    expect(mocks.rpc).toHaveBeenCalledWith("prepare_como_ser_piloto_guide_checkout", {
      p_idempotency_key: attemptId,
      p_user_id: accountId,
    });
    expect(mocks.create.mock.calls[0][0].metadata).toHaveProperty("flypath_user_id", accountId);
  });

  it("reuses an uncompleted Stripe session and rejects an account-switched intent", async () => {
    mocks.single.mockResolvedValue({ data: { ...prepared, stripe_checkout_session_id: "cs_test_existing" }, error: null });
    await expect(createComoSerPilotoGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).resolves.toEqual({
      url: "https://checkout.stripe.com/c/pay/cs_test_existing",
    });
    expect(mocks.create).not.toHaveBeenCalled();

    mocks.getSessionState.mockResolvedValue({ status: "authenticated", account: { id: accountId, email: null } });
    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: "9b1d8768-7a01-4e6f-b2dd-0d399857f8dd" }, error: null });
    await expect(createComoSerPilotoGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({ kind: "intent_conflict" });
  });

  it("does not start a guide checkout when the identity service is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable" });
    await expect(createComoSerPilotoGuideCheckout({ idempotencyKey: attemptId, requestOrigin: "http://localhost:3000" })).rejects.toMatchObject({ kind: "session" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("keeps the approved guide commercial constants explicit", () => {
    expect(COMO_SER_PILOTO_GUIDE_CHECKOUT_EXPECTED_VALUES).toEqual({
      currency: "EUR",
      priceKey: "como_ser_piloto_guide_eur",
      unitAmount: 1495,
    });
  });
});
