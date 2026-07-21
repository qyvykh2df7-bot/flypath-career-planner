import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isCommerceUuid } from "./contracts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const COMO_SER_PILOTO_GUIDE_DELIVERY_COOKIE = "flypath_como_ser_piloto_guide_delivery";
export const COMO_SER_PILOTO_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const GUIDE_PDF_PATH = path.join(process.cwd(), "private-assets", "commerce", "como-ser-piloto-guide.pdf");

export type ComoSerPilotoGuideDeliveryStatus = "verifying" | "confirmed" | "failed" | "expired";

export class ComoSerPilotoGuideDeliveryError extends Error {
  constructor(public readonly kind: "invalid" | "unavailable" | "not_confirmed") {
    super("Guide delivery is unavailable");
    this.name = "ComoSerPilotoGuideDeliveryError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function isStripeTestSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_test_[A-Za-z0-9_]{8,240}$/.test(value);
}

function isDeliveryStatus(value: unknown): value is ComoSerPilotoGuideDeliveryStatus {
  return value === "verifying" || value === "confirmed" || value === "failed" || value === "expired";
}

export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const item = cookieHeader
    .split(";")
    .map((part) => part.trim().split("=", 2))
    .find(([key]) => key === name)?.[1];
  return item ? decodeURIComponent(item) : null;
}

export async function issueComoSerPilotoGuideDeliveryAccess(
  sessionId: unknown,
  checkoutIntentId: unknown,
): Promise<{ token: string; maxAge: number } | null> {
  if (!isStripeTestSessionId(sessionId) || !isCommerceUuid(checkoutIntentId)) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + COMO_SER_PILOTO_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS * 1_000).toISOString();
  const { data, error } = await getSupabaseAdmin().rpc("issue_como_ser_piloto_guide_delivery_access", {
    p_stripe_session_id: sessionId,
    p_checkout_intent_id: checkoutIntentId,
    p_token_hash: hashToken(token),
    p_expires_at: expiresAt,
  });
  if (error) throw new ComoSerPilotoGuideDeliveryError("unavailable");
  if (data === "issued") return { token, maxAge: COMO_SER_PILOTO_GUIDE_DELIVERY_TOKEN_MAX_AGE_SECONDS };
  if (data === "existing") return null;
  throw new ComoSerPilotoGuideDeliveryError("invalid");
}

export async function getComoSerPilotoGuideDeliveryStatus(rawToken: unknown): Promise<ComoSerPilotoGuideDeliveryStatus> {
  if (!isToken(rawToken)) throw new ComoSerPilotoGuideDeliveryError("invalid");
  const { data, error } = await getSupabaseAdmin().rpc("get_como_ser_piloto_guide_delivery_status", {
    p_token_hash: hashToken(rawToken),
  });
  if (error || !isDeliveryStatus(data)) throw new ComoSerPilotoGuideDeliveryError("unavailable");
  return data;
}

export async function consumeComoSerPilotoGuideDelivery(rawToken: unknown): Promise<void> {
  if (!isToken(rawToken)) throw new ComoSerPilotoGuideDeliveryError("invalid");
  const { data, error } = await getSupabaseAdmin().rpc("consume_como_ser_piloto_guide_download", {
    p_token_hash: hashToken(rawToken),
  });
  if (error) throw new ComoSerPilotoGuideDeliveryError("unavailable");
  if (data === "confirmed") return;
  if (data === "verifying" || data === "failed" || data === "expired" || data === "limit_reached") {
    throw new ComoSerPilotoGuideDeliveryError("not_confirmed");
  }
  throw new ComoSerPilotoGuideDeliveryError("unavailable");
}

/** Reads a bundled private asset only after the delivery token has been consumed. */
export async function readComoSerPilotoGuidePdf(): Promise<Buffer> {
  try {
    const pdf = await readFile(GUIDE_PDF_PATH);
    if (pdf.length === 0 || !pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new Error("Invalid guide asset");
    }
    return pdf;
  } catch {
    throw new ComoSerPilotoGuideDeliveryError("unavailable");
  }
}

export const COMO_SER_PILOTO_GUIDE_PRIVATE_ASSET_PATH = "private-assets/commerce/como-ser-piloto-guide.pdf";
