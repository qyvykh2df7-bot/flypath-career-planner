import {
  ANALYTICS_CONSENT_COOKIE_NAME,
  hasSensitiveAnalyticValue,
  isSafeTrackingPath,
  isSafeUtmValue,
  isTrackingUuid,
  type TrackingContext,
} from "@/lib/tracking/events";

const ANONYMOUS_ID_STORAGE_KEY = "flypath_tracking_anonymous_id";
const SESSION_CONTEXT_STORAGE_KEY = "flypath_tracking_session_context";
const ANALYTICS_CONSENT_STORAGE_KEY = "flypath_analytics_consent";
let inMemoryAnonymousId: string | null = null;
let inMemorySessionContext: StoredSessionContext | null = null;
const inMemoryEventIds = new Map<string, string>();

type StoredSessionContext = Pick<
  TrackingContext,
  | "session_id"
  | "landing_page"
  | "referrer"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_content"
  | "utm_term"
>;

export function createTrackingUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getBrowserStorage(kind: "localStorage" | "sessionStorage"): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window[kind];
  } catch {
    return null;
  }
}

function getStoredValue(storage: Storage | null, key: string): string | null {
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(storage: Storage | null, key: string, value: string): void {
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // El tracking es opcional y no debe afectar a la navegación privada ni a la UI.
  }
}

function sanitizePath(value: string): string | null {
  return isSafeTrackingPath(value) ? value : null;
}

function sanitizeReferrer(value: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.origin !== window.location.origin) return url.origin;

    const path = sanitizePath(url.pathname);
    return path ? `${url.origin}${path}` : null;
  } catch {
    return null;
  }
}

function sanitizeUtm(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return isSafeUtmValue(normalized) ? normalized : null;
}

function isStoredSessionContext(value: unknown): value is StoredSessionContext {
  if (typeof value !== "object" || value === null) return false;

  const context = value as Partial<StoredSessionContext>;
  return (
    isTrackingUuid(context.session_id) &&
    typeof context.landing_page === "string" &&
    isSafeTrackingPath(context.landing_page) &&
    (context.referrer === null ||
      (typeof context.referrer === "string" &&
        !hasSensitiveAnalyticValue(context.referrer) &&
        (() => {
          try {
            const url = new URL(context.referrer);
            return url.protocol === "http:" || url.protocol === "https:";
          } catch {
            return false;
          }
        })())) &&
    [
      context.utm_source,
      context.utm_medium,
      context.utm_campaign,
      context.utm_content,
      context.utm_term,
    ].every((utm) => utm === null || (typeof utm === "string" && isSafeUtmValue(utm)))
  );
}

function readStoredSessionContext(): StoredSessionContext | null {
  if (inMemorySessionContext) return inMemorySessionContext;

  const raw = getStoredValue(getBrowserStorage("sessionStorage"), SESSION_CONTEXT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isStoredSessionContext(value)) return null;

    inMemorySessionContext = value;
    return inMemorySessionContext;
  } catch {
    return null;
  }
}

function createSessionContext(): StoredSessionContext {
  const url = new URL(window.location.href);
  const landingPage = sanitizePath(url.pathname);
  if (!landingPage) {
    throw new Error("Unsafe tracking landing path");
  }

  const context: StoredSessionContext = {
    session_id: createTrackingUuid(),
    landing_page: landingPage,
    referrer: sanitizeReferrer(document.referrer),
    utm_source: sanitizeUtm(url.searchParams.get("utm_source")),
    utm_medium: sanitizeUtm(url.searchParams.get("utm_medium")),
    utm_campaign: sanitizeUtm(url.searchParams.get("utm_campaign")),
    utm_content: sanitizeUtm(url.searchParams.get("utm_content")),
    utm_term: sanitizeUtm(url.searchParams.get("utm_term")),
  };

  setStoredValue(
    getBrowserStorage("sessionStorage"),
    SESSION_CONTEXT_STORAGE_KEY,
    JSON.stringify(context),
  );
  inMemorySessionContext = context;
  return context;
}

function getAnonymousId(): string {
  if (inMemoryAnonymousId) return inMemoryAnonymousId;

  const existing = getStoredValue(getBrowserStorage("localStorage"), ANONYMOUS_ID_STORAGE_KEY);
  if (isTrackingUuid(existing)) {
    inMemoryAnonymousId = existing;
    return inMemoryAnonymousId;
  }

  const anonymousId = createTrackingUuid();
  setStoredValue(getBrowserStorage("localStorage"), ANONYMOUS_ID_STORAGE_KEY, anonymousId);
  inMemoryAnonymousId = anonymousId;
  return inMemoryAnonymousId;
}

/**
 * Identifica una visita sin almacenar datos personales. La landing, UTMs y
 * referrer se fijan al iniciar la sesión para conservar la atribución inicial.
 */
export function getTrackingContext(): TrackingContext | null {
  if (typeof window === "undefined") return null;

  let sessionContext: StoredSessionContext;
  try {
    sessionContext = readStoredSessionContext() ?? createSessionContext();
  } catch {
    return null;
  }

  const currentPath = sanitizePath(window.location.pathname);
  if (!currentPath) return null;

  return {
    anonymous_id: getAnonymousId(),
    page_path: currentPath,
    ...sessionContext,
  };
}

export function initializeTrackingContext(): void {
  void getTrackingContext();
}

export function getTrackingEventId(eventName: string, formId: string): string | null {
  const context = getTrackingContext();
  if (!context) return null;

  const storageKey = `flypath_tracking_event_id:${context.session_id}:${eventName}:${formId}`;
  const inMemoryId = inMemoryEventIds.get(storageKey);
  if (inMemoryId) return inMemoryId;

  const sessionStorage = getBrowserStorage("sessionStorage");
  const existing = getStoredValue(sessionStorage, storageKey);
  if (isTrackingUuid(existing)) {
    inMemoryEventIds.set(storageKey, existing);
    return existing;
  }

  const eventId = createTrackingUuid();
  setStoredValue(sessionStorage, storageKey, eventId);
  inMemoryEventIds.set(storageKey, eventId);
  return eventId;
}

/**
 * Provisional: hasta que exista CMP/banner, la analítica no esencial queda
 * apagada. El futuro gestor de consentimiento solo debe guardar "granted".
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return (
    getStoredValue(getBrowserStorage("localStorage"), ANALYTICS_CONSENT_STORAGE_KEY) ===
    "granted"
  );
}

export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  setStoredValue(
    getBrowserStorage("localStorage"),
    ANALYTICS_CONSENT_STORAGE_KEY,
    granted ? "granted" : "denied",
  );

  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ANALYTICS_CONSENT_COOKIE_NAME}=${granted ? "granted" : "denied"}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  } catch {
    // El consentimiento local sigue siendo útil aunque las cookies estén bloqueadas.
  }
}
