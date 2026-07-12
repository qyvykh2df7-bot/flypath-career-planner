import "server-only";

import {
  ANALYTICS_CONSENT_COOKIE_NAME,
  hasSensitiveAnalyticValue,
  isSafeTrackingPath,
  isSafeUtmValue,
  isTrackingUuid,
  TRACKING_EVENT_CATEGORIES,
  TRACKING_EVENT_DEFINITIONS,
  TRACKING_WEB_SOURCE,
  type TrackingContext,
  type TrackingEventCategory,
  type TrackingEventName,
} from "@/lib/tracking/events";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const TRACKING_REQUEST_MAX_BODY_SIZE = 8_192;
export const HOME_NEWSLETTER_REQUEST_MAX_BODY_SIZE = 8_192;
export const CAREER_PLANNER_REPORT_REQUEST_MAX_BODY_SIZE = 8_192;
export const PREPPL_WAITLIST_REQUEST_MAX_BODY_SIZE = 8_192;
export const MENTORSHIP_SUPPORT_REQUEST_MAX_BODY_SIZE = 8_192;

const TRACKING_RATE_LIMIT_WINDOW_MS = 60_000;
const TRACKING_RATE_LIMIT_MAX_REQUESTS = 12;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export class TrackingPayloadError extends Error {
  constructor(message = "Invalid tracking payload") {
    super(message);
    this.name = "TrackingPayloadError";
  }
}

export class TrackingPersistenceError extends Error {
  constructor() {
    super("Tracking event persistence failed");
    this.name = "TrackingPersistenceError";
  }
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large");
    this.name = "RequestBodyTooLargeError";
  }
}

type TrackingEventInput = {
  eventName: TrackingEventName;
  eventCategory: TrackingEventCategory;
  idempotencyKey: string;
  context: TrackingContext;
  metadata: Record<string, string | null>;
};

type TrackingEventInsertResult = "inserted" | "duplicate";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSafeUtm(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();
  return isSafeUtmValue(normalized) ? normalized : undefined;
}

function readSafeReferrer(value: unknown, siteOrigin: string): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || hasSensitiveAnalyticValue(value)) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (url.origin !== siteOrigin) return url.origin;
    if (!isSafeTrackingPath(url.pathname)) return undefined;
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

export function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

export function sanitizeTrackingContext(
  value: unknown,
  siteOrigin: string,
): TrackingContext | null {
  if (!isRecord(value)) return null;

  const anonymousId = value.anonymous_id;
  const sessionId = value.session_id;
  const pagePath = value.page_path;
  const landingPage = value.landing_page;
  if (
    !isTrackingUuid(anonymousId) ||
    !isTrackingUuid(sessionId) ||
    typeof pagePath !== "string" ||
    !isSafeTrackingPath(pagePath) ||
    typeof landingPage !== "string" ||
    !isSafeTrackingPath(landingPage)
  ) {
    return null;
  }

  const referrer = readSafeReferrer(value.referrer, siteOrigin);
  const utmSource = readSafeUtm(value.utm_source);
  const utmMedium = readSafeUtm(value.utm_medium);
  const utmCampaign = readSafeUtm(value.utm_campaign);
  const utmContent = readSafeUtm(value.utm_content);
  const utmTerm = readSafeUtm(value.utm_term);
  if (
    referrer === undefined ||
    utmSource === undefined ||
    utmMedium === undefined ||
    utmCampaign === undefined ||
    utmContent === undefined ||
    utmTerm === undefined
  ) {
    return null;
  }

  return {
    anonymous_id: anonymousId,
    session_id: sessionId,
    page_path: pagePath,
    referrer,
    landing_page: landingPage,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
  };
}

function parseTrackingMetadata(
  value: unknown,
  metadataKey: "form_id" | "popup_id",
): Record<"form_id" | "popup_id", string> {
  if (!isRecord(value) || Object.keys(value).length !== 1) {
    throw new TrackingPayloadError();
  }

  const metadataId = value[metadataKey];
  if (typeof metadataId !== "string" || hasSensitiveAnalyticValue(metadataId)) {
    throw new TrackingPayloadError();
  }

  return { [metadataKey]: metadataId } as Record<"form_id" | "popup_id", string>;
}

export async function readJsonBodyWithinLimit(
  request: Request,
  maxSize: number,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredSize = Number(contentLength);
    if (!Number.isFinite(declaredSize) || declaredSize < 0 || declaredSize > maxSize) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!request.body) throw new TrackingPayloadError();

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalSize = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalSize += value.byteLength;
    if (totalSize > maxSize) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return JSON.parse(body) as unknown;
}

export function hasServerAnalyticsConsent(request: Request): boolean {
  const cookie = request.headers.get("cookie");
  if (!cookie) return false;

  return cookie.split(";").some((part) => {
    const [name, value] = part.trim().split("=", 2);
    return name === ANALYTICS_CONSENT_COOKIE_NAME && value === "granted";
  });
}

export function isSameOriginRequest(request: Request): boolean {
  const expectedOrigin = getRequestOrigin(request);
  const origin = request.headers.get("origin");
  const referrer = request.headers.get("referer");

  try {
    if (origin) return new URL(origin).origin === expectedOrigin;
    if (referrer) return new URL(referrer).origin === expectedOrigin;
  } catch {
    return false;
  }

  return false;
}

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (forwardedFor?.split(",")[0] ?? realIp ?? "unknown").trim().slice(0, 128);
}

export function isTrackingRequestRateLimited(request: Request): boolean {
  const now = Date.now();
  if (rateLimitBuckets.size > 1_000) {
    for (const [key, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
    }
  }

  const key = getRequestIp(request);
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + TRACKING_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > TRACKING_RATE_LIMIT_MAX_REQUESTS;
}

export function parseTrackingEventPayload(
  value: unknown,
  siteOrigin: string,
): TrackingEventInput {
  if (!isRecord(value)) throw new TrackingPayloadError();

  const eventName = value.event_name;
  const eventCategory = value.event_category;
  const context = sanitizeTrackingContext(value, siteOrigin);
  const idempotencyKey = value.idempotency_key;

  if (
    typeof eventName !== "string" ||
    !/^[a-z][a-z0-9_]*$/.test(eventName) ||
    !(eventName in TRACKING_EVENT_DEFINITIONS) ||
    typeof eventCategory !== "string" ||
    !TRACKING_EVENT_CATEGORIES.includes(eventCategory as TrackingEventCategory) ||
    !isTrackingUuid(idempotencyKey) ||
    !context
  ) {
    throw new TrackingPayloadError();
  }

  const typedEventName = eventName as TrackingEventName;
  const typedCategory = eventCategory as TrackingEventCategory;
  const eventDefinition = TRACKING_EVENT_DEFINITIONS[typedEventName];
  if (eventDefinition.category !== typedCategory) {
    throw new TrackingPayloadError();
  }

  const metadata = parseTrackingMetadata(value.metadata, eventDefinition.metadataKey);
  const metadataId = metadata[eventDefinition.metadataKey];
  const allowedMetadataIds: readonly string[] = eventDefinition.metadataIds;
  if (!allowedMetadataIds.includes(metadataId)) {
    throw new TrackingPayloadError();
  }

  return {
    eventName: typedEventName,
    eventCategory: typedCategory,
    idempotencyKey,
    context,
    metadata: {
      ...getTrackingContextMetadata(context),
      [eventDefinition.metadataKey]: metadataId,
    },
  };
}

export function getTrackingContextMetadata(
  context: TrackingContext | null | undefined,
): Record<string, string | null> {
  if (!context) return {};

  return {
    landing_page: context.landing_page,
    utm_source: context.utm_source,
    utm_medium: context.utm_medium,
    utm_campaign: context.utm_campaign,
    utm_content: context.utm_content,
    utm_term: context.utm_term,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function insertTrackingEvent(
  input: TrackingEventInput,
): Promise<TrackingEventInsertResult> {
  const { error } = await getSupabaseAdmin().from("user_events").insert({
    event_name: input.eventName,
    event_category: input.eventCategory,
    source: TRACKING_WEB_SOURCE,
    session_id: input.context.session_id,
    anonymous_id: input.context.anonymous_id,
    page_path: input.context.page_path,
    referrer: input.context.referrer,
    idempotency_key: input.idempotencyKey,
    metadata: input.metadata,
  });

  if (isUniqueViolation(error)) return "duplicate";
  if (error) throw new TrackingPersistenceError();

  return "inserted";
}
