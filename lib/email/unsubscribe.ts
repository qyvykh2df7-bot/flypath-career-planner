import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { getSupabaseAdmin } from "@/lib/supabase/admin";

const UNSUBSCRIBE_TOKEN_BYTES = 32;
const UNSUBSCRIBE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UNSUBSCRIBE_TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

export type UnsubscribeResult = "processed" | "already_unsubscribed" | "invalid";

type EmailAdminClient = ReturnType<typeof getSupabaseAdmin>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSafePublicOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invalid unsubscribe public origin");
  }

  return url.origin;
}

export function isOpaqueUnsubscribeToken(value: unknown): value is string {
  return typeof value === "string" && UNSUBSCRIBE_TOKEN_PATTERN.test(value);
}

export function hashUnsubscribeToken(token: string): string {
  if (!isOpaqueUnsubscribeToken(token)) throw new Error("Invalid unsubscribe token");
  return createHash("sha256").update(token).digest("hex");
}

export function createOpaqueUnsubscribeToken(): string {
  return randomBytes(UNSUBSCRIBE_TOKEN_BYTES).toString("base64url");
}

export async function createUnsubscribeLink(
  admin: EmailAdminClient,
  input: { subscriptionId: string; publicOrigin: string; now?: string },
): Promise<string> {
  const now = input.now ?? new Date().toISOString();
  const token = createOpaqueUnsubscribeToken();
  const tokenHash = hashUnsubscribeToken(token);

  const { error: revokeError } = await admin
    .from("email_unsubscribe_tokens")
    .update({ revoked_at: now })
    .eq("subscription_id", input.subscriptionId)
    .is("consumed_at", null)
    .is("revoked_at", null);
  if (revokeError) throw new Error("Unable to prepare unsubscribe token");

  const { error: insertError } = await admin.from("email_unsubscribe_tokens").insert({
    subscription_id: input.subscriptionId,
    token_hash: tokenHash,
  });
  if (insertError) throw new Error("Unable to prepare unsubscribe token");

  const url = new URL("/email/unsubscribe", getSafePublicOrigin(input.publicOrigin));
  url.searchParams.set("token", token);
  return url.toString();
}

export async function unsubscribeByOpaqueToken(
  admin: EmailAdminClient,
  token: unknown,
): Promise<UnsubscribeResult> {
  if (!isOpaqueUnsubscribeToken(token)) return "invalid";

  const tokenHash = hashUnsubscribeToken(token);
  if (!UNSUBSCRIBE_TOKEN_HASH_PATTERN.test(tokenHash)) return "invalid";

  const { data, error } = await admin
    .rpc("unsubscribe_email_subscription_by_token_hash", { p_token_hash: tokenHash })
    .single();

  if (error || !isRecord(data) || typeof data.result !== "string") {
    throw new Error("Unable to update email preference");
  }

  if (data.result === "processed" || data.result === "already_unsubscribed" || data.result === "invalid") {
    return data.result;
  }

  throw new Error("Unable to update email preference");
}
