import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ queue: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/send-transactional-email", () => ({
  queuePrePplPurchaseConfirmation: mocks.queue,
}));

import {
  PrePplPurchaseEmailError,
  recordAndQueuePrePplPurchaseEmail,
} from "./pre-ppl-guide-purchase-email";

const input = {
  stripeMode: "live" as const,
  stripeSessionId: "cs_live_abcdefgh",
  checkoutAttemptId: "4b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  orderId: "7b1d8768-7a01-4e6f-b2dd-0d399857f8dd",
  purchaserEmail: "buyer@example.com",
};

describe("Pre-PPL purchase email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queue.mockResolvedValue("sent");
  });

  it("records the settled purchase recipient before queuing one idempotent transactional email", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "recorded", error: null });
    const admin = { rpc };
    await expect(recordAndQueuePrePplPurchaseEmail(admin as never, input)).resolves.toBe("sent");
    expect(rpc).toHaveBeenCalledWith("record_preppl_guide_purchase_recipient", expect.objectContaining({
      p_order_id: input.orderId,
      p_purchaser_email: input.purchaserEmail,
    }));
    expect(mocks.queue).toHaveBeenCalledWith(admin, {
      orderId: input.orderId,
      idempotencyKey: input.orderId,
    });
  });

  it("reuses the same job on a replayed settled purchase", async () => {
    const admin = { rpc: vi.fn().mockResolvedValue({ data: "existing", error: null }) };
    await recordAndQueuePrePplPurchaseEmail(admin as never, input);
    await recordAndQueuePrePplPurchaseEmail(admin as never, input);
    expect(mocks.queue).toHaveBeenNthCalledWith(1, admin, { orderId: input.orderId, idempotencyKey: input.orderId });
    expect(mocks.queue).toHaveBeenNthCalledWith(2, admin, { orderId: input.orderId, idempotencyKey: input.orderId });
  });

  it("does not queue email when the order was not proven as a settled Pre-PPL purchase", async () => {
    const admin = { rpc: vi.fn().mockResolvedValue({ data: "invalid", error: null }) };
    await expect(recordAndQueuePrePplPurchaseEmail(admin as never, input)).rejects.toBeInstanceOf(PrePplPurchaseEmailError);
    expect(mocks.queue).not.toHaveBeenCalled();
  });
});
