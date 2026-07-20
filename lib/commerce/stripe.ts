import "server-only";

import Stripe from "stripe";

export class StripeConfigurationError extends Error {
  constructor() {
    super("Stripe configuration is unavailable");
    this.name = "StripeConfigurationError";
  }
}

export class StripeProviderError extends Error {
  constructor() {
    super("Stripe provider is unavailable");
    this.name = "StripeProviderError";
  }
}

type StripeEnvironment = {
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
  NODE_ENV?: string;
};

let stripeClient: Stripe | null = null;

function readTrimmed(environment: StripeEnvironment, key: "STRIPE_SECRET_KEY" | "NEXT_PUBLIC_APP_URL" | "APP_URL"): string | null {
  const value = environment[key]?.trim();
  return value ? value : null;
}

export function getStripeTestConfiguration(environment: StripeEnvironment = process.env): {
  secretKey: string;
} {
  const secretKey = readTrimmed(environment, "STRIPE_SECRET_KEY");
  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    throw new StripeConfigurationError();
  }

  return { secretKey };
}

export function getStripeClient(environment: StripeEnvironment = process.env): Stripe {
  const { secretKey } = getStripeTestConfiguration(environment);
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-06-24.dahlia",
      maxNetworkRetries: 1,
    });
  }

  return stripeClient;
}

/**
 * Production requires a canonical public URL. Local development can safely use
 * the request origin so test Checkout returns to the same local server.
 */
export function resolveStripeAppUrl(
  requestOrigin: string,
  environment: StripeEnvironment = process.env,
): string {
  const configuredUrl = readTrimmed(environment, "NEXT_PUBLIC_APP_URL") ?? readTrimmed(environment, "APP_URL");
  const candidate = configuredUrl ?? requestOrigin;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new StripeConfigurationError();
  }

  if (url.protocol !== "https:" && !(environment.NODE_ENV !== "production" && url.protocol === "http:" && url.hostname === "localhost")) {
    throw new StripeConfigurationError();
  }

  if (!configuredUrl && environment.NODE_ENV === "production") {
    throw new StripeConfigurationError();
  }

  return url.origin;
}

export function toStripeProviderError(error: unknown): StripeProviderError {
  if (error instanceof Stripe.errors.StripeError) return new StripeProviderError();
  return new StripeProviderError();
}
