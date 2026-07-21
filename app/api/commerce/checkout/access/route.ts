import { NextResponse } from "next/server";
import { CAREER_PLANNER_CHECKOUT_INTENT_COOKIE } from "@/lib/commerce/checkout";
import { isCommerceUuid } from "@/lib/commerce/contracts";
import {
  CAREER_PLANNER_DELIVERY_COOKIE,
  CAREER_PLANNER_DELIVERY_TOKEN_MAX_AGE_SECONDS,
  getCookieValue,
  isCareerPlannerDeliveryToken,
  issueCareerPlannerDeliveryAccess,
} from "@/lib/commerce/career-planner-delivery";
import { RequestBodyTooLargeError, isSameOriginRequest, readJsonBodyWithinLimit } from "@/lib/tracking/server";

const INVALID_REQUEST = { error: "No hemos podido verificar el pago." };
const ACCESS_REQUEST_MAX_BODY_SIZE = 1_024;

function readSessionId(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    typeof (value as { sessionId?: unknown }).sessionId !== "string"
  ) {
    return null;
  }
  return (value as { sessionId: string }).sessionId;
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

  const checkoutIntentId = getCookieValue(request.headers.get("cookie"), CAREER_PLANNER_CHECKOUT_INTENT_COOKIE);
  const currentDeliveryToken = getCookieValue(request.headers.get("cookie"), CAREER_PLANNER_DELIVERY_COOKIE);
  if (isCareerPlannerDeliveryToken(currentDeliveryToken)) return NextResponse.json({ ok: true });
  if (!isCommerceUuid(checkoutIntentId)) return NextResponse.json(INVALID_REQUEST, { status: 403 });

  try {
    const delivery = await issueCareerPlannerDeliveryAccess(sessionId, checkoutIntentId);
    if (!delivery) return NextResponse.json(INVALID_REQUEST, { status: 403 });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CAREER_PLANNER_DELIVERY_COOKIE, delivery.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.min(delivery.maxAge, CAREER_PLANNER_DELIVERY_TOKEN_MAX_AGE_SECONDS),
    });
    return response;
  } catch {
    return NextResponse.json(INVALID_REQUEST, { status: 503 });
  }
}

export const runtime = "nodejs";
