import { resolveActiveEntitlementKeys } from "@/lib/commerce/entitlements";
import type { EntitlementGrant } from "@/lib/commerce/contracts";
import { AEROCOMMS_PRO_CATALOG } from "@/lib/commerce/aerocomms-pro-catalog";

export const AEROCOMMS_PRO_ENTITLEMENT_KEY = AEROCOMMS_PRO_CATALOG.entitlementKey;

export type AeroCommsAccessSource = "entitlement" | "development_override" | "free";

/**
 * Client-safe access snapshot. It intentionally contains no billing, order, or
 * subscription data: consumers only need to know whether Pro is effective.
 */
export type AeroCommsAccess = {
  isPro: boolean;
  source: AeroCommsAccessSource;
};

type AeroCommsAccessOptions = {
  entitlementKeys?: readonly string[];
  environment?: string | undefined;
};

/**
 * Development/test convenience only. Production always resolves false,
 * regardless of browser storage or public environment configuration.
 */
export function isAeroCommsDevelopmentOverrideEnabled(
  environment: string | undefined = process.env.NODE_ENV,
): boolean {
  return environment === "development" || environment === "test";
}

/** Resolves the one access contract consumed by all AeroComms gates. */
export function resolveAeroCommsAccess({
  entitlementKeys = [],
  environment,
}: AeroCommsAccessOptions = {}): AeroCommsAccess {
  if (isAeroCommsDevelopmentOverrideEnabled(environment)) {
    return { isPro: true, source: "development_override" };
  }

  if (entitlementKeys.includes(AEROCOMMS_PRO_ENTITLEMENT_KEY)) {
    return { isPro: true, source: "entitlement" };
  }

  return { isPro: false, source: "free" };
}

/** Converts closed Commerce grants into the AeroComms-specific access contract. */
export function resolveAeroCommsAccessFromGrants(
  grants: readonly EntitlementGrant[],
  now?: Date,
  environment?: string | undefined,
): AeroCommsAccess {
  return resolveAeroCommsAccess({
    entitlementKeys: resolveActiveEntitlementKeys(grants, now),
    environment,
  });
}
