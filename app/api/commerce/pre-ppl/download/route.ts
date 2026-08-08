import { NextResponse } from "next/server";
import {
  consumePrePplGuideDelivery,
  getPrePplCookieValue,
  getPrePplGuideDeliveryStatus,
  PRE_PPL_GUIDE_DELIVERY_COOKIE,
  PrePplGuideDeliveryError,
  readPrePplGuidePdf,
} from "@/lib/commerce/pre-ppl-guide-delivery";
import { isSameOriginRequest } from "@/lib/tracking/server";

const DOWNLOAD_ERROR = { error: "No hemos podido preparar la guía. Inténtalo de nuevo." };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json(DOWNLOAD_ERROR, { status: 403 });
  const token = getPrePplCookieValue(request.headers.get("cookie"), PRE_PPL_GUIDE_DELIVERY_COOKIE);
  try {
    const status = await getPrePplGuideDeliveryStatus(token);
    if (status !== "confirmed") throw new PrePplGuideDeliveryError("not_confirmed");
  } catch (error) {
    return NextResponse.json(DOWNLOAD_ERROR, {
      status: error instanceof PrePplGuideDeliveryError && error.kind === "not_confirmed" ? 409 : 403,
    });
  }
  try {
    const pdf = await readPrePplGuidePdf();
    // The database RPC locks the token row and rechecks all state before it
    // increments the counter, so this final step remains race-safe.
    await consumePrePplGuideDelivery(token);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="pre-ppl.pdf"',
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof PrePplGuideDeliveryError && error.kind === "not_confirmed") {
      return NextResponse.json(DOWNLOAD_ERROR, { status: 409 });
    }
    return NextResponse.json(DOWNLOAD_ERROR, { status: 503 });
  }
}

export const runtime = "nodejs";
