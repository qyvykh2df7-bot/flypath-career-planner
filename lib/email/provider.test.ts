import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createResendEmailProvider, EmailProviderError } from "./provider";

describe("Resend provider", () => {
  it("sends only the server-provided message contract and returns the provider id", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "resend-message-id" }, error: null });
    const provider = createResendEmailProvider({ emails: { send } } as never);

    await expect(
      provider.send({
        to: "pilot@example.com",
        from: "FlyPath <operaciones@flypath.es>",
        replyTo: "info@flypath.es",
        subject: "Asunto fijo",
        html: "<p>Contenido fijo</p>",
        text: "Contenido fijo",
      }),
    ).resolves.toEqual({ providerMessageId: "resend-message-id" });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["pilot@example.com"],
        replyTo: "info@flypath.es",
        subject: "Asunto fijo",
      }),
    );
  });

  it("normalizes provider failures without returning their raw response", async () => {
    const provider = createResendEmailProvider({
      emails: { send: vi.fn().mockResolvedValue({ data: null, error: { message: "secret" } }) },
    } as never);

    await expect(
      provider.send({ to: "pilot@example.com", from: "sender@flypath.es", replyTo: "info@flypath.es", subject: "x", html: "x", text: "x" }),
    ).rejects.toBeInstanceOf(EmailProviderError);
  });
});
