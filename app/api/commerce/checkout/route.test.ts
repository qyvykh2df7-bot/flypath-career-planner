import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  createGuideCheckout: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/career-planner-checkout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/career-planner-checkout")>();
  return { ...actual, createCareerPlannerPremiumCheckout: mocks.createCheckout };
});
vi.mock("@/lib/commerce/como-ser-piloto-guide-checkout", () => ({
  createComoSerPilotoGuideCheckout: mocks.createGuideCheckout,
}));

import { POST } from "./route";

const origin = "https://flypath.test";

function request(payload: unknown, options: { origin?: string; cookie?: string } = {}) {
  return new Request(`${origin}/api/commerce/checkout`, {
    method: "POST",
    headers: {
      origin: options.origin ?? origin,
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/commerce/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_123" });
    mocks.createGuideCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_guide" });
  });

  it("uses a separate server-owned intent and creator for the closed guide key", async () => {
    const response = await POST(request({ productKey: "como_ser_piloto_guide" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_guide" });
    expect(mocks.createGuideCheckout).toHaveBeenCalledWith(expect.objectContaining({ requestOrigin: origin }));
    expect(mocks.createCheckout).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("flypath_checkout_intent_como_ser_piloto_guide=");
  });

  it("accepts only the closed product key and returns only the hosted Checkout URL", async () => {
    const response = await POST(request({ productKey: "career_planner_premium" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_123" });
    expect(mocks.createCheckout).toHaveBeenCalledWith(expect.objectContaining({ requestOrigin: origin }));
    expect(response.headers.get("set-cookie")).toContain("flypath_checkout_intent_career_planner=");
    expect(response.headers.get("set-cookie")).toContain("Path=/");
  });

  it("reuses the server-owned checkout intent cookie for a retry", async () => {
    const intentId = "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd";
    const response = await POST(request({ productKey: "career_planner_premium" }, {
      cookie: `flypath_checkout_intent_career_planner=${intentId}`,
    }));
    expect(response.status).toBe(200);
    expect(mocks.createCheckout).toHaveBeenCalledWith({ idempotencyKey: intentId, requestOrigin: origin });
  });

  it("rejects client attempts to choose prices, amounts, currencies, users or return URLs", async () => {
    for (const payload of [
      { productKey: "career_planner_premium", amount: 1 },
      { productKey: "career_planner_premium", currency: "USD" },
      { productKey: "career_planner_premium", priceId: "price_attacker" },
      { productKey: "career_planner_premium", userId: "attacker" },
      { productKey: "career_planner_premium", successUrl: "https://attacker.test" },
    ]) {
      const response = await POST(request(payload));
      expect(response.status).toBe(400);
    }
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects cross-origin calls before creating any checkout state", async () => {
    const response = await POST(request({ productKey: "career_planner_premium" }, { origin: "https://attacker.test" }));
    expect(response.status).toBe(403);
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("returns a retryable generic response when checkout preparation is unavailable", async () => {
    mocks.createCheckout.mockRejectedValue(new Error("internal provider detail"));
    const response = await POST(request({ productKey: "career_planner_premium" }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "No hemos podido abrir el pago. Inténtalo de nuevo." });
  });

  it("keeps the same cookie scoped to both the planner and checkout endpoint", async () => {
    const initial = await POST(request({ productKey: "career_planner_premium" }));
    const setCookie = initial.headers.get("set-cookie");
    const intentId = setCookie?.match(/flypath_checkout_intent_career_planner=([^;]+)/)?.[1];

    expect(intentId).toBeTruthy();
    expect(setCookie).toContain("Path=/");

    await POST(request({ productKey: "career_planner_premium" }, {
      cookie: `flypath_checkout_intent_career_planner=${intentId}`,
    }));
    expect(mocks.createCheckout).toHaveBeenLastCalledWith({ idempotencyKey: intentId, requestOrigin: origin });
  });

  it("rotates the server-owned intent after an account switch", async () => {
    const actual = await import("@/lib/commerce/career-planner-checkout");
    mocks.createCheckout
      .mockRejectedValueOnce(new actual.CommerceCheckoutError("intent_conflict"))
      .mockResolvedValueOnce({ url: "https://checkout.stripe.com/c/pay/cs_test_rotated" });

    const response = await POST(request({ productKey: "career_planner_premium" }, {
      cookie: "flypath_checkout_intent_career_planner=4b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_rotated" });
    expect(mocks.createCheckout).toHaveBeenCalledTimes(2);
    expect(mocks.createCheckout.mock.calls[1][0].idempotencyKey).not.toBe("4b1d8768-7a01-4e6f-b2dd-0d399857f8dd");
  });
});
