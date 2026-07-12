import {
  createTrackingCtaMetadata,
  isTrackingCtaMetadata,
  TRACKING_EVENT_DEFINITIONS,
  type TrackingCtaMetadata,
  type TrackingEventMetadata,
  type TrackingFormId,
  type TrackingPageId,
  type SessionTrackingEventName,
} from "@/lib/tracking/events";
import {
  createTrackingUuid,
  getTrackingContext,
  getTrackingEventId,
  hasAnalyticsConsent,
} from "@/lib/tracking/session";

const EVENT_STORAGE_PREFIX = "flypath_tracking_event";
const sentEvents = new Set<string>();
const pendingEvents = new Set<string>();

function getMetadataIdentifier(
  metadata: TrackingEventMetadata,
  metadataKey: "form_id" | "popup_id" | "page_id",
): string | null {
  if (metadataKey === "form_id" && "form_id" in metadata) return metadata.form_id;
  if (metadataKey === "popup_id" && "popup_id" in metadata) return metadata.popup_id;
  if (metadataKey === "page_id" && "page_id" in metadata) return metadata.page_id;
  return null;
}

function wasEventTrackedThisSession(key: string): boolean {
  if (sentEvents.has(key)) return true;

  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markEventTrackedThisSession(key: string): void {
  sentEvents.add(key);

  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // El Set en memoria mantiene la deduplicación durante esta navegación.
  }
}

/**
 * Envía eventos no esenciales solo tras consentimiento analítico explícito.
 * La petición es deliberadamente best-effort y nunca bloquea la interacción.
 */
export function trackEventOncePerSession(
  eventName: SessionTrackingEventName,
  metadata: TrackingEventMetadata,
): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const eventDefinition = TRACKING_EVENT_DEFINITIONS[eventName];
  const metadataIdentifier = getMetadataIdentifier(metadata, eventDefinition.metadataKey);
  const allowedMetadataIds: readonly string[] = eventDefinition.metadataIds;
  if (!metadataIdentifier || !allowedMetadataIds.includes(metadataIdentifier)) return;

  const context = getTrackingContext();
  if (!context) return;

  const storageKey = `${EVENT_STORAGE_PREFIX}:${context.session_id}:${eventName}:${metadataIdentifier}`;
  if (wasEventTrackedThisSession(storageKey) || pendingEvents.has(storageKey)) return;

  const idempotencyKey = getTrackingEventId(eventName, metadataIdentifier);
  if (!idempotencyKey) return;

  pendingEvents.add(storageKey);

  try {
    void fetch("/api/tracking/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        event_category: eventDefinition.category,
        idempotency_key: idempotencyKey,
        ...context,
        metadata,
      }),
      keepalive: true,
    })
      .then((response) => {
        if (response.ok) markEventTrackedThisSession(storageKey);
      })
      .catch(() => undefined)
      .finally(() => {
        pendingEvents.delete(storageKey);
      });
  } catch {
    pendingEvents.delete(storageKey);
  }
}

export function trackPageViewed(pageId: TrackingPageId): void {
  trackEventOncePerSession("page_viewed", { page_id: pageId });
}

/**
 * Completa la analítica solo después de que la captación haya respondido bien.
 * Usa una clave propia para no compartir la idempotencia de la conversión de servidor.
 */
export function trackFormCompleted(formId: TrackingFormId): void {
  try {
    if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

    const eventDefinition = TRACKING_EVENT_DEFINITIONS.form_completed;
    const allowedFormIds: readonly string[] = eventDefinition.metadataIds;
    if (!allowedFormIds.includes(formId)) return;

    const context = getTrackingContext();
    if (!context) return;

    void fetch("/api/tracking/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "form_completed",
        event_category: eventDefinition.category,
        idempotency_key: createTrackingUuid(),
        ...context,
        metadata: { form_id: formId },
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // La analítica no puede alterar una conversión ya confirmada.
  }
}

/**
 * Registra un clic de CTA explícito. Cada clic real usa una clave nueva y no
 * comparte la deduplicación por sesión reservada para formularios y popups.
 */
export function trackCtaClicked(metadata: TrackingCtaMetadata): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent() || !isTrackingCtaMetadata(metadata)) {
    return;
  }

  const context = getTrackingContext();
  if (!context) return;

  void fetch("/api/tracking/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_name: "cta_clicked",
      event_category: TRACKING_EVENT_DEFINITIONS.cta_clicked.category,
      idempotency_key: createTrackingUuid(),
      ...context,
      metadata,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export { createTrackingCtaMetadata };
