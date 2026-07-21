export const AEROCOMMS_PRO_CHECKOUT_ENDPOINT = "/api/aerocomms/pro/checkout";

export type AeroCommsProCheckoutStartResult =
  | { status: "redirect"; url: string }
  | { status: "error"; message: string };

function isHostedStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

/** Starts the closed Pro Checkout route; no commercial values leave the UI. */
export async function startAeroCommsProCheckout(
  request: typeof fetch = fetch,
): Promise<AeroCommsProCheckoutStartResult> {
  try {
    const response = await request(AEROCOMMS_PRO_CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      credentials: "same-origin",
    });
    const data: unknown = await response.json().catch(() => null);
    const payload = typeof data === "object" && data !== null && !Array.isArray(data)
      ? data as { error?: unknown; url?: unknown }
      : null;
    const message = typeof payload?.error === "string"
      ? payload.error
      : "No hemos podido abrir la suscripción. Inténtalo de nuevo.";

    if (!response.ok || !isHostedStripeCheckoutUrl(payload?.url)) {
      return { status: "error", message };
    }
    return { status: "redirect", url: payload.url };
  } catch {
    return { status: "error", message: "No hemos podido abrir la suscripción. Inténtalo de nuevo." };
  }
}
