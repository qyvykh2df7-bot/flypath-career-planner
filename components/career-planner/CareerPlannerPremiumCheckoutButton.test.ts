import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "components/career-planner/CareerPlannerPremiumCheckoutButton.tsx"),
  "utf8",
);

describe("Career Planner Premium Checkout button", () => {
  it("sends only the closed product key, blocks a second click and redirects only to Stripe Checkout", () => {
    expect(source).toContain('fetch("/api/commerce/checkout"');
    expect(source).toContain('JSON.stringify({ productKey: CAREER_PLANNER_PREMIUM_CHECKOUT_KEY })');
    expect(source).toContain('disabled={status === "loading"}');
    expect(source).toContain("isStripeCheckoutUrl(url)");
    expect(source).toContain("window.location.assign(url)");
    expect(source).not.toContain("priceId");
    expect(source).not.toContain("amount:");
    expect(source).not.toContain("currency:");
  });
});
