import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ consume: vi.fn(), getStatus: vi.fn(), readPdf: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/commerce/pre-ppl-guide-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/commerce/pre-ppl-guide-delivery")>();
  return {
    ...actual,
    consumePrePplGuideDelivery: mocks.consume,
    getPrePplGuideDeliveryStatus: mocks.getStatus,
    readPrePplGuidePdf: mocks.readPdf,
  };
});

import { POST } from "./route";
import { PrePplGuideDeliveryError } from "@/lib/commerce/pre-ppl-guide-delivery";

function request(cookie = `flypath_preppl_guide_delivery=${"A".repeat(43)}`) {
  return new Request("https://flypath.test/api/commerce/pre-ppl/download", { method: "POST", headers: { origin: "https://flypath.test", cookie } });
}

describe("POST /api/commerce/pre-ppl/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getStatus.mockResolvedValue("confirmed");
    mocks.consume.mockResolvedValue(undefined);
    mocks.readPdf.mockResolvedValue(Buffer.from("%PDF-pre-ppl"));
  });

  it("validates its own confirmed token, reads the private asset, and then consumes one download", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("pre-ppl.pdf");
    expect(mocks.getStatus).toHaveBeenCalledBefore(mocks.readPdf);
    expect(mocks.readPdf).toHaveBeenCalledBefore(mocks.consume);
  });

  it.each(["verifying", "failed", "expired"])("never reads or consumes the asset when status is %s", async (status) => {
    mocks.getStatus.mockResolvedValue(status);
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.readPdf).not.toHaveBeenCalled();
    expect(mocks.consume).not.toHaveBeenCalled();
  });

  it("does not consume a download when the private asset is unavailable", async () => {
    mocks.readPdf.mockRejectedValue(new PrePplGuideDeliveryError("unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.consume).not.toHaveBeenCalled();
  });

  it("does not consume malformed or missing delivery cookies", async () => {
    mocks.getStatus.mockRejectedValue(new PrePplGuideDeliveryError("invalid"));
    const response = await POST(request("flypath_preppl_guide_delivery=manipulated"));
    expect(response.status).toBe(403);
    expect(mocks.readPdf).not.toHaveBeenCalled();
    expect(mocks.consume).not.toHaveBeenCalled();
  });

  it("preserves the atomic final limit check when a concurrent request exhausts it", async () => {
    mocks.consume.mockRejectedValue(new PrePplGuideDeliveryError("not_confirmed"));
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.readPdf).toHaveBeenCalledOnce();
  });
});
