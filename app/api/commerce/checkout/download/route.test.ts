import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ consume: vi.fn(), render: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/career-planner-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/career-planner-delivery")>();
  return { ...actual, consumeCareerPlannerDelivery: mocks.consume };
});
vi.mock("@/lib/commerce/career-planner-report-delivery", () => ({ renderCareerPlannerPremiumReport: mocks.render }));

import { POST } from "./route";
import { CareerPlannerDeliveryError } from "@/lib/commerce/career-planner-delivery";

const snapshot = {
  version: "v1", generatedAt: "2026-07-20", disclaimer: "Aviso", metadata: {},
  profile: { nombre: "" }, routeRecommendation: { recommended: "integrated" }, costs: {}, readiness: {},
  risks: { items: [] }, roadmap: {}, schoolsSummary: { items: [] }, flypathNextStep: {},
};

function request(body: unknown) {
  return new Request("https://flypath.test/api/commerce/checkout/download", {
    method: "POST",
    headers: {
      origin: "https://flypath.test",
      "content-type": "application/json",
      cookie: `flypath_career_planner_delivery=${"A".repeat(43)}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/commerce/checkout/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consume.mockResolvedValue(undefined);
    mocks.render.mockResolvedValue(Buffer.from("pdf"));
  });

  it("blocks rendering when payment confirmation has not consumed a valid token", async () => {
    mocks.consume.mockRejectedValue(new CareerPlannerDeliveryError("not_confirmed"));
    const response = await POST(request({ snapshot }));
    expect(response.status).toBe(409);
    expect(mocks.render).not.toHaveBeenCalled();
  });

  it("returns a private PDF attachment only after confirmed delivery access", async () => {
    const response = await POST(request({ snapshot }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("flypath-career-report.pdf");
    expect(mocks.consume).toHaveBeenCalledWith("A".repeat(43));
  });

  it("rejects a malformed report snapshot before authorizing a download", async () => {
    const response = await POST(request({ snapshot: { version: "v1" } }));
    expect(response.status).toBe(400);
    expect(mocks.consume).not.toHaveBeenCalled();
  });
});
