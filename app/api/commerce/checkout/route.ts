import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  COMMERCE_CHECKOUT_REQUEST_MAX_BODY_SIZE,
  parseCommerceCheckoutRequest,
} from "@/lib/commerce/checkout";
import {
  CommerceCheckoutError,
  createCareerPlannerPremiumCheckout,
} from "@/lib/commerce/career-planner-checkout";
import { isCommerceUuid } from "@/lib/commerce/contracts";
import { StripeConfigurationError, StripeProviderError } from "@/lib/commerce/stripe";
import {
  getRequestOrigin,
  isSameOriginRequest,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const INVALID_REQUEST_MESSAGE = "Solicitud de pago inválida.";
const CHECKOUT_UNAVAILABLE_MESSAGE = "No hemos podido abrir el pago. Inténtalo de nuevo.";
const CHECKOUT_INTENT_COOKIE = "flypath_checkout_intent_career_planner";

function response(body: Record<string, unknown>, status: number, intentId: string | null) {
  const result = NextResponse.json(body, { status });
  if (intentId) {
    result.cookies.set(CHECKOUT_INTENT_COOKIE, intentId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // The browser must return this server-owned key to the API route on a
      // retry. A `/career-planner` path would not match `/api/commerce/checkout`.
      path: "/",
      maxAge: 60 * 60,
    });
  }
  return result;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return response({ error: INVALID_REQUEST_MESSAGE }, 403, null);
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, COMMERCE_CHECKOUT_REQUEST_MAX_BODY_SIZE);
    parseCommerceCheckoutRequest(body);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return response({ error: INVALID_REQUEST_MESSAGE }, 413, null);
    }
    return response({ error: INVALID_REQUEST_MESSAGE }, 400, null);
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingIntent = cookieHeader
    .split(";")
    .map((value) => value.trim().split("=", 2))
    .find(([name]) => name === CHECKOUT_INTENT_COOKIE)?.[1];
  let intentId = existingIntent && isCommerceUuid(existingIntent) ? existingIntent : randomUUID();

  try {
    let checkout;
    try {
      checkout = await createCareerPlannerPremiumCheckout({
        idempotencyKey: intentId,
        requestOrigin: getRequestOrigin(request),
      });
    } catch (error) {
      if (!(error instanceof CommerceCheckoutError) || error.kind !== "intent_conflict") throw error;

      // A cookie can outlive a login/logout or account switch. Start a new
      // server-owned intent instead of reusing another identity's attempt.
      intentId = randomUUID();
      checkout = await createCareerPlannerPremiumCheckout({
        idempotencyKey: intentId,
        requestOrigin: getRequestOrigin(request),
      });
    }
    return response({ url: checkout.url }, 200, intentId);
  } catch (error) {
    if (
      error instanceof CommerceCheckoutError ||
      error instanceof StripeConfigurationError ||
      error instanceof StripeProviderError
    ) {
      return response({ error: CHECKOUT_UNAVAILABLE_MESSAGE }, 503, intentId);
    }

    console.error("[FlyPath] Career Planner Checkout failed.");
    return response({ error: CHECKOUT_UNAVAILABLE_MESSAGE }, 500, intentId);
  }
}
