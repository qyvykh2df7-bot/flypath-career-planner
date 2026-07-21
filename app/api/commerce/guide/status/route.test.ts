import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getStatus: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/como-ser-piloto-guide-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/como-ser-piloto-guide-delivery")>();
  return { ...actual, getComoSerPilotoGuideDeliveryStatus: mocks.getStatus };
});

import { GET } from "./route";
import { ComoSerPilotoGuideDeliveryError } from "@/lib/commerce/como-ser-piloto-guide-delivery";

describe("GET /api/commerce/guide/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only a closed guide presentation status", async () => {
    mocks.getStatus.mockResolvedValue("confirmed");
    const response = await GET(new Request("https://flypath.test/api/commerce/guide/status", {
      headers: { cookie: `flypath_como_ser_piloto_guide_delivery=${"A".repeat(43)}` },
    }));
    await expect(response.json()).resolves.toEqual({ status: "confirmed" });
  });

  it("does not expose any purchase reference when the isolated guide cookie is absent", async () => {
    mocks.getStatus.mockRejectedValue(new ComoSerPilotoGuideDeliveryError("invalid"));
    const response = await GET(new Request("https://flypath.test/api/commerce/guide/status"));
    await expect(response.json()).resolves.toEqual({ status: "expired" });
  });
});
