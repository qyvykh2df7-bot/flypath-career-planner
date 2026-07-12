import { describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({ from: supabase.from }),
}));

import {
  hasServerAnalyticsConsent,
  insertTrackingEvent,
  isSameOriginRequest,
  parseTrackingEventPayload,
  readJsonBodyWithinLimit,
  RequestBodyTooLargeError,
  TrackingPayloadError,
} from "./server";

const ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const CONTEXT = {
  anonymous_id: ID,
  session_id: "5d3c2b1a-1234-4abc-8def-1234567890ab",
  page_path: "/",
  landing_page: "/",
  referrer: "https://www.google.com/search",
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "home_newsletter",
  utm_content: null,
  utm_term: null,
};

function validPayload() {
  return {
    event_name: "form_started",
    event_category: "engagement",
    idempotency_key: "6d3c2b1a-1234-4abc-8def-1234567890ab",
    ...CONTEXT,
    metadata: { form_id: "home_newsletter" },
  };
}

describe("tracking server validation", () => {
  it("rechaza UUID inválido y PII disfrazada en UTMs", () => {
    expect(() =>
      parseTrackingEventPayload(
        { ...validPayload(), anonymous_id: "not-a-uuid" },
        "https://flypath.test",
      ),
    ).toThrow(TrackingPayloadError);

    expect(() =>
      parseTrackingEventPayload(
        { ...validPayload(), utm_campaign: "pilot@example.com" },
        "https://flypath.test",
      ),
    ).toThrow(TrackingPayloadError);
  });

  it("mantiene solo el origin de un referrer externo", () => {
    const event = parseTrackingEventPayload(validPayload(), "https://flypath.test");
    expect(event.context.referrer).toBe("https://www.google.com");
  });

  it("acepta únicamente los popups permitidos y rechaza PII en metadata", () => {
    expect(
      parseTrackingEventPayload(
        {
          ...validPayload(),
          event_name: "popup_opened",
          metadata: { popup_id: "preppl_waitlist" },
        },
        "https://flypath.test",
      ).metadata,
    ).toMatchObject({ popup_id: "preppl_waitlist" });

    expect(
      parseTrackingEventPayload(
        {
          ...validPayload(),
          event_name: "popup_opened",
          metadata: { popup_id: "mentorship_support" },
        },
        "https://flypath.test",
      ).metadata,
    ).toMatchObject({ popup_id: "mentorship_support" });

    expect(() =>
      parseTrackingEventPayload(
        {
          ...validPayload(),
          metadata: { form_id: "pilot@example.com" },
        },
        "https://flypath.test",
      ),
    ).toThrow(TrackingPayloadError);
  });

  it("requiere cookie de consentimiento y origen propio", () => {
    const request = new Request("https://flypath.test/api/tracking/events", {
      headers: {
        cookie: "flypath_analytics_consent=granted",
        origin: "https://flypath.test",
      },
    });
    expect(hasServerAnalyticsConsent(request)).toBe(true);
    expect(isSameOriginRequest(request)).toBe(true);

    const withoutConsent = new Request("https://flypath.test/api/tracking/events", {
      headers: { origin: "https://flypath.test" },
    });
    expect(hasServerAnalyticsConsent(withoutConsent)).toBe(false);
  });

  it("rechaza un body que supera el límite antes de parsearlo", async () => {
    const request = new Request("https://flypath.test/api/tracking/events", {
      method: "POST",
      body: "x".repeat(128),
      headers: { "content-type": "application/json" },
    });

    await expect(readJsonBodyWithinLimit(request, 64)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });

  it("trata una clave única repetida como evento ya persistido", async () => {
    supabase.from.mockReturnValue({ insert: supabase.insert });
    supabase.insert.mockResolvedValue({ error: { code: "23505" } });

    const result = await insertTrackingEvent(
      parseTrackingEventPayload(validPayload(), "https://flypath.test"),
    );

    expect(result).toBe("duplicate");
  });
});
