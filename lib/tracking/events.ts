export const TRACKING_EVENT_CATEGORIES = [
  "auth",
  "lead",
  "product",
  "content",
  "email",
  "purchase",
  "navigation",
  "engagement",
  "system",
] as const;

export type TrackingEventCategory = (typeof TRACKING_EVENT_CATEGORIES)[number];

export const ANALYTICS_CONSENT_COOKIE_NAME = "flypath_analytics_consent";
export const TRACKING_WEB_SOURCE = "web";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_PATH_PATTERN = /^\/(?:[A-Za-z0-9_-]+\/?)*$/;
const SAFE_UTM_PATTERN = /^[A-Za-z0-9._~-]+$/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /\+?\d[\d\s().-]{6,}\d/;

export function isTrackingUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function hasSensitiveAnalyticValue(value: string): boolean {
  return EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value);
}

export function isSafeTrackingPath(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 512 &&
    SAFE_PATH_PATTERN.test(value) &&
    !hasSensitiveAnalyticValue(value)
  );
}

export function isSafeUtmValue(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 160 &&
    SAFE_UTM_PATTERN.test(value) &&
    !hasSensitiveAnalyticValue(value)
  );
}

export const TRACKING_EVENT_DEFINITIONS = {
  form_started: {
    category: "engagement",
    metadataKey: "form_id",
    metadataIds: [
      "home_newsletter",
      "career_planner_report",
      "preppl_waitlist",
      "mentorship_support",
    ],
  },
  popup_opened: {
    category: "engagement",
    metadataKey: "popup_id",
    metadataIds: ["preppl_waitlist", "mentorship_support"],
  },
} as const satisfies Record<
  string,
  {
    category: TrackingEventCategory;
    metadataKey: "form_id" | "popup_id";
    metadataIds: readonly string[];
  }
>;

export type TrackingEventName = keyof typeof TRACKING_EVENT_DEFINITIONS;

export type TrackingContext = {
  anonymous_id: string;
  session_id: string;
  page_path: string;
  referrer: string | null;
  landing_page: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export type TrackingEventMetadata =
  | { form_id: string }
  | { popup_id: string };
