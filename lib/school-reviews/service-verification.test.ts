import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/email/send-transactional-email", () => ({ queueSchoolReviewVerification: vi.fn() }));
vi.mock("@/lib/schools/schoolSlugAliases", () => ({ resolveSupabaseSlugForLocal: (value: string) => value }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));

import { verifySchoolReviewEmail } from "./service";

const reviewId = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const opaqueToken = "A".repeat(43);
const verificationNow = new Date("2026-07-19T12:00:00.000Z");

function chain(result: unknown) {
  const value = {
    eq: () => value,
    is: () => value,
    select: () => value,
    maybeSingle: async () => result,
  };
  return value;
}

function createAdmin(input: {
  token: { data: unknown; error: unknown };
  consumed?: { data: unknown; error: unknown };
  review?: { data: unknown; error: unknown };
}) {
  return {
    from(table: string) {
      if (table === "school_review_tokens") {
        return {
          select: () => chain(input.token),
          update: () => chain(input.consumed ?? { data: null, error: null }),
        };
      }
      if (table === "school_reviews") return { update: () => chain(input.review ?? { data: null, error: null }) };
      if (table === "school_review_moderation_events") return { insert: async () => ({ error: null }) };
      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe("verifySchoolReviewEmail", () => {
  it("consumes a valid token and moves its review to pending moderation", async () => {
    const admin = createAdmin({
      token: { data: { token_id: "token-id", review_id: reviewId, purpose: "verify_email", expires_at: "2026-07-21T12:00:00.000Z", consumed_at: null, revoked_at: null }, error: null },
      consumed: { data: { review_id: reviewId }, error: null },
      review: { data: { review_id: reviewId }, error: null },
    });
    await expect(verifySchoolReviewEmail(opaqueToken, { admin: admin as never, now: () => verificationNow })).resolves.toBe("verified");
  });

  it("does not consume malformed, consumed, or expired tokens", async () => {
    const consumedAdmin = createAdmin({
      token: { data: { token_id: "token-id", review_id: reviewId, purpose: "verify_email", expires_at: "2026-07-21T12:00:00.000Z", consumed_at: "2026-07-19T11:00:00.000Z", revoked_at: null }, error: null },
    });
    const expiredAdmin = createAdmin({
      token: { data: { token_id: "token-id", review_id: reviewId, purpose: "verify_email", expires_at: "2026-07-18T12:00:00.000Z", consumed_at: null, revoked_at: null }, error: null },
    });

    await expect(verifySchoolReviewEmail("not-a-token", { admin: consumedAdmin as never })).resolves.toBe("invalid_or_expired");
    await expect(verifySchoolReviewEmail(opaqueToken, { admin: consumedAdmin as never, now: () => verificationNow })).resolves.toBe("already_verified");
    await expect(verifySchoolReviewEmail(opaqueToken, { admin: expiredAdmin as never, now: () => verificationNow })).resolves.toBe("invalid_or_expired");
  });
});
