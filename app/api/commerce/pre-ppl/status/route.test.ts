import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getStatus: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/pre-ppl-guide-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/pre-ppl-guide-delivery")>();
  return { ...actual, getPrePplGuideDeliveryStatus: mocks.getStatus };
});

import { GET } from "./route";

describe("GET /api/commerce/pre-ppl/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only a closed delivery status without purchase references", async () => {
    mocks.getStatus.mockResolvedValue("confirmed");
    const response = await GET(new Request("https://flypath.test/api/commerce/pre-ppl/status", {
      headers: { cookie: `flypath_preppl_guide_delivery=${"A".repeat(43)}` },
    }));
    await expect(response.json()).resolves.toEqual({ status: "confirmed" });
  });
});
