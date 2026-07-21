import { NextResponse } from "next/server";
import {
  COMO_SER_PILOTO_GUIDE_DELIVERY_COOKIE,
  ComoSerPilotoGuideDeliveryError,
  getComoSerPilotoGuideDeliveryStatus,
  getCookieValue,
} from "@/lib/commerce/como-ser-piloto-guide-delivery";

export async function GET(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), COMO_SER_PILOTO_GUIDE_DELIVERY_COOKIE);
  try {
    return NextResponse.json({ status: await getComoSerPilotoGuideDeliveryStatus(token) });
  } catch (error) {
    if (error instanceof ComoSerPilotoGuideDeliveryError && error.kind === "invalid") return NextResponse.json({ status: "expired" });
    return NextResponse.json({ error: "No hemos podido comprobar el pago." }, { status: 503 });
  }
}

export const runtime = "nodejs";
