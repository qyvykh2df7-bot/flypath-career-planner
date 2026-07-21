import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { isCommerceUuid } from "@/lib/commerce/contracts";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const CAREER_PLANNER_DELIVERY_COOKIE = "flypath_career_planner_delivery";
export const CAREER_PLANNER_DELIVERY_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type CareerPlannerDeliveryStatus = "verifying" | "confirmed" | "failed" | "expired";

export class CareerPlannerDeliveryError extends Error {
  constructor(public readonly kind: "invalid" | "unavailable" | "not_confirmed") {
    super("Career Planner delivery is unavailable");
    this.name = "CareerPlannerDeliveryError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function isCareerPlannerDeliveryToken(value: unknown): value is string {
  return isToken(value);
}

function isStripeTestSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_test_[A-Za-z0-9_]{8,240}$/.test(value);
}

function isDeliveryStatus(value: unknown): value is CareerPlannerDeliveryStatus {
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

export async function issueCareerPlannerDeliveryAccess(
  sessionId: unknown,
  checkoutIntentId: unknown,
): Promise<{ token: string; maxAge: number } | null> {
  if (!isStripeTestSessionId(sessionId) || !isCommerceUuid(checkoutIntentId)) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + CAREER_PLANNER_DELIVERY_TOKEN_MAX_AGE_SECONDS * 1_000).toISOString();
  const { data, error } = await getSupabaseAdmin().rpc("issue_career_planner_delivery_access", {
    p_stripe_session_id: sessionId,
    p_checkout_intent_id: checkoutIntentId,
    p_token_hash: hashToken(token),
    p_expires_at: expiresAt,
  });

  if (error) throw new CareerPlannerDeliveryError("unavailable");
  if (data === "issued") return { token, maxAge: CAREER_PLANNER_DELIVERY_TOKEN_MAX_AGE_SECONDS };
  if (data === "existing") return null;
  throw new CareerPlannerDeliveryError("invalid");
}

export async function getCareerPlannerDeliveryStatus(rawToken: unknown): Promise<CareerPlannerDeliveryStatus> {
  if (!isToken(rawToken)) throw new CareerPlannerDeliveryError("invalid");
  const { data, error } = await getSupabaseAdmin().rpc("get_career_planner_delivery_status", {
    p_token_hash: hashToken(rawToken),
  });
  if (error || !isDeliveryStatus(data)) throw new CareerPlannerDeliveryError("unavailable");
  return data;
}

export async function consumeCareerPlannerDelivery(rawToken: unknown): Promise<void> {
  if (!isToken(rawToken)) throw new CareerPlannerDeliveryError("invalid");
  const { data, error } = await getSupabaseAdmin().rpc("consume_career_planner_report_download", {
    p_token_hash: hashToken(rawToken),
  });
  if (error) throw new CareerPlannerDeliveryError("unavailable");
  if (data === "confirmed") return;
  if (data === "verifying" || data === "failed" || data === "expired" || data === "limit_reached") {
    throw new CareerPlannerDeliveryError("not_confirmed");
  }
  throw new CareerPlannerDeliveryError("unavailable");
}
