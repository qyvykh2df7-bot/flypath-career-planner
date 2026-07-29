import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getStripeConfiguration,
  resolveStripeAppUrl,
  StripeConfigurationError,
  StripeProviderError,
  toStripeProviderError,
} from "./stripe";

describe("Stripe configuration", () => {
  it("derives the provider mode from a supported server-only key", () => {
    expect(getStripeConfiguration({ STRIPE_SECRET_KEY: "sk_test_example" })).toEqual({
      secretKey: "sk_test_example",
      mode: "test",
    });
    expect(getStripeConfiguration({ STRIPE_SECRET_KEY: "sk_live_example" })).toEqual({
      secretKey: "sk_live_example",
      mode: "live",
    });
    expect(() => getStripeConfiguration({})).toThrow(expect.objectContaining({ issue: "missing_secret" }));
    expect(() => getStripeConfiguration({ STRIPE_SECRET_KEY: "not_a_stripe_key" }))
      .toThrow(expect.objectContaining({ issue: "invalid_secret" }));
  });

  it("uses a canonical configured URL and permits localhost only outside production", () => {
    expect(resolveStripeAppUrl({ NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(resolveStripeAppUrl({
      NODE_ENV: "production",
      FLYPATH_CANONICAL_ORIGIN: "https://flypath.example",
    })).toBe("https://flypath.example");
    expect(() => resolveStripeAppUrl({ NODE_ENV: "production" })).toThrow(StripeConfigurationError);
  });

  it("classifies provider failures without retaining provider details", () => {
    const authenticationError = new StripeProviderError("authentication");
    expect(authenticationError).toMatchObject({ issue: "authentication", message: "Stripe provider is unavailable" });
    expect(toStripeProviderError(new Error("secret provider detail"))).toMatchObject({ issue: "unknown" });
  });
});
