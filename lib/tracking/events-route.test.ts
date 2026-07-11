import { describe, expect, it, vi } from "vitest";

const tracking = vi.hoisted(() => {
  class MockTrackingPayloadError extends Error {}
  class MockRequestBodyTooLargeError extends Error {}

  return {
    RequestBodyTooLargeError: MockRequestBodyTooLargeError,
    TrackingPayloadError: MockTrackingPayloadError,
    getRequestOrigin: vi.fn(() => "https://flypath.test"),
    hasServerAnalyticsConsent: vi.fn(),
    insertTrackingEvent: vi.fn(),
    isSameOriginRequest: vi.fn(),
    isTrackingRequestRateLimited: vi.fn(),
    parseTrackingEventPayload: vi.fn(),
    readJsonBodyWithinLimit: vi.fn(),
    TRACKING_REQUEST_MAX_BODY_SIZE: 8_192,
  };
});

vi.mock("@/lib/tracking/server", () => tracking);

import { POST } from "@/app/api/tracking/events/route";

describe("tracking events route", () => {
  it("rechaza eventos no esenciales sin consentimiento de servidor", async () => {
    tracking.isSameOriginRequest.mockReturnValue(true);
    tracking.hasServerAnalyticsConsent.mockReturnValue(false);

    const response = await POST(
      new Request("https://flypath.test/api/tracking/events", { method: "POST" }),
    );

    expect(response.status).toBe(403);
    expect(tracking.readJsonBodyWithinLimit).not.toHaveBeenCalled();
  });

  it("rechaza cuerpo excesivo antes de validar el evento", async () => {
    tracking.isSameOriginRequest.mockReturnValue(true);
    tracking.hasServerAnalyticsConsent.mockReturnValue(true);
    tracking.isTrackingRequestRateLimited.mockReturnValue(false);
    tracking.readJsonBodyWithinLimit.mockRejectedValue(
      new tracking.RequestBodyTooLargeError(),
    );

    const response = await POST(
      new Request("https://flypath.test/api/tracking/events", { method: "POST" }),
    );

    expect(response.status).toBe(413);
    expect(tracking.parseTrackingEventPayload).not.toHaveBeenCalled();
  });
});
