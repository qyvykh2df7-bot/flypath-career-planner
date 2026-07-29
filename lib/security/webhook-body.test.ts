import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readWebhookBodyWithinLimit, WebhookBodyError } from "./webhook-body";

function streamRequest(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Request("https://flypath.test/webhook", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as unknown as RequestInit);
}

describe("webhook body limits", () => {
  it("enforces the measured body size when Content-Length is absent", async () => {
    await expect(readWebhookBodyWithinLimit(streamRequest(["123", "456"]), 5))
      .rejects.toMatchObject({ kind: "too_large" } satisfies Partial<WebhookBodyError>);
  });

  it("keeps an in-limit raw body unchanged for signature verification", async () => {
    await expect(readWebhookBodyWithinLimit(streamRequest(["{\"id\":", "\"evt\"}"]), 32))
      .resolves.toBe('{"id":"evt"}');
  });
});
