import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isCommerceUuid } from "./contracts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const PRE_PPL_GUIDE_DELIVERY_COOKIE = "flypath_preppl_guide_delivery";
export const PRE_PPL_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const PRE_PPL_PDF_PATH = path.join(process.cwd(), "private-assets", "commerce", "pre-ppl-guide.pdf");

export type PrePplGuideDeliveryStatus = "verifying" | "confirmed" | "failed" | "expired";

export class PrePplGuideDeliveryError extends Error {
  constructor(public readonly kind: "invalid" | "unavailable" | "not_confirmed") {
    super("Pre-PPL delivery is unavailable");
    this.name = "PrePplGuideDeliveryError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function isStripeCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_(?:test|live)_[A-Za-z0-9_]{8,240}$/.test(value);
}

function isDeliveryStatus(value: unknown): value is PrePplGuideDeliveryStatus {
  return value === "verifying" || value === "confirmed" || value === "failed" || value === "expired";
}

export function getPrePplCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const item = cookieHeader.split(";").map((part) => part.trim().split("=", 2)).find(([key]) => key === name)?.[1];
  return item ? decodeURIComponent(item) : null;
}

export async function issuePrePplGuideDeliveryAccess(sessionId: unknown, checkoutIntentId: unknown): Promise<{ token: string; maxAge: number } | null> {
  if (!isStripeCheckoutSessionId(sessionId) || !isCommerceUuid(checkoutIntentId)) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PRE_PPL_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS * 1_000).toISOString();
  const { data, error } = await getSupabaseAdmin().rpc("issue_preppl_guide_delivery_access", {
    p_stripe_session_id: sessionId,
    p_checkout_intent_id: checkoutIntentId,
    p_token_hash: hashToken(token),
    p_expires_at: expiresAt,
  });
  if (error) throw new PrePplGuideDeliveryError("unavailable");
  if (data === "issued") return { token, maxAge: PRE_PPL_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS };
  if (data === "existing") return null;
  throw new PrePplGuideDeliveryError("invalid");
}

export async function getPrePplGuideDeliveryStatus(rawToken: unknown): Promise<PrePplGuideDeliveryStatus> {
  if (!isToken(rawToken)) throw new PrePplGuideDeliveryError("invalid");
  const { data, error } = await getSupabaseAdmin().rpc("get_preppl_guide_delivery_status", { p_token_hash: hashToken(rawToken) });
  if (error || !isDeliveryStatus(data)) throw new PrePplGuideDeliveryError("unavailable");
  return data;
}

export async function consumePrePplGuideDelivery(rawToken: unknown): Promise<void> {
  if (!isToken(rawToken)) throw new PrePplGuideDeliveryError("invalid");
  const { data, error } = await getSupabaseAdmin().rpc("consume_preppl_guide_download", { p_token_hash: hashToken(rawToken) });
  if (error) throw new PrePplGuideDeliveryError("unavailable");
  if (data === "confirmed") return;
  if (data === "verifying" || data === "failed" || data === "expired" || data === "limit_reached") {
    throw new PrePplGuideDeliveryError("not_confirmed");
  }
  throw new PrePplGuideDeliveryError("unavailable");
}

export async function readPrePplGuidePdf(): Promise<Buffer> {
  try {
    const pdf = await readFile(PRE_PPL_PDF_PATH);
    if (pdf.length === 0 || !pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("Invalid guide asset");
    return pdf;
  } catch {
    throw new PrePplGuideDeliveryError("unavailable");
  }
}

export const PRE_PPL_GUIDE_PRIVATE_ASSET_PATH = "private-assets/commerce/pre-ppl-guide.pdf";
