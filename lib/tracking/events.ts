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

export const TRACKING_FORM_IDS = [
  "home_newsletter",
  "career_planner_report",
  "preppl_waitlist",
  "mentorship_support",
] as const;

export type TrackingFormId = (typeof TRACKING_FORM_IDS)[number];

export const TRACKING_PAGE_IDS = [
  "home",
  "schools",
  "mentorship",
  "career_planner",
  "aerocomms",
] as const;

export type TrackingPageId = (typeof TRACKING_PAGE_IDS)[number];

const IDENTIFIER_TRACKING_EVENT_DEFINITIONS = {
  form_started: {
    category: "engagement",
    metadataKind: "identifier",
    metadataKey: "form_id",
    metadataIds: TRACKING_FORM_IDS,
  },
  form_completed: {
    category: "engagement",
    metadataKind: "identifier",
    metadataKey: "form_id",
    metadataIds: TRACKING_FORM_IDS,
  },
  popup_opened: {
    category: "engagement",
    metadataKind: "identifier",
    metadataKey: "popup_id",
    metadataIds: ["preppl_waitlist", "mentorship_support"],
  },
  page_viewed: {
    category: "navigation",
    metadataKind: "identifier",
    metadataKey: "page_id",
    metadataIds: TRACKING_PAGE_IDS,
  },
} as const satisfies Record<
  string,
  {
    category: TrackingEventCategory;
    metadataKind: "identifier";
    metadataKey: "form_id" | "popup_id" | "page_id";
    metadataIds: readonly string[];
  }
>;

export const TRACKING_CTA_DEFINITIONS = {
  schools_comparator_select_school: {
    target: "schools_comparator",
    sourceContext: "schools_comparator",
    metadataKeys: ["cta_id", "target", "source_context", "selection_step", "school_count"],
  },
  schools_comparator_open_career_planner: {
    target: "career_planner",
    sourceContext: "schools_comparator",
    metadataKeys: ["cta_id", "target", "source_context", "school_count"],
  },
  schools_comparator_request_mentorship: {
    target: "mentorship",
    sourceContext: "schools_comparator",
    metadataKeys: ["cta_id", "target", "source_context", "school_count"],
  },
  home_schools_open_comparator: {
    target: "schools_comparator",
    sourceContext: "home_schools_trust",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_quick_access_career_planner: {
    target: "career_planner",
    sourceContext: "home_quick_access",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_quick_access_guides: {
    target: "pilot_guide",
    sourceContext: "home_quick_access",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_quick_access_aerocomms: {
    target: "aerocomms",
    sourceContext: "home_quick_access",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_quick_access_mentorship: {
    target: "mentorship",
    sourceContext: "home_quick_access",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_resource_career_planner: {
    target: "career_planner",
    sourceContext: "home_resources",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_resource_pilot_guide: {
    target: "pilot_guide",
    sourceContext: "home_resources",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_resource_preppl_waitlist: {
    target: "preppl_waitlist",
    sourceContext: "home_resources",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_resource_aerocomms: {
    target: "aerocomms",
    sourceContext: "home_resources",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  home_resource_mentorship: {
    target: "mentorship",
    sourceContext: "home_resources",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  aerocomms_hero_try_app: {
    target: "aerocomms_app",
    sourceContext: "aerocomms_hero",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
  aerocomms_hero_how_it_works: {
    target: "aerocomms_training",
    sourceContext: "aerocomms_hero",
    metadataKeys: ["cta_id", "target", "source_context"],
  },
} as const;

export type TrackingCtaId = keyof typeof TRACKING_CTA_DEFINITIONS;

export type TrackingCtaMetadata = {
  cta_id: TrackingCtaId;
  target: string;
  source_context: string;
  selection_step?: 1 | 2;
  school_count?: 0 | 1 | 2;
};

type TrackingCtaDetails = Pick<TrackingCtaMetadata, "selection_step" | "school_count">;

export function createTrackingCtaMetadata(
  ctaId: TrackingCtaId,
  details?: TrackingCtaDetails,
): TrackingCtaMetadata | null {
  const definition = TRACKING_CTA_DEFINITIONS[ctaId];
  const metadataKeys: readonly string[] = definition.metadataKeys;
  const metadata: TrackingCtaMetadata = {
    cta_id: ctaId,
    target: definition.target,
    source_context: definition.sourceContext,
  };

  if (metadataKeys.includes("selection_step")) {
    if (
      !details ||
      (details.selection_step !== 1 && details.selection_step !== 2) ||
      details.school_count !== details.selection_step
    ) {
      return null;
    }
    metadata.selection_step = details.selection_step;
    metadata.school_count = details.school_count;
  } else if (metadataKeys.includes("school_count")) {
    if (!details || ![0, 1, 2].includes(details.school_count ?? -1)) return null;
    metadata.school_count = details.school_count;
  } else if (details && Object.values(details).some((value) => value !== undefined)) {
    return null;
  }

  return metadata;
}

export function isTrackingCtaMetadata(value: unknown): value is TrackingCtaMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const metadata = value as Record<string, unknown>;
  const ctaId = metadata.cta_id;
  if (typeof ctaId !== "string" || !(ctaId in TRACKING_CTA_DEFINITIONS)) return false;

  const definition = TRACKING_CTA_DEFINITIONS[ctaId as TrackingCtaId];
  const metadataKeys: readonly string[] = definition.metadataKeys;
  const keys = Object.keys(metadata).sort();
  const allowedKeys = [...metadataKeys].sort();
  if (keys.length !== allowedKeys.length || keys.some((key, index) => key !== allowedKeys[index])) {
    return false;
  }

  if (
    metadata.target !== definition.target ||
    metadata.source_context !== definition.sourceContext ||
    hasSensitiveAnalyticValue(ctaId)
  ) {
    return false;
  }

  if (metadataKeys.includes("selection_step")) {
    return (
      (metadata.selection_step === 1 || metadata.selection_step === 2) &&
      metadata.school_count === metadata.selection_step
    );
  }

  if (metadataKeys.includes("school_count")) {
    return metadata.school_count === 0 || metadata.school_count === 1 || metadata.school_count === 2;
  }

  return true;
}

export const TRACKING_EVENT_DEFINITIONS = {
  ...IDENTIFIER_TRACKING_EVENT_DEFINITIONS,
  cta_clicked: {
    category: "engagement",
    metadataKind: "cta",
  },
} as const;

export type TrackingEventName = keyof typeof TRACKING_EVENT_DEFINITIONS;
export type SessionTrackingEventName = keyof typeof IDENTIFIER_TRACKING_EVENT_DEFINITIONS;

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
  | { popup_id: string }
  | { page_id: string }
  | TrackingCtaMetadata;
