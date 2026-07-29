import "server-only";

import { createHmac } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/tracking/server";

export type PublicFormScope =
  | "newsletter_ip"
  | "newsletter_email"
  | "career_planner_ip"
  | "career_planner_email"
  | "preppl_ip"
  | "preppl_email"
  | "mentorship_ip"
  | "mentorship_email"
  | "school_review_ip"
  | "school_review_identity"
  | "school_review_resend_ip"
  | "school_review_verify_ip"
  | "school_review_verify_token";

type RateLimitResult = { allowed: boolean; retry_after_seconds: number };

type PublicFormEnvironment = {
  NODE_ENV?: string;
  VERCEL?: string;
  PUBLIC_FORM_RATE_LIMIT_SALT?: string;
};

export class PublicFormSecurityError extends Error {
  constructor(
    public readonly kind: "forbidden" | "invalid" | "rate_limited" | "unavailable",
    public readonly retryAfterSeconds?: number,
  ) {
    super("Public form request could not be authorized");
    this.name = "PublicFormSecurityError";
  }
}

function normalizedIp(value: string | null): string | null {
  const candidate = value?.split(",", 1)[0]?.trim() ?? "";
  return /^[0-9a-f:.]{3,45}$/i.test(candidate) ? candidate.toLowerCase() : null;
}

/** Only Vercel's platform address is trusted in production. */
export function getTrustedPublicFormIp(
  request: Request,
  environment: PublicFormEnvironment = process.env,
): string | null {
  if (environment.VERCEL === "1") {
    return normalizedIp(request.headers.get("x-vercel-forwarded-for"));
  }
  if (environment.NODE_ENV === "production") return null;
  return normalizedIp(request.headers.get("x-real-ip"))
    ?? normalizedIp(request.headers.get("x-forwarded-for"));
}

function subjectHash(subject: string, environment: PublicFormEnvironment): string {
  const salt = environment.PUBLIC_FORM_RATE_LIMIT_SALT?.trim();
  if (!salt || salt.length < 32) throw new PublicFormSecurityError("unavailable");
  return createHmac("sha256", salt).update(subject).digest("hex");
}

function readRateLimitResult(value: unknown): RateLimitResult | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const candidate = row as Partial<RateLimitResult>;
  if (
    typeof candidate.allowed !== "boolean" ||
    typeof candidate.retry_after_seconds !== "number" ||
    !Number.isInteger(candidate.retry_after_seconds) ||
    candidate.retry_after_seconds < 0
  ) return null;
  return { allowed: candidate.allowed, retry_after_seconds: candidate.retry_after_seconds };
}

async function consume(scope: PublicFormScope, subject: string, environment: PublicFormEnvironment) {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("consume_public_form_rate_limit", {
      p_scope: scope,
      p_subject_hash: subjectHash(subject, environment),
    });
    const result = error ? null : readRateLimitResult(data);
    if (!result) throw new Error("public_form_rate_limit_unavailable");
    if (!result.allowed) throw new PublicFormSecurityError("rate_limited", result.retry_after_seconds);
  } catch (error) {
    if (error instanceof PublicFormSecurityError) throw error;
    console.error("[FlyPath] Public form quota unavailable: distributed_rate_limit.");
    throw new PublicFormSecurityError("unavailable");
  }
}

export function validatePublicFormProof(
  request: Request,
  value: { honeypot?: unknown; formStartedAt?: unknown },
  now = Date.now(),
): void {
  if (!isSameOriginRequest(request)) throw new PublicFormSecurityError("forbidden");
  if (value.honeypot !== undefined && (typeof value.honeypot !== "string" || value.honeypot.trim())) {
    throw new PublicFormSecurityError("invalid");
  }
  if (typeof value.formStartedAt !== "number" || !Number.isInteger(value.formStartedAt)) {
    throw new PublicFormSecurityError("invalid");
  }
  const elapsed = now - value.formStartedAt;
  // Human forms may be open for a while, but cannot legitimately be completed instantly.
  if (elapsed < 1_000 || elapsed > 24 * 60 * 60 * 1_000) {
    throw new PublicFormSecurityError("invalid");
  }
}

export async function authorizePublicFormSubmission(
  request: Request,
  input: {
    ipScope: PublicFormScope;
    identityScope: PublicFormScope;
    identitySubject: string;
    environment?: PublicFormEnvironment;
  },
): Promise<void> {
  const environment = input.environment ?? process.env;
  const ip = getTrustedPublicFormIp(request, environment);
  if (!ip) throw new PublicFormSecurityError("unavailable");
  await consume(input.ipScope, `ip:${ip}`, environment);
  await consume(input.identityScope, input.identitySubject, environment);
}

export function publicFormSecurityErrorResponse(error: PublicFormSecurityError): Response {
  if (error.kind === "forbidden" || error.kind === "invalid") {
    return Response.json({ error: "Solicitud inválida." }, { status: error.kind === "forbidden" ? 403 : 400 });
  }
  if (error.kind === "rate_limited") {
    const retryAfterSeconds = Math.max(1, error.retryAfterSeconds ?? 1);
    return Response.json(
      { error: "Has realizado demasiados intentos. Inténtalo más tarde.", code: "rate_limited", retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }
  return Response.json(
    { error: "El formulario no está disponible temporalmente. Inténtalo más tarde.", code: "unavailable" },
    { status: 503 },
  );
}

export function hasOnlyPublicFormKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isJsonRequest(request: Request): boolean {
  return request.headers.get("content-type")?.toLowerCase().split(";", 1)[0]?.trim() === "application/json";
}
