import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getStripeTestConfiguration,
  resolveStripeAppUrl,
  StripeConfigurationError,
} from "./stripe";

describe("Stripe sandbox configuration", () => {
  it("requires a test key and rejects a live key", () => {
    expect(getStripeTestConfiguration({ STRIPE_SECRET_KEY: "sk_test_example" })).toEqual({
      secretKey: "sk_test_example",
    });
    expect(() => getStripeTestConfiguration({})).toThrow(StripeConfigurationError);
    expect(() => getStripeTestConfiguration({ STRIPE_SECRET_KEY: "sk_live_example" })).toThrow(StripeConfigurationError);
  });

  it("uses a canonical configured URL and permits localhost only outside production", () => {
    expect(resolveStripeAppUrl("http://localhost:3000", { NODE_ENV: "development" })).toBe("http://localhost:3000");
    expect(resolveStripeAppUrl("http://localhost:3000", {
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://flypath.example",
    })).toBe("https://flypath.example");
    expect(() => resolveStripeAppUrl("http://localhost:3000", { NODE_ENV: "production" })).toThrow(StripeConfigurationError);
  });
});
