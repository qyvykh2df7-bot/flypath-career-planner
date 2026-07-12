import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createPendingEmailDelivery, markEmailDeliveryAccepted, markEmailDeliveryFailed } from "./deliveries";

function createAdmin() {
  const single = vi.fn().mockResolvedValue({ data: { id: "delivery-id" }, error: null });
  const insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }));
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  return { from: vi.fn(() => ({ insert, update })), insert, update, eq };
}

describe("email deliveries", () => {
  it("records the minimal pending and accepted delivery fields", async () => {
    const admin = createAdmin();
    const id = await createPendingEmailDelivery(admin as never, {
      jobId: "job-id",
      attemptNumber: 1,
      recipientEmail: "pilot@example.com",
      subject: "Asunto",
      fromEmail: "sender@flypath.es",
      attemptedAt: "2026-07-12T10:00:00.000Z",
    });

    expect(id).toBe("delivery-id");
    expect(admin.insert).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "resend", status: "pending", recipient_email: "pilot@example.com" }),
    );

    await markEmailDeliveryAccepted(admin as never, id, "provider-id", "2026-07-12T10:01:00.000Z");
    expect(admin.update).toHaveBeenCalledWith({
      status: "accepted",
      provider_message_id: "provider-id",
      provider_response: { message_id: "provider-id" },
      accepted_at: "2026-07-12T10:01:00.000Z",
    });
  });

  it("records failed delivery without raw provider errors or bodies", async () => {
    const admin = createAdmin();
    await markEmailDeliveryFailed(admin as never, "delivery-id", "2026-07-12T10:01:00.000Z");
    expect(admin.update).toHaveBeenCalledWith({
      status: "failed",
      error_code: "provider_send_failed",
      error_message: "El proveedor de email no aceptó el envío.",
      provider_response: null,
      failed_at: "2026-07-12T10:01:00.000Z",
    });
  });
});
