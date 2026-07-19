import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getWarhomeAuthorization: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  isUuid: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/warhome/auth", () => ({ getWarhomeAuthorization: mocks.getWarhomeAuthorization }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/school-reviews/validation", () => ({ isSchoolReviewUuid: mocks.isUuid }));

import {
  getWarhomeReviewDetail,
  getWarhomeReviewsUrl,
  parseWarhomeReviewFilters,
  sanitizeWarhomeReviewSearch,
  validateWarhomeReviewModerationInput,
  moderateWarhomeReview,
} from "./reviews";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isUuid.mockReturnValue(true);
  mocks.getWarhomeAuthorization.mockResolvedValue({ status: "authorized", admin: { userId: "4d3c2b1a-1234-4abc-8def-1234567890ab", role: "admin" } });
  mocks.getSupabaseAdmin.mockReturnValue({ rpc: mocks.rpc });
});

describe("Warhome school review moderation contract", () => {
  it("loads a linked pending review using profiles.user_id", async () => {
    const profileEq = vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: "Cuenta de prueba" }, error: null }),
    }));
    const review = {
      review_id: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      school_id: "school-id",
      user_id: "9b9265b7-9ed8-4c90-93f1-4ebd42bb57a8",
      author_email: "private@example.com",
      status: "pending",
      is_anonymous: true,
      rating_general: 8,
      rating_costs: 8,
      rating_availability: 8,
      rating_organization: 8,
      rating_instructors: 8,
      rating_support: 8,
      rating_contract: 8,
      final_cost_answer: "yes",
      contract_before_payment_answer: "yes",
      refund_clarity_answer: "yes",
      would_choose_again_answer: "yes",
      relationship: "former_student",
      program_phase: null,
      approximate_year: null,
      best_part: "Bien",
      improvements: "Nada",
      advice: "Pregunta",
      moderation_reason: null,
      moderation_note: null,
      created_at: "2026-07-19T12:00:00.000Z",
      email_verified_at: "2026-07-19T12:00:00.000Z",
      approved_at: null,
      rejected_at: null,
      hidden_at: null,
      deletion_requested_at: null,
      deleted_at: null,
    };
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "school_reviews") {
          return { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: review, error: null }) })) })) };
        }
        if (table === "schools") {
          return { select: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ data: [{ school_id: "school-id", name: "Escuela", slug: "escuela" }], error: null }) })) };
        }
        if (table === "school_review_versions" || table === "school_review_moderation_events") {
          return { select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })) })) };
        }
        if (table === "profiles") {
          return { select: vi.fn(() => ({ eq: profileEq })) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    mocks.getSupabaseAdmin.mockReturnValue(admin);

    await expect(getWarhomeReviewDetail(review.review_id)).resolves.toMatchObject({
      review: { status: "pending", schoolName: "Escuela" },
      linkedProfile: { fullName: "Cuenta de prueba" },
    });
    expect(profileEq).toHaveBeenCalledWith("user_id", review.user_id);
  });

  it("normalizes closed filters and preserves pagination safely", () => {
    expect(parseWarhomeReviewFilters({ q: "  pilot@example.com<script>  ", status: "approved", page: "2" })).toEqual({ query: "pilot@example.comscript", status: "approved", page: 2 });
    expect(parseWarhomeReviewFilters({ status: "deleted", page: "-1" })).toEqual({ query: "", status: null, page: 1 });
    expect(getWarhomeReviewsUrl({ query: "academy", status: "pending", page: 1 }, 3)).toBe("/warhome/reviews?q=academy&status=pending&page=3");
    expect(sanitizeWarhomeReviewSearch("x".repeat(100))).toHaveLength(80);
  });

  it("only allows closed moderation reasons and target transitions as action input", () => {
    expect(validateWarhomeReviewModerationInput({ expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "  Revisada  " })).toEqual({ expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "Revisada" });
    expect(validateWarhomeReviewModerationInput({ expectedStatus: "pending", targetStatus: "approved", reason: "other", internalNote: "" })).toBeNull();
    expect(validateWarhomeReviewModerationInput({ expectedStatus: "pending", targetStatus: "hidden", reason: "other", internalNote: "" })).toBeNull();
    expect(validateWarhomeReviewModerationInput({ expectedStatus: "deletion_requested", targetStatus: "deleted", reason: "author_request", internalNote: "" })).toMatchObject({ targetStatus: "deleted" });
    expect(validateWarhomeReviewModerationInput({ expectedStatus: "deleted", targetStatus: "pending", reason: "other", internalNote: "" })).toBeNull();
  });

  it("keeps private fields and actions inside the server-only data layer", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/warhome/reviews.ts"), "utf8");
    const component = readFileSync(resolve(process.cwd(), "components/warhome/WarhomeReviewsTable.tsx"), "utf8");
    expect(source).toContain('import "server-only"');
    expect(source).toContain("getWarhomeAuthorization()");
    expect(source).toContain('rpc("moderate_school_review_atomically"');
    expect(source).toContain("ALLOWED_TRANSITIONS");
    expect(source).not.toContain('from("school_review_moderation_events").insert');
    expect(component).not.toContain("getSupabaseAdmin");
    expect(component).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("uses one atomic RPC for a valid transition and returns the applied result", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ result: "applied", status: "approved" }], error: null });

    await expect(moderateWarhomeReview("4d3c2b1a-1234-4abc-8def-1234567890ab", { expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "revisada" })).resolves.toEqual({ changed: true });
    expect(mocks.rpc).toHaveBeenCalledWith("moderate_school_review_atomically", {
      p_review_id: "4d3c2b1a-1234-4abc-8def-1234567890ab",
      p_expected_status: "pending",
      p_target_status: "approved",
      p_reason: "approved",
      p_internal_note: "revisada",
      p_moderator_user_id: "4d3c2b1a-1234-4abc-8def-1234567890ab",
    });
  });

  it("treats an exact second execution as idempotent without a second client write", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ result: "already_applied", status: "approved" }], error: null });
    await expect(moderateWarhomeReview("4d3c2b1a-1234-4abc-8def-1234567890ab", { expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "" })).resolves.toEqual({ changed: false });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects stale expected state and invalid RPC contracts without exposing a database detail", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ result: "state_conflict", status: "rejected" }], error: null });
    await expect(moderateWarhomeReview("4d3c2b1a-1234-4abc-8def-1234567890ab", { expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "" })).rejects.toThrow("transition");
    mocks.rpc.mockResolvedValueOnce({ data: [{ result: "unexpected", status: "approved" }], error: null });
    await expect(moderateWarhomeReview("4d3c2b1a-1234-4abc-8def-1234567890ab", { expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "" })).rejects.toThrow("data");
  });

  it("rejects unauthorized callers before the RPC and invalid input before any write", async () => {
    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "not_admin", userId: "4d3c2b1a-1234-4abc-8def-1234567890ab" });
    await expect(moderateWarhomeReview("4d3c2b1a-1234-4abc-8def-1234567890ab", { expectedStatus: "pending", targetStatus: "approved", reason: "approved", internalNote: "" })).rejects.toThrow("authorization");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();

    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "authorized", admin: { userId: "4d3c2b1a-1234-4abc-8def-1234567890ab", role: "admin" } });
    await expect(moderateWarhomeReview("4d3c2b1a-1234-4abc-8def-1234567890ab", { expectedStatus: "pending", targetStatus: "hidden", reason: "other", internalNote: "" })).rejects.toThrow("transition");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
