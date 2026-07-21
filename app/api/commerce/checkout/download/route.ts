import { NextResponse } from "next/server";
import { CAREER_PLANNER_DELIVERY_COOKIE, CareerPlannerDeliveryError, consumeCareerPlannerDelivery, getCookieValue } from "@/lib/commerce/career-planner-delivery";
import { renderCareerPlannerPremiumReport } from "@/lib/commerce/career-planner-report-delivery";
import { parseCareerPlannerPremiumSnapshot } from "@/lib/commerce/career-planner-report-snapshot";
import { RequestBodyTooLargeError, isSameOriginRequest, readJsonBodyWithinLimit } from "@/lib/tracking/server";

const DOWNLOAD_REQUEST_MAX_BODY_SIZE = 128 * 1024;
const DOWNLOAD_ERROR = { error: "No hemos podido preparar el informe. Inténtalo de nuevo." };

function readSnapshot(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length !== 1) return null;
  return (value as { snapshot?: unknown }).snapshot ?? null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json(DOWNLOAD_ERROR, { status: 403 });

  let snapshot: ReturnType<typeof parseCareerPlannerPremiumSnapshot>;
  try {
    snapshot = parseCareerPlannerPremiumSnapshot(readSnapshot(await readJsonBodyWithinLimit(request, DOWNLOAD_REQUEST_MAX_BODY_SIZE)));
  } catch (error) {
    return NextResponse.json(DOWNLOAD_ERROR, { status: error instanceof RequestBodyTooLargeError ? 413 : 400 });
  }
  if (!snapshot) return NextResponse.json(DOWNLOAD_ERROR, { status: 400 });

  const token = getCookieValue(request.headers.get("cookie"), CAREER_PLANNER_DELIVERY_COOKIE);
  try {
    await consumeCareerPlannerDelivery(token);
  } catch (error) {
    const status = error instanceof CareerPlannerDeliveryError && error.kind === "not_confirmed" ? 409 : 403;
    return NextResponse.json(DOWNLOAD_ERROR, { status });
  }

  try {
    const pdf = await renderCareerPlannerPremiumReport(snapshot);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="flypath-career-report.pdf"',
        "cache-control": "private, no-store",
      },
    });
  } catch {
    // The delivery token is deliberately limited rather than single-use, so a
    // failed PDF render can be retried without reopening Checkout.
    return NextResponse.json(DOWNLOAD_ERROR, { status: 503 });
  }
}

export const runtime = "nodejs";
