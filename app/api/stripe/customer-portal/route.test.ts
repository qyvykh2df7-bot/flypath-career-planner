import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createPortal: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/aerocomms-pro-customer-portal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/aerocomms-pro-customer-portal")>();
  return { ...actual, createAeroCommsProCustomerPortal: mocks.createPortal };
});

import { AeroCommsProCustomerPortalError } from "@/lib/commerce/aerocomms-pro-customer-portal";
import { StripeProviderError } from "@/lib/commerce/stripe";
import { POST } from "./route";

const origin = "https://flypath.test";

function request(payload: unknown, requestOrigin = origin) {
  return new Request(`${origin}/api/stripe/customer-portal`, {
    method: "POST",
    headers: { origin: requestOrigin },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/stripe/customer-portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.createPortal.mockResolvedValue({ url: "https://billing.stripe.com/p/session/test_aerocomms" });
  });

  it("creates a portal from an empty same-origin request", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ url: "https://billing.stripe.com/p/session/test_aerocomms" });
    expect(mocks.createPortal).toHaveBeenCalledWith({ requestOrigin: origin });
  });

  it("requires same-origin, an account, and an eligible subscription", async () => {
    expect((await POST(request({}, "https://attacker.test"))).status).toBe(403);
    expect((await POST(request({ customerId: "cus_attacker" }))).status).toBe(400);

    mocks.createPortal.mockRejectedValueOnce(new AeroCommsProCustomerPortalError("authentication_required"));
    const anonymous = await POST(request({}));
    expect(anonymous.status).toBe(401);

    mocks.createPortal.mockRejectedValueOnce(new AeroCommsProCustomerPortalError("subscription"));
    const noSubscription = await POST(request({}));
    expect(noSubscription.status).toBe(404);
    await expect(noSubscription.json()).resolves.toEqual({ error: "No encontramos una suscripción que puedas gestionar." });
  });

  it("returns generic retryable errors for Stripe failures", async () => {
    mocks.createPortal.mockRejectedValue(new StripeProviderError("connection"));

    const response = await POST(request({}));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "No hemos podido abrir la gestión de tu suscripción. Inténtalo de nuevo." });
    expect(console.error).toHaveBeenCalledWith(
      "[FlyPath] AeroComms Pro Customer Portal unavailable: stripe_provider_connection.",
    );
  });
});
