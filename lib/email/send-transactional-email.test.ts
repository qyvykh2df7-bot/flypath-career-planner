import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEmailConfiguration: vi.fn(),
  createPendingEmailDelivery: vi.fn(),
  markEmailDeliveryAccepted: vi.fn(),
  markEmailDeliveryFailed: vi.fn(),
  preserveEmailDeliveryProviderAcceptance: vi.fn(),
  cancelTransactionalEmailJob: vi.fn(),
  claimTransactionalEmailJob: vi.fn(),
  createTransactionalEmailJob: vi.fn(),
  markTransactionalEmailJobSent: vi.fn(),
  releaseTransactionalEmailJobAfterFailure: vi.fn(),
  getResendEmailProvider: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/config", () => ({ getEmailConfiguration: mocks.getEmailConfiguration }));
vi.mock("@/lib/email/deliveries", () => ({
  createPendingEmailDelivery: mocks.createPendingEmailDelivery,
  markEmailDeliveryAccepted: mocks.markEmailDeliveryAccepted,
  markEmailDeliveryFailed: mocks.markEmailDeliveryFailed,
  preserveEmailDeliveryProviderAcceptance: mocks.preserveEmailDeliveryProviderAcceptance,
}));
vi.mock("@/lib/email/jobs", () => ({
  cancelTransactionalEmailJob: mocks.cancelTransactionalEmailJob,
  claimTransactionalEmailJob: mocks.claimTransactionalEmailJob,
  createTransactionalEmailJob: mocks.createTransactionalEmailJob,
  markTransactionalEmailJobSent: mocks.markTransactionalEmailJobSent,
  releaseTransactionalEmailJobAfterFailure: mocks.releaseTransactionalEmailJobAfterFailure,
}));
vi.mock("@/lib/email/provider", () => ({ getResendEmailProvider: mocks.getResendEmailProvider }));
vi.mock("@/lib/email/templates", () => ({
  getTransactionalEmailTemplate: vi.fn((templateKey: string) => ({
    key: templateKey,
    subject:
      templateKey === "preppl_waitlist_confirmation"
        ? "Tu plaza en la lista Pre-PPL está confirmada"
        : "Tu Career Planner de FlyPath está listo",
    html: "<p>Fijo</p>",
    text: "Fijo",
    subscriptionListKey: templateKey === "preppl_waitlist_confirmation" ? "preppl" : "career_planner",
  })),
}));

import {
  queueCareerPlannerConfirmation,
  queuePrepplWaitlistConfirmation,
  sendTransactionalEmail,
} from "./send-transactional-email";

const JOB = {
  id: "job-id",
  leadId: "lead-id",
  templateKey: "career_planner_confirmation" as const,
  status: "pending" as const,
  attemptCount: 0,
  maxAttempts: 3,
};

function createAdmin(subscriptionStatus: string | null) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: table === "leads" ? { email: "pilot@example.com" } : subscriptionStatus ? { status: subscriptionStatus } : null,
              error: null,
            }),
          })),
          maybeSingle: vi.fn().mockResolvedValue({ data: { email: "pilot@example.com" }, error: null }),
        })),
      })),
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getEmailConfiguration.mockReturnValue({
    apiKey: "secret",
    from: "FlyPath <operaciones@flypath.es>",
    replyTo: "info@flypath.es",
  });
  mocks.createPendingEmailDelivery.mockResolvedValue("delivery-id");
  mocks.claimTransactionalEmailJob.mockResolvedValue({ ...JOB, status: "processing", attemptCount: 1 });
  mocks.markEmailDeliveryAccepted.mockResolvedValue(undefined);
  mocks.preserveEmailDeliveryProviderAcceptance.mockResolvedValue(undefined);
  mocks.markTransactionalEmailJobSent.mockResolvedValue(undefined);
  mocks.markEmailDeliveryFailed.mockResolvedValue(undefined);
  mocks.releaseTransactionalEmailJobAfterFailure.mockResolvedValue(undefined);
});

describe("transactional email dispatch", () => {
  it("sends a subscribed Career Planner confirmation and records accepted delivery", async () => {
    const provider = { send: vi.fn().mockResolvedValue({ providerMessageId: "resend-id" }) };

    await expect(
      sendTransactionalEmail(createAdmin("subscribed") as never, JOB, {
        provider,
        now: () => "2026-07-12T10:00:00.000Z",
      }),
    ).resolves.toBe("sent");

    expect(provider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "pilot@example.com",
        subject: "Tu Career Planner de FlyPath está listo",
        html: "<p>Fijo</p>",
      }),
    );
    expect(mocks.markEmailDeliveryAccepted).toHaveBeenCalledWith(
      expect.anything(),
      "delivery-id",
      "resend-id",
      "2026-07-12T10:00:00.000Z",
    );
    expect(mocks.markTransactionalEmailJobSent).toHaveBeenCalledOnce();
  });

  it.each(["unsubscribed", "bounced", "complained", "blocked"])(
    "does not send when the subscription is %s",
    async (status) => {
      await expect(sendTransactionalEmail(createAdmin(status) as never, JOB)).resolves.toBe("cancelled");
      expect(mocks.cancelTransactionalEmailJob).toHaveBeenCalledWith(expect.anything(), "job-id", expect.any(String));
      expect(mocks.claimTransactionalEmailJob).not.toHaveBeenCalled();
    },
  );

  it("keeps the job pending and records a failed delivery when the provider fails", async () => {
    const provider = { send: vi.fn().mockRejectedValue(new Error("provider failure")) };

    await expect(sendTransactionalEmail(createAdmin("subscribed") as never, JOB, { provider })).resolves.toBe("pending");
    expect(mocks.markEmailDeliveryFailed).toHaveBeenCalledOnce();
    expect(mocks.releaseTransactionalEmailJobAfterFailure).toHaveBeenCalledOnce();
    expect(mocks.markTransactionalEmailJobSent).not.toHaveBeenCalled();
  });

  it("keeps a recoverable job when Resend accepted but accepted delivery persistence fails", async () => {
    const provider = { send: vi.fn().mockResolvedValue({ providerMessageId: "resend-id" }) };
    mocks.markEmailDeliveryAccepted.mockRejectedValue(new Error("database failure"));

    await expect(sendTransactionalEmail(createAdmin("subscribed") as never, JOB, { provider })).resolves.toBe(
      "pending",
    );

    expect(provider.send).toHaveBeenCalledOnce();
    expect(mocks.preserveEmailDeliveryProviderAcceptance).toHaveBeenCalledWith(
      expect.anything(),
      "delivery-id",
      "resend-id",
    );
    expect(mocks.releaseTransactionalEmailJobAfterFailure).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "job-id", status: "processing" }),
      expect.any(String),
      "email_delivery_acceptance_persistence_failed",
    );
    expect(mocks.markTransactionalEmailJobSent).not.toHaveBeenCalled();
  });

  it("does not claim a job when server email configuration is unavailable", async () => {
    mocks.getEmailConfiguration.mockImplementation(() => {
      throw new Error("missing configuration");
    });

    await expect(sendTransactionalEmail(createAdmin("subscribed") as never, JOB)).rejects.toThrow(
      "missing configuration",
    );
    expect(mocks.claimTransactionalEmailJob).not.toHaveBeenCalled();
  });

  it("uses the conversion idempotency key only to create one career planner job", async () => {
    mocks.createTransactionalEmailJob.mockResolvedValue({ job: { ...JOB, status: "sent" }, created: false });
    mocks.claimTransactionalEmailJob.mockResolvedValue(null);
    const admin = createAdmin("subscribed");

    await expect(
      queueCareerPlannerConfirmation(admin as never, {
        leadId: "lead-id",
        idempotencyKey: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      }),
    ).resolves.toBe("not_claimed");

    expect(mocks.createTransactionalEmailJob).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({ idempotencyKey: "4d3c2b1a-1234-4abc-8def-1234567890ab" }),
    );
  });

  it("uses the same idempotent job infrastructure for the Pre-PPL waitlist template", async () => {
    mocks.createTransactionalEmailJob.mockResolvedValue({ job: { ...JOB, status: "sent" }, created: false });
    const admin = createAdmin("subscribed");

    await expect(
      queuePrepplWaitlistConfirmation(admin as never, {
        leadId: "lead-id",
        idempotencyKey: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      }),
    ).resolves.toBe("not_claimed");

    expect(mocks.createTransactionalEmailJob).toHaveBeenCalledWith(
      admin,
      expect.objectContaining({
        templateKey: "preppl_waitlist_confirmation",
        idempotencyKey: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      }),
    );
  });
});
