import { NextResponse } from "next/server";
import { CAREER_PLANNER_DELIVERY_COOKIE, CareerPlannerDeliveryError, getCareerPlannerDeliveryStatus, getCookieValue } from "@/lib/commerce/career-planner-delivery";

export async function GET(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), CAREER_PLANNER_DELIVERY_COOKIE);
  try {
    const status = await getCareerPlannerDeliveryStatus(token);
    return NextResponse.json({ status });
  } catch (error) {
    if (error instanceof CareerPlannerDeliveryError && error.kind === "invalid") {
      return NextResponse.json({ status: "expired" });
    }
    return NextResponse.json({ error: "No hemos podido comprobar el pago." }, { status: 503 });
  }
}

export const runtime = "nodejs";
