import { resolveActiveEntitlementKeys } from "@/lib/commerce/entitlements";
import type { EntitlementGrant } from "@/lib/commerce/contracts";
import { AEROCOMMS_PRO_CATALOG } from "@/lib/commerce/aerocomms-pro-catalog";

export const AEROCOMMS_PRO_ENTITLEMENT_KEY = AEROCOMMS_PRO_CATALOG.entitlementKey;

export type AeroCommsAccessSource = "entitlement" | "development_override" | "free";
export type AeroCommsAccessStatus =
  | "loading"
  | "anonymous_free"
  | "authenticated_free"
  | "pro"
  | "unavailable";
export type AeroCommsIdentityStatus = "loading" | "anonymous" | "authenticated" | "unavailable";

/**
 * Client-safe access snapshot. It intentionally contains no billing, order, or
 * subscription data: consumers only need to know whether Pro is effective.
 */
export type AeroCommsAccess = {
  status: AeroCommsAccessStatus;
  isPro: boolean;
  source: AeroCommsAccessSource;
};

type AeroCommsAccessOptions = {
  entitlementKeys?: readonly string[];
  environment?: string | undefined;
  identityStatus?: AeroCommsIdentityStatus;
  developmentOverride?: boolean;
};

function freeStatus(identityStatus: AeroCommsIdentityStatus): Exclude<AeroCommsAccessStatus, "pro"> {
  if (identityStatus === "anonymous") return "anonymous_free";
  if (identityStatus === "authenticated") return "authenticated_free";
  return identityStatus;
}

/**
 * Development/test convenience only. Production always resolves false,
 * regardless of browser storage or public environment configuration.
 */
export function isAeroCommsDevelopmentOverrideEnabled(
  environment: string | undefined = process.env.NODE_ENV,
  enabled: boolean = process.env.NEXT_PUBLIC_AEROCOMMS_DEV_UNLOCK_ALL === "true",
): boolean {
  return enabled && (environment === "development" || environment === "test");
}

/** Resolves the one access contract consumed by all AeroComms gates. */
export function resolveAeroCommsAccess({
  entitlementKeys = [],
  environment,
  identityStatus = "authenticated",
  developmentOverride,
}: AeroCommsAccessOptions = {}): AeroCommsAccess {
  if (isAeroCommsDevelopmentOverrideEnabled(environment, developmentOverride)) {
    return { status: "pro", isPro: true, source: "development_override" };
  }

  if (identityStatus === "authenticated" && entitlementKeys.includes(AEROCOMMS_PRO_ENTITLEMENT_KEY)) {
    return { status: "pro", isPro: true, source: "entitlement" };
  }

  return { status: freeStatus(identityStatus), isPro: false, source: "free" };
}

/** Converts closed Commerce grants into the AeroComms-specific access contract. */
export function resolveAeroCommsAccessFromGrants(
  grants: readonly EntitlementGrant[],
  now?: Date,
  environment?: string | undefined,
  identityStatus: AeroCommsIdentityStatus = "authenticated",
): AeroCommsAccess {
  return resolveAeroCommsAccess({
    entitlementKeys: resolveActiveEntitlementKeys(grants, now),
    environment,
    identityStatus,
  });
}

/**
 * Reconciles the server snapshot with live browser Auth changes. A Pro snapshot
 * is reusable only by the same authenticated account that received it.
 */
export function reconcileAeroCommsAccess(
  serverAccess: AeroCommsAccess,
  serverAccountId: string | null,
  identity: { status: AeroCommsIdentityStatus; accountId?: string },
  environment: string | undefined = process.env.NODE_ENV,
): AeroCommsAccess {
  if (identity.status === "authenticated" && identity.accountId === serverAccountId) {
    return serverAccess;
  }

  if (serverAccess.status === "unavailable" && identity.status === "authenticated") {
    return serverAccess;
  }

  return resolveAeroCommsAccess({ identityStatus: identity.status, environment });
}
