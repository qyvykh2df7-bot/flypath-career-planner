import { describe, expect, it } from "vitest";
import {
  DEFAULT_HAS_PREMIUM_FOLLOW_UP,
  getEvaluationFollowUpAccess,
} from "./evaluation-follow-up-access";

describe("evaluation-follow-up-access", () => {
  it("defaults to free tier without premium follow-up", () => {
    expect(DEFAULT_HAS_PREMIUM_FOLLOW_UP).toBe(false);
    expect(getEvaluationFollowUpAccess().hasPremiumFollowUp).toBe(false);
  });

  it("allows override for future premium flag", () => {
    expect(getEvaluationFollowUpAccess({ hasPremiumFollowUp: true }).hasPremiumFollowUp).toBe(
      true,
    );
  });
});
