import { afterEach, describe, expect, it, vi } from "vitest";

import { captureCareerPlannerReportLead } from "./capture-career-planner-report-client";
import { capturePrepplWaitlistLead } from "./capture-preppl-waitlist-client";

const ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const CONTEXT = {
  anonymous_id: ID,
  session_id: "5d3c2b1a-1234-4abc-8def-1234567890ab",
  page_path: "/career-planner",
  landing_page: "/career-planner",
  referrer: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tracked conversion clients", () => {
  it("envía cada conversión exclusivamente a su ruta server-side", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      captureCareerPlannerReportLead("pilot@example.com", true, CONTEXT, ID),
    ).resolves.toEqual({ ok: true });
    await expect(capturePrepplWaitlistLead("pilot@example.com", CONTEXT, ID)).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/leads/career-planner-report",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/leads/preppl-waitlist",
      expect.any(Object),
    );
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/tracking/events")).toBe(false);
  });
});
