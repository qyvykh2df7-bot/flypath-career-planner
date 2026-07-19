import "server-only";

const buckets = new Map<string, { count: number; resetAt: number }>();

const LIMITS = {
  create: { max: 6, windowMs: 10 * 60_000 },
  resend: { max: 4, windowMs: 60 * 60_000 },
  verify: { max: 12, windowMs: 10 * 60_000 },
} as const;

export type SchoolReviewRateLimitScope = keyof typeof LIMITS;

function requestKey(request: Request, scope: SchoolReviewRateLimitScope): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return `${scope}:${ip.slice(0, 128)}`;
}

export function isSchoolReviewRateLimited(
  request: Request,
  scope: SchoolReviewRateLimitScope,
  now = Date.now(),
): boolean {
  if (buckets.size > 1_000) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }
  const key = requestKey(request, scope);
  const limit = LIMITS[scope];
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit.max;
}
