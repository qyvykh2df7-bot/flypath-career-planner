import "server-only";

import Stripe from "stripe";
import { CanonicalOriginError, getCanonicalOrigin } from "@/lib/security/canonical-origin";

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
  FLYPATH_CANONICAL_ORIGIN?: string;
  NODE_ENV?: string;
};

export type StripeMode = "test" | "live";

let stripeClient: { secretKey: string; client: Stripe } | null = null;

function readTrimmed(environment: StripeEnvironment, key: "STRIPE_SECRET_KEY"): string | null {
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
export function resolveStripeAppUrl(environment: StripeEnvironment = process.env): string {
  try {
    return getCanonicalOrigin(environment);
  } catch {
    const issue = (() => {
      try { getCanonicalOrigin(environment); } catch (error) {
        return error instanceof CanonicalOriginError && error.kind === "missing"
          ? "missing_production_app_url" as const
          : "invalid_app_url" as const;
      }
      return "invalid_app_url" as const;
    })();
    throw new StripeConfigurationError(issue);
  }
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
