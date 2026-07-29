import "server-only";

import { createHmac } from "node:crypto";

import { getAeroCommsAccess } from "@/lib/aerocomms/access-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/tracking/server";
import type { AeroCommsVoiceOperation, AeroCommsVoiceRateLimitScope } from "./voice-security";

type VoiceRateLimitRpcResult = { allowed: boolean; retry_after_seconds: number };

type VoiceAccessEnvironment = {
  AEROCOMMS_VOICE_RATE_LIMIT_SALT?: string;
  NODE_ENV?: string;
  VERCEL?: string;
};

export type AeroCommsVoiceAuthorization = {
  isPro: boolean;
  identity: "anonymous" | "authenticated";
  rateLimitScope: AeroCommsVoiceRateLimitScope;
};

export class AeroCommsVoiceAccessError extends Error {
  constructor(
    public readonly kind: "forbidden" | "rate_limited" | "unavailable",
    public readonly retryAfterSeconds?: number,
  ) {
    super("AeroComms voice request could not be authorized");
    this.name = "AeroCommsVoiceAccessError";
  }
}

function normalizedIp(value: string | null): string | null {
  const first = value?.split(",", 1)[0]?.trim() ?? "";
  // Accept only a plain IPv4/IPv6 address. This keeps malformed forwarded
  // headers from becoming persistent quota subjects.
  return /^[0-9a-f:.]{3,45}$/i.test(first) ? first.toLowerCase() : null;
}

/**
 * In Vercel, use only the platform-provided client address header. Local/test
 * requests may use the conventional proxy headers so the browser flow remains
 * testable, but production never trusts a client-supplied x-forwarded-for.
 */
export function getTrustedAeroCommsVoiceIp(
  request: Request,
  environment: VoiceAccessEnvironment = process.env,
): string | null {
  if (environment.VERCEL === "1") {
    return normalizedIp(request.headers.get("x-vercel-forwarded-for"));
  }

  if (environment.NODE_ENV === "production") return null;
  return normalizedIp(request.headers.get("x-real-ip")) ?? normalizedIp(request.headers.get("x-forwarded-for"));
}

function quotaScope(operation: AeroCommsVoiceOperation, identity: "anonymous" | "authenticated", isPro: boolean): AeroCommsVoiceRateLimitScope {
  if (isPro) return `${operation}_pro`;
  return identity === "authenticated" ? `${operation}_authenticated_free` : `${operation}_anonymous`;
}

function subjectHash(subject: string, environment: VoiceAccessEnvironment): string {
  const secret = environment.AEROCOMMS_VOICE_RATE_LIMIT_SALT?.trim();
  if (!secret || secret.length < 32) throw new AeroCommsVoiceAccessError("unavailable");
  return createHmac("sha256", secret).update(subject).digest("hex");
}

function readQuotaResult(value: unknown): VoiceRateLimitRpcResult | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const candidate = row as Partial<VoiceRateLimitRpcResult>;
  return typeof candidate.allowed === "boolean" &&
    typeof candidate.retry_after_seconds === "number" &&
    Number.isInteger(candidate.retry_after_seconds) &&
    candidate.retry_after_seconds >= 0
    ? { allowed: candidate.allowed, retry_after_seconds: candidate.retry_after_seconds }
    : null;
}

async function consumeDistributedQuota(scope: AeroCommsVoiceRateLimitScope, subjectHashValue: string): Promise<VoiceRateLimitRpcResult> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("consume_aerocomms_voice_rate_limit", {
      p_scope: scope,
      p_subject_hash: subjectHashValue,
    });
    const result = error ? null : readQuotaResult(data);
    if (!result) throw new Error("Voice quota RPC unavailable");
    return result;
  } catch {
    // Do not log account identifiers, IP addresses, request text, or provider errors.
    console.error("[FlyPath] AeroComms voice quota unavailable: distributed_rate_limit.");
    throw new AeroCommsVoiceAccessError("unavailable");
  }
}

/**
 * Authenticates through the server-side Supabase auth.getUser() boundary used by
 * getAeroCommsAccess. Free access is intentional; entitlement only selects the
 * higher Pro quota and is never sourced from browser storage.
 */
export async function authorizeAeroCommsVoiceRequest(
  request: Request,
  operation: AeroCommsVoiceOperation,
  environment: VoiceAccessEnvironment = process.env,
): Promise<AeroCommsVoiceAuthorization> {
  if (!isSameOriginRequest(request)) throw new AeroCommsVoiceAccessError("forbidden");

  const accessResult = await getAeroCommsAccess({ environment: environment.NODE_ENV });
  if (accessResult.status === "unavailable") throw new AeroCommsVoiceAccessError("unavailable");

  const identity = accessResult.status === "authenticated" && accessResult.accountId
    ? "authenticated"
    : "anonymous";
  const subject = identity === "authenticated"
    ? `user:${accessResult.accountId}`
    : (() => {
        const ip = getTrustedAeroCommsVoiceIp(request, environment);
        if (!ip) throw new AeroCommsVoiceAccessError("unavailable");
        return `ip:${ip}`;
      })();
  const scope = quotaScope(operation, identity, accessResult.access.isPro);
  const quota = await consumeDistributedQuota(scope, subjectHash(subject, environment));
  if (!quota.allowed) throw new AeroCommsVoiceAccessError("rate_limited", quota.retry_after_seconds);

  return { isPro: accessResult.access.isPro, identity, rateLimitScope: scope };
}

export function voiceAccessErrorResponse(error: AeroCommsVoiceAccessError): Response {
  if (error.kind === "forbidden") {
    return Response.json({ error: "Voice request is not permitted.", code: "forbidden" }, { status: 403 });
  }
  if (error.kind === "rate_limited") {
    const retryAfterSeconds = Math.max(1, error.retryAfterSeconds ?? 1);
    return Response.json(
      { error: "Voice request limit reached. Please try again later.", code: "rate_limited", retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }
  return Response.json({ error: "Voice service is temporarily unavailable.", code: "unavailable" }, { status: 503 });
}
