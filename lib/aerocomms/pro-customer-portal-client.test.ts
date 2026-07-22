import { describe, expect, it, vi } from "vitest";

import {
  AEROCOMMS_PRO_CUSTOMER_PORTAL_ENDPOINT,
  startAeroCommsProCustomerPortal,
} from "./pro-customer-portal-client";

describe("AeroComms Pro Customer Portal client", () => {
  it("redirects only to a hosted Stripe Billing Portal URL", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://billing.stripe.com/p/session/test_aerocomms" }),
    });

    await expect(startAeroCommsProCustomerPortal(request)).resolves.toEqual({
      status: "redirect",
      url: "https://billing.stripe.com/p/session/test_aerocomms",
    });
    expect(request).toHaveBeenCalledWith(AEROCOMMS_PRO_CUSTOMER_PORTAL_ENDPOINT, expect.objectContaining({
      method: "POST",
      body: "{}",
      credentials: "same-origin",
    }));
  });

  it("rejects an unexpected URL or an unavailable portal without redirecting", async () => {
    const invalidUrl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://attacker.test/portal" }),
    });
    await expect(startAeroCommsProCustomerPortal(invalidUrl)).resolves.toMatchObject({ status: "error" });

    const unavailable = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No encontramos una suscripción que puedas gestionar." }),
    });
    await expect(startAeroCommsProCustomerPortal(unavailable)).resolves.toEqual({
      status: "error",
      message: "No encontramos una suscripción que puedas gestionar.",
    });
  });
});
