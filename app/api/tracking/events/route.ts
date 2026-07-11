import {
  getRequestOrigin,
  hasServerAnalyticsConsent,
  insertTrackingEvent,
  isSameOriginRequest,
  isTrackingRequestRateLimited,
  parseTrackingEventPayload,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
  TRACKING_REQUEST_MAX_BODY_SIZE,
  TrackingPayloadError,
} from "@/lib/tracking/server";

export const runtime = "nodejs";

const INVALID_REQUEST_MESSAGE = "Solicitud de tracking inválida.";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request) || !hasServerAnalyticsConsent(request)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 403 });
  }

  if (isTrackingRequestRateLimited(request)) {
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithinLimit(request, TRACKING_REQUEST_MAX_BODY_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 413 });
    }
    return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
  }

  try {
    const result = await insertTrackingEvent(
      parseTrackingEventPayload(body, getRequestOrigin(request)),
    );
    return Response.json({ ok: true, duplicate: result === "duplicate" }, { status: 202 });
  } catch (error) {
    if (error instanceof TrackingPayloadError) {
      return Response.json({ error: INVALID_REQUEST_MESSAGE }, { status: 400 });
    }

    return Response.json({ error: "Tracking no disponible." }, { status: 503 });
  }
}
