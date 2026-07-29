import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { queueMarketingOptInConfirmation } from "@/lib/email/send-transactional-email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 48 * 60 * 60 * 1_000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type MarketingListKey = "home_newsletter" | "career_planner";
type MarketingSource = MarketingListKey;
type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type MarketingConfirmationResult =
  | "processed"
  | "already_confirmed"
  | "suppressed"
  | "invalid";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

function getSafePublicOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Invalid public origin");
  return url.origin;
}

function confirmationLink(publicOrigin: string, token: string): string {
  const url = new URL("/email/confirmar-suscripcion", getSafePublicOrigin(publicOrigin));
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Creates an opaque, one-purpose token. The token is never persisted in plain
 * text; repeat submissions with the same form idempotency key do not send mail.
 */
export async function requestMarketingConfirmation(
  admin: AdminClient,
  input: {
    leadId: string;
    listKey: MarketingListKey;
    source: MarketingSource;
    consentText: string;
    requestId: string;
    recipientEmail: string;
    publicOrigin: string;
    now?: () => Date;
  },
): Promise<void> {
  const now = input.now?.() ?? new Date();
  const token = createOpaqueToken();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
  const { data, error } = await admin.rpc("prepare_email_marketing_confirmation", {
    p_lead_id: input.leadId,
    p_list_key: input.listKey,
    p_source: input.source,
    p_consent_text: input.consentText,
    p_request_id: input.requestId,
    p_token_hash: hashToken(token),
    p_expires_at: expiresAt,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (
    error || !isRecord(row) || typeof row.confirmation_token_id !== "string" ||
    typeof row.created !== "boolean"
  ) throw new Error("Marketing confirmation persistence unavailable");

  if (!row.created) return;
  await queueMarketingOptInConfirmation(admin, {
    leadId: input.leadId,
    idempotencyKey: row.confirmation_token_id,
    recipientEmail: input.recipientEmail,
    confirmationLink: confirmationLink(input.publicOrigin, token),
    expiresAt,
  });
}

export async function confirmMarketingSubscription(
  admin: AdminClient,
  token: unknown,
): Promise<MarketingConfirmationResult> {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) return "invalid";
  const { data, error } = await admin.rpc("confirm_email_marketing_subscription_by_token_hash", {
    p_token_hash: hashToken(token),
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !isRecord(row) || typeof row.result !== "string") {
    throw new Error("Marketing confirmation unavailable");
  }
  if (row.result === "processed" || row.result === "already_confirmed" || row.result === "suppressed" || row.result === "invalid") {
    return row.result;
  }
  throw new Error("Marketing confirmation unavailable");
}
