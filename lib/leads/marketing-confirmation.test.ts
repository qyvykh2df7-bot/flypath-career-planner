import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const dependencies = vi.hoisted(() => ({ queue: vi.fn() }));
vi.mock("@/lib/email/send-transactional-email", () => ({ queueMarketingOptInConfirmation: dependencies.queue }));

import { confirmMarketingSubscription, requestMarketingConfirmation } from "./marketing-confirmation";

function adminWithRpc(rpc: ReturnType<typeof vi.fn>) {
  return { rpc } as never;
}

describe("marketing confirmation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores only a token hash and queues one confirmation email", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ confirmation_token_id: "4d3c2b1a-1234-4abc-8def-1234567890ab", created: true }], error: null });
    dependencies.queue.mockResolvedValue("sent");
    await requestMarketingConfirmation(adminWithRpc(rpc), {
      leadId: "lead-id", listKey: "home_newsletter", source: "home_newsletter", consentText: "consent",
      requestId: "5d3c2b1a-1234-4abc-8def-1234567890ab", recipientEmail: "pilot@example.com", publicOrigin: "https://flypath.test",
    });
    expect(rpc).toHaveBeenCalledWith("prepare_email_marketing_confirmation", expect.objectContaining({
      p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(dependencies.queue).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      recipientEmail: "pilot@example.com", confirmationLink: expect.stringContaining("/email/confirmar-suscripcion?token="),
    }));
  });

  it("does not resend an email for the same idempotent request", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ confirmation_token_id: "4d3c2b1a-1234-4abc-8def-1234567890ab", created: false }], error: null });
    await requestMarketingConfirmation(adminWithRpc(rpc), {
      leadId: "lead-id", listKey: "home_newsletter", source: "home_newsletter", consentText: "consent",
      requestId: "5d3c2b1a-1234-4abc-8def-1234567890ab", recipientEmail: "pilot@example.com", publicOrigin: "https://flypath.test",
    });
    expect(dependencies.queue).not.toHaveBeenCalled();
  });

  it("returns generic, idempotent confirmation states", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ result: "already_confirmed" }], error: null });
    await expect(confirmMarketingSubscription(adminWithRpc(rpc), "A".repeat(43))).resolves.toBe("already_confirmed");
    expect(rpc).toHaveBeenCalledWith("confirm_email_marketing_subscription_by_token_hash", expect.objectContaining({
      p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });
});
