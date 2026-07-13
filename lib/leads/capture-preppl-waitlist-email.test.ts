import { afterEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => {
  class MockLeadCaptureError extends Error {}

  return {
    LeadCaptureError: MockLeadCaptureError,
    insertUserEvent: vi.fn(),
    upsertEmailSubscriptionForLead: vi.fn(),
    upsertLeadByEmail: vi.fn(),
    upsertLeadProductInterest: vi.fn(),
    queuePrepplWaitlistConfirmation: vi.fn(),
  };
});
const admin = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/leads/capture-shared", () => dependencies);
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: () => admin }));
vi.mock("@/lib/leads/preppl-consent", () => ({ PREPPL_WAITLIST_CONSENT_TEXT: "consent" }));
vi.mock("@/lib/email/send-transactional-email", () => ({
  queuePrepplWaitlistConfirmation: dependencies.queuePrepplWaitlistConfirmation,
}));

import { capturePrepplWaitlistJoin } from "./capture-preppl-waitlist";

const IDEMPOTENCY_KEY = "4d3c2b1a-1234-4abc-8def-1234567890ab";

function prepareCapture(subscriptionStatus: string) {
  admin.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "product-id" }, error: null }),
      }),
    }),
  });
  dependencies.upsertLeadByEmail.mockResolvedValue("lead-id");
  dependencies.upsertLeadProductInterest.mockResolvedValue(undefined);
  dependencies.upsertEmailSubscriptionForLead.mockResolvedValue(subscriptionStatus);
  dependencies.insertUserEvent.mockResolvedValue("inserted");
}

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("Pre-PPL operational email integration", () => {
  it("queues one server-side confirmation after the valid waitlist capture", async () => {
    prepareCapture("subscribed");
    dependencies.queuePrepplWaitlistConfirmation.mockResolvedValue("sent");

    await expect(capturePrepplWaitlistJoin("pilot@example.com", IDEMPOTENCY_KEY)).resolves.toBeUndefined();

    expect(dependencies.queuePrepplWaitlistConfirmation).toHaveBeenCalledWith(admin, {
      leadId: "lead-id",
      idempotencyKey: IDEMPOTENCY_KEY,
    });
    expect(dependencies.upsertEmailSubscriptionForLead).toHaveBeenCalledWith(
      admin,
      "lead-id",
      expect.any(String),
      expect.objectContaining({ listKey: "preppl" }),
    );
  });

  it("keeps a valid waitlist capture successful when email processing fails", async () => {
    prepareCapture("subscribed");
    dependencies.queuePrepplWaitlistConfirmation.mockRejectedValue(new Error("provider failure"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(capturePrepplWaitlistJoin("pilot@example.com", IDEMPOTENCY_KEY)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(
      "[FlyPath] Pre-PPL confirmation email processing failed.",
    );
  });

  it.each(["unsubscribed", "bounced", "complained", "blocked"])(
    "queues the operational confirmation regardless of the marketing subscription state %s",
    async (status) => {
      prepareCapture(status);

      await capturePrepplWaitlistJoin("pilot@example.com", IDEMPOTENCY_KEY);

      expect(dependencies.queuePrepplWaitlistConfirmation).toHaveBeenCalledWith(admin, {
        leadId: "lead-id",
        idempotencyKey: IDEMPOTENCY_KEY,
      });
    },
  );
});
