import { NextResponse } from "next/server";
import { PRE_PPL_GUIDE_CHECKOUT_INTENT_COOKIE } from "@/lib/commerce/checkout";
import { isCommerceUuid } from "@/lib/commerce/contracts";
import {
  getPrePplCookieValue,
  issuePrePplGuideDeliveryAccess,
  PRE_PPL_GUIDE_DELIVERY_COOKIE,
  PRE_PPL_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/commerce/pre-ppl-guide-delivery";
import { RequestBodyTooLargeError, isSameOriginRequest, readJsonBodyWithinLimit } from "@/lib/tracking/server";

const INVALID_REQUEST = { error: "No hemos podido verificar el pago." };
const ACCESS_REQUEST_MAX_BODY_SIZE = 1_024;

function readSessionId(value: unknown): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length !== 1) return null;
  return typeof (value as { sessionId?: unknown }).sessionId === "string" ? (value as { sessionId: string }).sessionId : null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json(INVALID_REQUEST, { status: 403 });
  let sessionId: string | null;
  try {
    sessionId = readSessionId(await readJsonBodyWithinLimit(request, ACCESS_REQUEST_MAX_BODY_SIZE));
  } catch (error) {
    return NextResponse.json(INVALID_REQUEST, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  if (!sessionId) return NextResponse.json(INVALID_REQUEST, { status: 400 });
  const checkoutIntentId = getPrePplCookieValue(request.headers.get("cookie"), PRE_PPL_GUIDE_CHECKOUT_INTENT_COOKIE);
  if (!isCommerceUuid(checkoutIntentId)) return NextResponse.json(INVALID_REQUEST, { status: 403 });
  try {
    const delivery = await issuePrePplGuideDeliveryAccess(sessionId, checkoutIntentId);
    if (!delivery) return NextResponse.json(INVALID_REQUEST, { status: 403 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(PRE_PPL_GUIDE_DELIVERY_COOKIE, delivery.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.min(delivery.maxAge, PRE_PPL_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS),
    });
    return response;
  } catch {
    return NextResponse.json(INVALID_REQUEST, { status: 503 });
  }
}

export const runtime = "nodejs";
