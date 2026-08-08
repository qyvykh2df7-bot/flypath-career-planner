import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  COMMERCE_CHECKOUT_REQUEST_MAX_BODY_SIZE,
  getCommerceOneTimeProduct,
  parseCommerceCheckoutRequest,
} from "@/lib/commerce/checkout";
import {
  CommerceCheckoutError,
  createCareerPlannerPremiumCheckout,
} from "@/lib/commerce/career-planner-checkout";
import { createComoSerPilotoGuideCheckout } from "@/lib/commerce/como-ser-piloto-guide-checkout";
import { createPrePplGuideCheckout } from "@/lib/commerce/pre-ppl-guide-checkout";
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
function response(body: Record<string, unknown>, status: number, intentId: string | null, cookieName: string | null) {
  const result = NextResponse.json(body, { status });
  if (intentId && cookieName) {
    result.cookies.set(cookieName, intentId, {
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
    return response({ error: INVALID_REQUEST_MESSAGE }, 403, null, null);
  }

  let checkoutRequest: ReturnType<typeof parseCommerceCheckoutRequest>;
  try {
    checkoutRequest = parseCommerceCheckoutRequest(
      await readJsonBodyWithinLimit(request, COMMERCE_CHECKOUT_REQUEST_MAX_BODY_SIZE),
    );
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return response({ error: INVALID_REQUEST_MESSAGE }, 413, null, null);
    }
    return response({ error: INVALID_REQUEST_MESSAGE }, 400, null, null);
  }

  const product = getCommerceOneTimeProduct(checkoutRequest.productKey);

  const cookieHeader = request.headers.get("cookie") ?? "";
  const existingIntent = cookieHeader
    .split(";")
    .map((value) => value.trim().split("=", 2))
    .find(([name]) => name === product.checkoutIntentCookie)?.[1];
  let intentId = existingIntent && isCommerceUuid(existingIntent) ? existingIntent : randomUUID();
  const createCheckout = checkoutRequest.productKey === "career_planner_premium"
    ? createCareerPlannerPremiumCheckout
    : checkoutRequest.productKey === "como_ser_piloto_guide"
      ? createComoSerPilotoGuideCheckout
      : createPrePplGuideCheckout;

  try {
    let checkout;
    try {
      checkout = await createCheckout({
        idempotencyKey: intentId,
        requestOrigin: getRequestOrigin(request),
      });
    } catch (error) {
      if (!(error instanceof CommerceCheckoutError) || error.kind !== "intent_conflict") throw error;

      // A cookie can outlive a login/logout or account switch. Start a new
      // server-owned intent instead of reusing another identity's attempt.
      intentId = randomUUID();
      checkout = await createCheckout({
        idempotencyKey: intentId,
        requestOrigin: getRequestOrigin(request),
      });
    }
    return response({ url: checkout.url }, 200, intentId, product.checkoutIntentCookie);
  } catch (error) {
    if (
      error instanceof CommerceCheckoutError ||
      error instanceof StripeConfigurationError ||
      error instanceof StripeProviderError
    ) {
      return response({ error: CHECKOUT_UNAVAILABLE_MESSAGE }, 503, intentId, product.checkoutIntentCookie);
    }

    console.error("[FlyPath] Commerce Checkout failed.");
    return response({ error: CHECKOUT_UNAVAILABLE_MESSAGE }, 500, intentId, product.checkoutIntentCookie);
  }
}
