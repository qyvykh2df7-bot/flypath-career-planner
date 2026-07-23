import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionState: vi.fn(),
  from: vi.fn(),
  createPortalSession: vi.fn(),
  getStripeClient: vi.fn(),
  getStripeConfiguration: vi.fn(),
  resolveStripeAppUrl: vi.fn(),
  toProviderError: vi.fn(),
  subscriptionMaybeSingle: vi.fn(),
  bindingMaybeSingle: vi.fn(),
  customerMaybeSingle: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getFlyPathSessionState: mocks.getSessionState }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => ({ from: mocks.from }) }));
vi.mock("./stripe", () => ({
  getStripeClient: mocks.getStripeClient,
  getStripeConfiguration: mocks.getStripeConfiguration,
  resolveStripeAppUrl: mocks.resolveStripeAppUrl,
  toStripeProviderError: mocks.toProviderError,
}));

import {
  AeroCommsProCustomerPortalError,
  createAeroCommsProCustomerPortal,
} from "./aerocomms-pro-customer-portal";

const accountId = "2e2d5f1b-87b5-47a8-a0b0-908ceb5ab3ac";

function setupPersistence() {
  mocks.from.mockImplementation((table: string) => {
    if (table === "subscriptions") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                order: () => ({
                  limit: () => ({ maybeSingle: mocks.subscriptionMaybeSingle }),
                }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === "stripe_catalog_bindings") {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: mocks.bindingMaybeSingle }),
            }),
          }),
        }),
      };
    }

    return {
      select: () => ({
        eq: () => ({ maybeSingle: mocks.customerMaybeSingle }),
      }),
    };
  });
}

describe("AeroComms Pro Customer Portal server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", account: { id: accountId, email: null } });
    mocks.getStripeConfiguration.mockReturnValue({ mode: "test" });
    mocks.subscriptionMaybeSingle.mockResolvedValue({
      data: { product_price_id: "price-record", stripe_customer_record_id: "customer-record" },
      error: null,
    });
    mocks.bindingMaybeSingle.mockResolvedValue({ data: { id: "binding-record" }, error: null });
    mocks.customerMaybeSingle.mockResolvedValue({ data: { user_id: accountId, stripe_customer_id: "cus_aerocomms" }, error: null });
    mocks.resolveStripeAppUrl.mockReturnValue("https://flypath.test");
    mocks.createPortalSession.mockResolvedValue({ url: "https://billing.stripe.com/p/session/test_aerocomms" });
    mocks.getStripeClient.mockReturnValue({ billingPortal: { sessions: { create: mocks.createPortalSession } } });
    mocks.toProviderError.mockReturnValue(new AeroCommsProCustomerPortalError("provider"));
    setupPersistence();
  });

  it("requires a validated FlyPath account", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "anonymous" });

    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "authentication_required" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("creates a portal only for the authenticated account's current subscription", async () => {
    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://request-origin.test" }))
      .resolves.toEqual({ url: "https://billing.stripe.com/p/session/test_aerocomms" });

    expect(mocks.from).toHaveBeenNthCalledWith(1, "subscriptions");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "stripe_catalog_bindings");
    expect(mocks.from).toHaveBeenNthCalledWith(3, "stripe_customers");
    expect(mocks.createPortalSession).toHaveBeenCalledWith({
      customer: "cus_aerocomms",
      return_url: "https://flypath.test/aerocomms/app/profile",
    });
  });

  it("does not open a Live portal from a Test subscription record", async () => {
    mocks.getStripeConfiguration.mockReturnValue({ mode: "live" });
    mocks.subscriptionMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "subscription" });
    expect(mocks.createPortalSession).not.toHaveBeenCalled();
  });

  it("rejects users without an eligible subscription or a customer linked to another account", async () => {
    mocks.subscriptionMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "subscription" });
    expect(mocks.createPortalSession).not.toHaveBeenCalled();

    mocks.customerMaybeSingle.mockResolvedValueOnce({
      data: { user_id: "6e2d5f1b-87b5-47a8-a0b0-908ceb5ab3ac", stripe_customer_id: "cus_other" },
      error: null,
    });
    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "subscription" });
    expect(mocks.createPortalSession).not.toHaveBeenCalled();

    mocks.bindingMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "subscription" });
    expect(mocks.createPortalSession).not.toHaveBeenCalled();
  });

  it("fails closed for Stripe failures and unexpected redirect destinations", async () => {
    mocks.createPortalSession.mockRejectedValueOnce(new Error("provider detail"));
    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "provider" });
    expect(mocks.toProviderError).toHaveBeenCalled();

    mocks.createPortalSession.mockResolvedValueOnce({ url: "https://attacker.test/portal" });
    await expect(createAeroCommsProCustomerPortal({ requestOrigin: "https://flypath.test" }))
      .rejects.toMatchObject({ kind: "provider" });
  });
});
