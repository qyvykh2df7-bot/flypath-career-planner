import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionState: vi.fn(),
  rpc: vi.fn(),
  rpcSingle: vi.fn(),
  ownerMaybeSingle: vi.fn(),
  persistMaybeSingle: vi.fn(),
  from: vi.fn(),
  create: vi.fn(),
  retrieve: vi.fn(),
  getStripeClient: vi.fn(),
  resolveStripeAppUrl: vi.fn(),
  toProviderError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getFlyPathSessionState: mocks.getSessionState }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ rpc: mocks.rpc, from: mocks.from }) }));
vi.mock("./stripe", () => ({
  getStripeClient: mocks.getStripeClient,
  resolveStripeAppUrl: mocks.resolveStripeAppUrl,
  toStripeProviderError: mocks.toProviderError,
}));

import {
  AeroCommsProCheckoutError,
  createAeroCommsProSubscriptionCheckout,
} from "./aerocomms-pro-checkout";

const accountId = "2e2d5f1b-87b5-47a8-a0b0-908ceb5ab3ac";
const attemptId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
const prepared = {
  checkout_attempt_id: attemptId,
  order_id: "6cbbe005-bbf1-4241-9949-82383c95b8cc",
  product_price_id: "9c42cc52-01fc-4d4c-b1cd-47109c5fb540",
  stripe_price_id: "price_1TvgG4KuujVRKb0PkofwZMz7",
  stripe_checkout_session_id: null,
  checkout_status: "initiated",
};

function setupPersistence() {
  mocks.from.mockImplementation(() => ({
    select: () => ({ eq: () => ({ maybeSingle: mocks.ownerMaybeSingle }) }),
    update: () => ({
      eq: () => ({
        or: () => ({
          select: () => ({ maybeSingle: mocks.persistMaybeSingle }),
        }),
      }),
    }),
  }));
}

describe("AeroComms Pro subscription Checkout server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", account: { id: accountId, email: null } });
    mocks.rpc.mockReturnValue({ single: mocks.rpcSingle });
    mocks.rpcSingle.mockResolvedValue({ data: prepared, error: null });
    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: accountId }, error: null });
    mocks.persistMaybeSingle.mockResolvedValue({ data: { id: attemptId }, error: null });
    setupPersistence();
    mocks.resolveStripeAppUrl.mockReturnValue("https://flypath.test");
    mocks.create.mockResolvedValue({ id: "cs_test_aerocomms", url: "https://checkout.stripe.com/c/pay/cs_test_aerocomms" });
    mocks.retrieve.mockResolvedValue({ status: "open", url: "https://checkout.stripe.com/c/pay/cs_test_existing" });
    mocks.getStripeClient.mockReturnValue({ checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } } });
    mocks.toProviderError.mockReturnValue(new AeroCommsProCheckoutError("provider"));
  });

  it("requires a validated FlyPath account and never accepts one from a caller", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "anonymous" });

    await expect(createAeroCommsProSubscriptionCheckout({ idempotencyKey: attemptId, requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "authentication_required" });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("uses only the server-resolved recurring catalog price and server-owned metadata", async () => {
    await expect(createAeroCommsProSubscriptionCheckout({ idempotencyKey: attemptId, requestOrigin: "https://flypath.test" }))
      .resolves.toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_aerocomms" });

    expect(mocks.rpc).toHaveBeenCalledWith("prepare_aerocomms_pro_subscription_checkout", {
      p_idempotency_key: attemptId,
      p_user_id: accountId,
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      line_items: [{ price: "price_1TvgG4KuujVRKb0PkofwZMz7", quantity: 1 }],
      success_url: "https://flypath.test/aerocomms/app/paywall?checkout=processing",
      cancel_url: "https://flypath.test/aerocomms/app/paywall?checkout=cancelled",
      client_reference_id: attemptId,
      metadata: expect.objectContaining({
        flypath_product_key: "aerocomms_pro",
        flypath_user_id: accountId,
        checkout_attempt_id: attemptId,
      }),
      subscription_data: expect.objectContaining({
        metadata: expect.objectContaining({ flypath_product_key: "aerocomms_pro", flypath_user_id: accountId }),
      }),
    }), { idempotencyKey: attemptId });
    expect(mocks.persistMaybeSingle).toHaveBeenCalled();
  });

  it("reuses an open server-owned session and rejects an intent from another account", async () => {
    mocks.rpcSingle.mockResolvedValue({ data: { ...prepared, stripe_checkout_session_id: "cs_test_existing" }, error: null });
    await expect(createAeroCommsProSubscriptionCheckout({ idempotencyKey: attemptId, requestOrigin: "https://flypath.test" }))
      .resolves.toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_existing" });
    expect(mocks.create).not.toHaveBeenCalled();

    mocks.ownerMaybeSingle.mockResolvedValue({ data: { user_id: "6e2d5f1b-87b5-47a8-a0b0-908ceb5ab3ac" }, error: null });
    await expect(createAeroCommsProSubscriptionCheckout({ idempotencyKey: attemptId, requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "intent_conflict" });
  });

  it("fails closed when account validation is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable" });
    await expect(createAeroCommsProSubscriptionCheckout({ idempotencyKey: attemptId, requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "session" });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
