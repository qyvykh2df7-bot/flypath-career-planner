import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEmailConfiguration: vi.fn(),
  getInternalAlertEmail: vi.fn(),
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
vi.mock("@/lib/email/config", () => ({
  getEmailConfiguration: mocks.getEmailConfiguration,
  getInternalAlertEmail: mocks.getInternalAlertEmail,
}));
vi.mock("@/lib/email/templates", () => ({
  getTransactionalEmailTemplate: vi.fn((templateKey: string) => ({
    key: templateKey,
    subject:
      templateKey === "preppl_waitlist_confirmation"
        ? "Tu plaza en la lista Pre-PPL está confirmada"
        : templateKey === "mentorship_request_confirmation"
          ? "Hemos recibido tu solicitud de acompañamiento"
        : "Tu Career Planner de FlyPath está listo",
    html: "<p>Fijo</p>",
    text: "Fijo",
    recipient:
      { kind: "lead" },
  })),
}));
vi.mock("@/lib/email/templates/mentorship-internal-alert", () => ({
  getMentorshipInternalAlertTemplate: vi.fn(() => ({
    key: "mentorship_internal_alert",
    subject: "Nueva solicitud de acompañamiento en FlyPath",
    html: "<p>Interno</p>",
    text: "Interno",
    recipient: { kind: "internal" },
  })),
}));

import {
  queueCareerPlannerConfirmation,
  queueMentorshipInternalAlert,
  queueMentorshipRequestConfirmation,
  queuePrepplWaitlistConfirmation,
  queueSchoolReviewVerification,
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
  const technicalSuppression = ["bounced", "complained", "blocked"].includes(subscriptionStatus ?? "")
    ? { status: subscriptionStatus }
    : null;

  return {
    from: vi.fn((table: string) => {
      if (table === "leads") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { email: "pilot@example.com" }, error: null }),
            })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: technicalSuppression, error: null }),
              })),
            })),
          })),
        })),
      };
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getEmailConfiguration.mockReturnValue({
    apiKey: "secret",
    from: "FlyPath <operaciones@flypath.es>",
    replyTo: "info@flypath.es",
  });
  mocks.getInternalAlertEmail.mockReturnValue("operaciones@flypath.es");
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

  it("sends a transactional confirmation when the lead previously unsubscribed", async () => {
    const provider = { send: vi.fn().mockResolvedValue({ providerMessageId: "resend-id" }) };

    await expect(sendTransactionalEmail(createAdmin("unsubscribed") as never, JOB, { provider })).resolves.toBe(
      "sent",
    );
    expect(provider.send).toHaveBeenCalledOnce();
  });

  it.each(["bounced", "complained", "blocked"])(
    "does not send when a technical suppression is %s",
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

  it("creates, claims, and sends a school review verification job with its explicit recipient", async () => {
    const provider = { send: vi.fn().mockResolvedValue({ providerMessageId: "resend-review-id" }) };
    const reviewJob = {
      ...JOB,
      leadId: null,
      schoolReviewId: "a4a3545d-ccee-4f4c-8234-09f75214df22",
      templateKey: "school_review_verification" as const,
    };
    const claimedReviewJob = { ...reviewJob, status: "processing" as const, attemptCount: 1 };
    const admin = createAdmin(null);
    mocks.createTransactionalEmailJob.mockResolvedValue({ job: reviewJob, created: true });
    mocks.claimTransactionalEmailJob.mockResolvedValue(claimedReviewJob);
    mocks.getResendEmailProvider.mockReturnValue(provider);

    await expect(queueSchoolReviewVerification(admin as never, {
      reviewId: reviewJob.schoolReviewId,
      idempotencyKey: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      recipientEmail: "reviewer@example.com",
      verificationLink: "https://flypath.es/opiniones-escuelas/verificar?token=safe-token",
      expiresAt: "2026-07-21T12:00:00.000Z",
    })).resolves.toBe("sent");

    expect(mocks.createTransactionalEmailJob).toHaveBeenCalledWith(admin, {
      schoolReviewId: reviewJob.schoolReviewId,
      templateKey: "school_review_verification",
      idempotencyKey: "4d3c2b1a-1234-4abc-8def-1234567890ab",
    });
    expect(mocks.claimTransactionalEmailJob).toHaveBeenCalledWith(
      admin,
      reviewJob,
      "lead_capture_request",
      expect.any(String),
    );
    expect(provider.send).toHaveBeenCalledWith(expect.objectContaining({
      to: "reviewer@example.com",
      subject: "Verifica tu opinión sobre una escuela en FlyPath",
    }));
    expect(mocks.markEmailDeliveryAccepted).toHaveBeenCalledWith(
      admin,
      "delivery-id",
      "resend-review-id",
      expect.any(String),
    );
    expect(mocks.markTransactionalEmailJobSent).toHaveBeenCalledWith(
      admin,
      reviewJob.id,
      expect.any(String),
    );
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("creates independent mentorship jobs with the same conversion idempotency key", async () => {
    mocks.createTransactionalEmailJob.mockResolvedValue({ job: { ...JOB, status: "sent" }, created: false });
    const admin = createAdmin("unsubscribed");
    const idempotencyKey = "4d3c2b1a-1234-4abc-8def-1234567890ab";

    await queueMentorshipRequestConfirmation(admin as never, { leadId: "lead-id", idempotencyKey });
    await queueMentorshipInternalAlert(admin as never, {
      leadId: "lead-id",
      idempotencyKey,
      templateInput: {
        fullName: "Pilot Example",
        email: "pilot@example.com",
        phone: null,
        situation: "not_started",
        helpText: "Necesito ayuda.",
        receivedAt: "2026-07-12T12:00:00.000Z",
      },
    });

    expect(mocks.createTransactionalEmailJob).toHaveBeenNthCalledWith(
      1,
      admin,
      expect.objectContaining({ templateKey: "mentorship_request_confirmation", idempotencyKey }),
    );
    expect(mocks.createTransactionalEmailJob).toHaveBeenNthCalledWith(
      2,
      admin,
      expect.objectContaining({ templateKey: "mentorship_internal_alert", idempotencyKey }),
    );
    expect(mocks.getInternalAlertEmail).toHaveBeenCalledOnce();
  });

  it("sends the mentorship confirmation without querying a marketing subscription", async () => {
    const provider = { send: vi.fn().mockResolvedValue({ providerMessageId: "resend-id" }) };
    const admin = createAdmin("unsubscribed");
    const mentorshipJob = { ...JOB, templateKey: "mentorship_request_confirmation" as const };

    await expect(sendTransactionalEmail(admin as never, mentorshipJob, { provider })).resolves.toBe("sent");
    expect(admin.from).toHaveBeenCalledWith("email_subscriptions");
    expect(provider.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Hemos recibido tu solicitud de acompañamiento" }),
    );
  });
});
