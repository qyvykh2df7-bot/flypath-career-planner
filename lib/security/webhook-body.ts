import "server-only";

export class WebhookBodyError extends Error {
  constructor(public readonly kind: "content_type" | "too_large" | "invalid") {
    super("Webhook body is invalid");
  }
}

export function hasJsonContentType(request: Request): boolean {
  const contentType = request.headers.get("content-type");
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

export async function readWebhookBodyWithinLimit(request: Request, maxBytes: number): Promise<string> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    if (!/^\d+$/.test(declared) || Number(declared) > maxBytes) {
      throw new WebhookBodyError("too_large");
    }
  }
  if (!request.body) throw new WebhookBodyError("invalid");

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new WebhookBodyError("too_large");
    }
    result += decoder.decode(value, { stream: true });
  }
  return `${result}${decoder.decode()}`;
}
