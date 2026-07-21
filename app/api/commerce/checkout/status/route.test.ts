import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getStatus: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/career-planner-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/career-planner-delivery")>();
  return { ...actual, getCareerPlannerDeliveryStatus: mocks.getStatus };
});

import { GET } from "./route";
import { CareerPlannerDeliveryError } from "@/lib/commerce/career-planner-delivery";

describe("GET /api/commerce/checkout/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only a closed presentation status", async () => {
    mocks.getStatus.mockResolvedValue("confirmed");
    const response = await GET(new Request("https://flypath.test/api/commerce/checkout/status", {
      headers: { cookie: `flypath_career_planner_delivery=${"A".repeat(43)}` },
    }));
    await expect(response.json()).resolves.toEqual({ status: "confirmed" });
  });

  it("does not expose internal references when the cookie is absent", async () => {
    mocks.getStatus.mockRejectedValue(new CareerPlannerDeliveryError("invalid"));
    const response = await GET(new Request("https://flypath.test/api/commerce/checkout/status"));
    await expect(response.json()).resolves.toEqual({ status: "expired" });
  });
});
