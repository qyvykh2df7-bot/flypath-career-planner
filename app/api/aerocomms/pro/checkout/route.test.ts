import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createCheckout: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/aerocomms-pro-checkout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/aerocomms-pro-checkout")>();
  return { ...actual, createAeroCommsProSubscriptionCheckout: mocks.createCheckout };
});

import { AeroCommsProCheckoutError } from "@/lib/commerce/aerocomms-pro-checkout";
import { POST } from "./route";

const origin = "https://flypath.test";

function request(payload: unknown, options: { origin?: string; cookie?: string } = {}) {
  return new Request(`${origin}/api/aerocomms/pro/checkout`, {
    method: "POST",
    headers: {
      origin: options.origin ?? origin,
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/aerocomms/pro/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_aerocomms" });
  });

  it("creates only a server-owned Checkout from an empty browser request", async () => {
    const response = await POST(request({}));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_aerocomms" });
    expect(mocks.createCheckout).toHaveBeenCalledWith(expect.objectContaining({ requestOrigin: origin }));
    expect(response.headers.get("set-cookie")).toContain("flypath_checkout_intent_aerocomms_pro=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Path=/");
  });

  it("rejects client price, amount, currency, quantity, user, and return URL manipulation", async () => {
    for (const payload of [
      { priceId: "price_attacker" },
      { amount: 1 },
      { currency: "USD" },
      { quantity: 99 },
      { userId: "attacker" },
      { successUrl: "https://attacker.test" },
      { productKey: "aerocomms_pro" },
    ]) {
      const response = await POST(request(payload));
      expect(response.status).toBe(400);
    }
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("requires same-origin and an authenticated account without leaking internals", async () => {
    const crossOrigin = await POST(request({}, { origin: "https://attacker.test" }));
    expect(crossOrigin.status).toBe(403);
    expect(mocks.createCheckout).not.toHaveBeenCalled();

    mocks.createCheckout.mockRejectedValue(new AeroCommsProCheckoutError("authentication_required"));
    const anonymous = await POST(request({}));
    expect(anonymous.status).toBe(401);
    await expect(anonymous.json()).resolves.toEqual({ error: "Inicia sesión para suscribirte a AeroComms Pro." });
  });

  it("reuses a server-owned intent on retry and returns generic provider errors", async () => {
    const intentId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
    await POST(request({}, { cookie: `flypath_checkout_intent_aerocomms_pro=${intentId}` }));
    expect(mocks.createCheckout).toHaveBeenCalledWith({ idempotencyKey: intentId, requestOrigin: origin });

    mocks.createCheckout.mockRejectedValue(new AeroCommsProCheckoutError("provider"));
    const response = await POST(request({}));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "No hemos podido abrir la suscripción. Inténtalo de nuevo." });
  });
});
