import { describe, expect, it, vi } from "vitest";

import { AEROCOMMS_PRO_CHECKOUT_ENDPOINT, startAeroCommsProCheckout } from "./pro-checkout-client";

describe("AeroComms Pro Checkout client boundary", () => {
  it("sends an empty server-owned request and accepts only Stripe Checkout URLs", async () => {
    const request = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ url: "https://checkout.stripe.com/c/pay/cs_test_aerocomms" }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));

    await expect(startAeroCommsProCheckout(request)).resolves.toEqual({
      status: "redirect",
      url: "https://checkout.stripe.com/c/pay/cs_test_aerocomms",
    });
    expect(request).toHaveBeenCalledWith(AEROCOMMS_PRO_CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      credentials: "same-origin",
    });
  });

  it("returns generic server errors and rejects non-Stripe redirect targets", async () => {
    const rejected = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ url: "https://attacker.example/checkout" }),
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    const unauthenticated = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: "Inicia sesión para suscribirte a AeroComms Pro." }),
      { status: 401, headers: { "content-type": "application/json" } },
    ));

    await expect(startAeroCommsProCheckout(rejected)).resolves.toEqual({
      status: "error",
      message: "No hemos podido abrir la suscripción. Inténtalo de nuevo.",
    });
    await expect(startAeroCommsProCheckout(unauthenticated)).resolves.toEqual({
      status: "error",
      message: "Inicia sesión para suscribirte a AeroComms Pro.",
    });
  });
});
