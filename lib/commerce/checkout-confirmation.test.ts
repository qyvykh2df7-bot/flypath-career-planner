import { describe, expect, it } from "vitest";
import {
  canCloseCareerPlannerCheckoutConfirmation,
  parseCareerPlannerCheckoutPresentationStatus,
  shouldPollCareerPlannerCheckoutConfirmation,
} from "./checkout-confirmation";

describe("Career Planner Checkout confirmation presentation", () => {
  it("moves the presentation from verifying to confirmed only on a closed server status", () => {
    expect(parseCareerPlannerCheckoutPresentationStatus("verifying")).toBe("verifying");
    expect(parseCareerPlannerCheckoutPresentationStatus("confirmed")).toBe("confirmed");
    expect(parseCareerPlannerCheckoutPresentationStatus("paid")).toBeNull();
    expect(parseCareerPlannerCheckoutPresentationStatus({ status: "confirmed" })).toBeNull();
  });

  it("keeps the modal closed to accidental dismissal while verifying and exposes retry states", () => {
    expect(canCloseCareerPlannerCheckoutConfirmation("verifying")).toBe(false);
    expect(canCloseCareerPlannerCheckoutConfirmation("confirmed")).toBe(true);
    expect(canCloseCareerPlannerCheckoutConfirmation("delayed")).toBe(true);
    expect(shouldPollCareerPlannerCheckoutConfirmation("verifying", 0, 12)).toBe(true);
    expect(shouldPollCareerPlannerCheckoutConfirmation("verifying", 12, 12)).toBe(false);
    expect(shouldPollCareerPlannerCheckoutConfirmation("confirmed", 0, 12)).toBe(false);
  });
});
