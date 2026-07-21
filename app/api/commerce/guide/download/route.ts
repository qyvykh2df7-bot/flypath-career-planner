import { NextResponse } from "next/server";
import {
  COMO_SER_PILOTO_GUIDE_DELIVERY_COOKIE,
  ComoSerPilotoGuideDeliveryError,
  consumeComoSerPilotoGuideDelivery,
  getCookieValue,
  readComoSerPilotoGuidePdf,
} from "@/lib/commerce/como-ser-piloto-guide-delivery";
import { isSameOriginRequest } from "@/lib/tracking/server";

const DOWNLOAD_ERROR = { error: "No hemos podido preparar la guía. Inténtalo de nuevo." };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json(DOWNLOAD_ERROR, { status: 403 });
  const token = getCookieValue(request.headers.get("cookie"), COMO_SER_PILOTO_GUIDE_DELIVERY_COOKIE);
  try {
    await consumeComoSerPilotoGuideDelivery(token);
  } catch (error) {
    return NextResponse.json(DOWNLOAD_ERROR, {
      status: error instanceof ComoSerPilotoGuideDeliveryError && error.kind === "not_confirmed" ? 409 : 403,
    });
  }
  try {
    const pdf = await readComoSerPilotoGuidePdf();
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="como-ser-piloto.pdf"',
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(DOWNLOAD_ERROR, { status: 503 });
  }
}

export const runtime = "nodejs";
