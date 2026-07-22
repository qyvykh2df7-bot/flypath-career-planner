import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  AeroCommsProCheckoutError,
  createAeroCommsProSubscriptionCheckout,
} from "@/lib/commerce/aerocomms-pro-checkout";
import { isCommerceUuid } from "@/lib/commerce/contracts";
import { StripeConfigurationError, StripeProviderError } from "@/lib/commerce/stripe";
import {
  getRequestOrigin,
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 1_024;
const INTENT_COOKIE = "flypath_checkout_intent_aerocomms_pro";
const INVALID_REQUEST = "Solicitud de suscripción inválida.";
const AUTHENTICATION_REQUIRED = "Inicia sesión para suscribirte a AeroComms Pro.";
const CHECKOUT_UNAVAILABLE = "No hemos podido abrir la suscripción. Inténtalo de nuevo.";

function logCheckoutUnavailable(error: AeroCommsProCheckoutError | StripeConfigurationError | StripeProviderError) {
  const diagnostic = error instanceof AeroCommsProCheckoutError
    ? `checkout_${error.kind}`
    : error instanceof StripeConfigurationError
      ? `stripe_configuration_${error.issue}`
      : `stripe_provider_${error.issue}`;

  console.error(`[FlyPath] AeroComms Pro Checkout unavailable: ${diagnostic}.`);
}

function response(body: Record<string, unknown>, status: number, intentId: string | null) {
  const result = NextResponse.json(body, { status });
  if (intentId) {
    result.cookies.set(INTENT_COOKIE, intentId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
  }
  return result;
}

async function parseEmptyRequest(request: Request): Promise<void> {
  const body = await readJsonBodyWithinLimit(request, MAX_BODY_SIZE);
  if (typeof body !== "object" || body === null || Array.isArray(body) || Object.keys(body).length !== 0) {
    throw new Error("Invalid request body");
  }
}

function existingIntentFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const value = cookieHeader
    .split(";")
    .map((item) => item.trim().split("=", 2))
    .find(([name]) => name === INTENT_COOKIE)?.[1];

  return value && isCommerceUuid(value) ? value : null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return response({ error: INVALID_REQUEST }, 403, null);

  try {
    await parseEmptyRequest(request);
  } catch (error) {
    return response({ error: INVALID_REQUEST }, error instanceof RequestBodyTooLargeError ? 413 : 400, null);
  }

  let intentId = existingIntentFromRequest(request) ?? randomUUID();
  try {
    let checkout;
    try {
      checkout = await createAeroCommsProSubscriptionCheckout({
        idempotencyKey: intentId,
        requestOrigin: getRequestOrigin(request),
      });
    } catch (error) {
      if (!(error instanceof AeroCommsProCheckoutError) || error.kind !== "intent_conflict") throw error;
      intentId = randomUUID();
      checkout = await createAeroCommsProSubscriptionCheckout({
        idempotencyKey: intentId,
        requestOrigin: getRequestOrigin(request),
      });
    }
    return response({ url: checkout.url }, 200, intentId);
  } catch (error) {
    if (error instanceof AeroCommsProCheckoutError && error.kind === "authentication_required") {
      return response({ error: AUTHENTICATION_REQUIRED }, 401, null);
    }
    if (
      error instanceof AeroCommsProCheckoutError ||
      error instanceof StripeConfigurationError ||
      error instanceof StripeProviderError
    ) {
      logCheckoutUnavailable(error);
      return response({ error: CHECKOUT_UNAVAILABLE }, 503, intentId);
    }

    console.error("[FlyPath] AeroComms Pro Checkout failed.");
    return response({ error: CHECKOUT_UNAVAILABLE }, 500, intentId);
  }
}
