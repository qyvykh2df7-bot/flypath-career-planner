import "server-only";

import Stripe from "stripe";

export type StripeConfigurationIssue =
  | "missing_secret"
  | "invalid_secret"
  | "invalid_app_url"
  | "missing_production_app_url";

export class StripeConfigurationError extends Error {
  constructor(public readonly issue: StripeConfigurationIssue) {
    super("Stripe configuration is unavailable");
    this.name = "StripeConfigurationError";
  }
}

export type StripeProviderIssue =
  | "authentication"
  | "invalid_request"
  | "idempotency"
  | "rate_limit"
  | "connection"
  | "api"
  | "unknown";

export class StripeProviderError extends Error {
  constructor(public readonly issue: StripeProviderIssue = "unknown") {
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

export type StripeMode = "test" | "live";

let stripeClient: { secretKey: string; client: Stripe } | null = null;

function readTrimmed(environment: StripeEnvironment, key: "STRIPE_SECRET_KEY" | "NEXT_PUBLIC_APP_URL" | "APP_URL"): string | null {
  const value = environment[key]?.trim();
  return value ? value : null;
}

export function getStripeConfiguration(environment: StripeEnvironment = process.env): {
  secretKey: string;
  mode: StripeMode;
} {
  const secretKey = readTrimmed(environment, "STRIPE_SECRET_KEY");
  if (!secretKey) throw new StripeConfigurationError("missing_secret");
  if (secretKey.startsWith("sk_test_")) return { secretKey, mode: "test" };
  if (secretKey.startsWith("sk_live_")) return { secretKey, mode: "live" };

  throw new StripeConfigurationError("invalid_secret");
}

export function getStripeClient(environment: StripeEnvironment = process.env): Stripe {
  const { secretKey } = getStripeConfiguration(environment);
  if (!stripeClient || stripeClient.secretKey !== secretKey) {
    stripeClient = {
      secretKey,
      client: new Stripe(secretKey, {
      apiVersion: "2026-06-24.dahlia",
      maxNetworkRetries: 1,
      }),
    };
  }

  return stripeClient.client;
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
    throw new StripeConfigurationError("invalid_app_url");
  }

  if (url.protocol !== "https:" && !(environment.NODE_ENV !== "production" && url.protocol === "http:" && url.hostname === "localhost")) {
    throw new StripeConfigurationError("invalid_app_url");
  }

  if (!configuredUrl && environment.NODE_ENV === "production") {
    throw new StripeConfigurationError("missing_production_app_url");
  }

  return url.origin;
}

export function toStripeProviderError(error: unknown): StripeProviderError {
  if (error instanceof Stripe.errors.StripeAuthenticationError) return new StripeProviderError("authentication");
  if (error instanceof Stripe.errors.StripeInvalidRequestError) return new StripeProviderError("invalid_request");
  if (error instanceof Stripe.errors.StripeIdempotencyError) return new StripeProviderError("idempotency");
  if (error instanceof Stripe.errors.StripeRateLimitError) return new StripeProviderError("rate_limit");
  if (error instanceof Stripe.errors.StripeConnectionError) return new StripeProviderError("connection");
  if (error instanceof Stripe.errors.StripeAPIError) return new StripeProviderError("api");
  return new StripeProviderError();
}
