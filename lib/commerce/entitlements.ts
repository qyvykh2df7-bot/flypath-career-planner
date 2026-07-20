import type { EntitlementGrant } from "./contracts";

function validDate(value: string | null): number | null {
  if (value === null) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

/** Pure resolver for server-side callers. Pending guest claims never confer access. */
export function isEntitlementGrantActive(grant: EntitlementGrant, now = new Date()): boolean {
  if (grant.status !== "active" || grant.revokedAt !== null) return false;
  const startsAt = validDate(grant.startsAt);
  const endsAt = validDate(grant.endsAt);
  if (startsAt === null || startsAt > now.getTime()) return false;
  return endsAt === null || endsAt > now.getTime();
}

/** Returns a stable, deduplicated effective entitlement set for one account. */
export function resolveActiveEntitlementKeys(grants: readonly EntitlementGrant[], now = new Date()): string[] {
  return [...new Set(
    grants
      .filter((grant) => isEntitlementGrantActive(grant, now))
      .map((grant) => grant.entitlementKey),
  )].sort();
}
