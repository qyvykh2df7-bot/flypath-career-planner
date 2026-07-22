export const AEROCOMMS_PRO_CUSTOMER_PORTAL_ENDPOINT = "/api/stripe/customer-portal";

export type AeroCommsProCustomerPortalStartResult =
  | { status: "redirect"; url: string }
  | { status: "error"; message: string };

function isHostedStripePortalUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "billing.stripe.com";
  } catch {
    return false;
  }
}

/** Starts the closed server-owned Customer Portal flow for the current account. */
export async function startAeroCommsProCustomerPortal(
  request: typeof fetch = fetch,
): Promise<AeroCommsProCustomerPortalStartResult> {
  try {
    const response = await request(AEROCOMMS_PRO_CUSTOMER_PORTAL_ENDPOINT, {
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
      : "No hemos podido abrir la gestión de tu suscripción. Inténtalo de nuevo.";

    if (!response.ok || !isHostedStripePortalUrl(payload?.url)) {
      return { status: "error", message };
    }
    return { status: "redirect", url: payload.url };
  } catch {
    return { status: "error", message: "No hemos podido abrir la gestión de tu suscripción. Inténtalo de nuevo." };
  }
}
