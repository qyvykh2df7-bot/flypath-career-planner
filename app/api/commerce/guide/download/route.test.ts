import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ consume: vi.fn(), readPdf: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/como-ser-piloto-guide-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/como-ser-piloto-guide-delivery")>();
  return {
    ...actual,
    consumeComoSerPilotoGuideDelivery: mocks.consume,
    readComoSerPilotoGuidePdf: mocks.readPdf,
  };
});

import { POST } from "./route";
import { ComoSerPilotoGuideDeliveryError } from "@/lib/commerce/como-ser-piloto-guide-delivery";

function request(cookie = `flypath_como_ser_piloto_guide_delivery=${"A".repeat(43)}`) {
  return new Request("https://flypath.test/api/commerce/guide/download", {
    method: "POST",
    headers: { origin: "https://flypath.test", cookie },
  });
}

describe("POST /api/commerce/guide/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consume.mockResolvedValue(undefined);
    mocks.readPdf.mockResolvedValue(Buffer.from("%PDF-guide"));
  });

  it("returns only the guide PDF after its own confirmed delivery token is consumed", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("como-ser-piloto.pdf");
    expect(mocks.consume).toHaveBeenCalledWith("A".repeat(43));
  });

  it("does not read the private guide asset when confirmation is missing", async () => {
    mocks.consume.mockRejectedValue(new ComoSerPilotoGuideDeliveryError("not_confirmed"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.readPdf).not.toHaveBeenCalled();
  });
});
