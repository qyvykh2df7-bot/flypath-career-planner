import { NextResponse } from "next/server";
import {
  getPrePplCookieValue,
  getPrePplGuideDeliveryStatus,
  PRE_PPL_GUIDE_DELIVERY_COOKIE,
  PrePplGuideDeliveryError,
} from "@/lib/commerce/pre-ppl-guide-delivery";

export async function GET(request: Request) {
  const token = getPrePplCookieValue(request.headers.get("cookie"), PRE_PPL_GUIDE_DELIVERY_COOKIE);
  try {
    return NextResponse.json({ status: await getPrePplGuideDeliveryStatus(token) });
  } catch (error) {
    if (error instanceof PrePplGuideDeliveryError && error.kind === "invalid") {
      return NextResponse.json({ status: "expired" });
    }
    return NextResponse.json({ error: "No hemos podido comprobar el pago." }, { status: 503 });
  }
}

export const runtime = "nodejs";
