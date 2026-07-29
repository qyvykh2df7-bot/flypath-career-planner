import { afterEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => {
  class MockLeadCaptureError extends Error {}

  return {
    LeadCaptureError: MockLeadCaptureError,
    insertUserEvent: vi.fn(),
    upsertLeadByEmail: vi.fn(),
    upsertLeadProductInterest: vi.fn(),
    queuePrepplWaitlistConfirmation: vi.fn(),
  };
});
const admin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/leads/capture-shared", () => dependencies);
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/email/send-transactional-email", () => ({
  queuePrepplWaitlistConfirmation: dependencies.queuePrepplWaitlistConfirmation,
}));

import { capturePrepplWaitlistJoin } from "./capture-preppl-waitlist";

const IDEMPOTENCY_KEY = "4d3c2b1a-1234-4abc-8def-1234567890ab";

function prepareCapture() {
  admin.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "product-id" }, error: null }),
      }),
    }),
  });
  dependencies.upsertLeadByEmail.mockResolvedValue("lead-id");
  dependencies.upsertLeadProductInterest.mockResolvedValue(undefined);
  dependencies.insertUserEvent.mockResolvedValue("inserted");
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("Pre-PPL operational email integration", () => {
  it("queues one server-side confirmation after the valid waitlist capture", async () => {
    prepareCapture();
    dependencies.queuePrepplWaitlistConfirmation.mockResolvedValue("sent");

    await expect(capturePrepplWaitlistJoin("pilot@example.com", IDEMPOTENCY_KEY)).resolves.toBeUndefined();

    expect(dependencies.queuePrepplWaitlistConfirmation).toHaveBeenCalledWith(admin, {
      leadId: "lead-id",
      idempotencyKey: IDEMPOTENCY_KEY,
    });
  });

  it("keeps a valid waitlist capture successful when email processing fails", async () => {
    prepareCapture();
    dependencies.queuePrepplWaitlistConfirmation.mockRejectedValue(new Error("provider failure"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(capturePrepplWaitlistJoin("pilot@example.com", IDEMPOTENCY_KEY)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Pre-PPL confirmation email processing failed.",
    );
  });

  it("does not create marketing consent from a waitlist request", async () => {
      prepareCapture();

      await capturePrepplWaitlistJoin("pilot@example.com", IDEMPOTENCY_KEY);

      expect(dependencies.queuePrepplWaitlistConfirmation).toHaveBeenCalledWith(admin, {
        leadId: "lead-id",
        idempotencyKey: IDEMPOTENCY_KEY,
      });
  });
});
