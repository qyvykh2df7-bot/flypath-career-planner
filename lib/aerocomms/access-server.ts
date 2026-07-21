import "server-only";

import { getFlyPathSessionState } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { EntitlementGrant } from "@/lib/commerce/contracts";
import {
  AEROCOMMS_PRO_ENTITLEMENT_KEY,
  resolveAeroCommsAccessFromGrants,
  type AeroCommsAccess,
} from "./access";

export type AeroCommsAccessResult =
  | { status: "authenticated"; access: AeroCommsAccess }
  | { status: "anonymous" | "unavailable"; access: AeroCommsAccess };

type AeroCommsAccessQueryOptions = {
  /** Test-only injection; production callers use the runtime environment. */
  environment?: string | undefined;
};

type GrantRow = {
  status: EntitlementGrant["status"];
  starts_at: string;
  ends_at: string | null;
  revoked_at: string | null;
};

function toEntitlementGrant(row: GrantRow): EntitlementGrant {
  return {
    entitlementKey: AEROCOMMS_PRO_ENTITLEMENT_KEY,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    revokedAt: row.revoked_at,
  };
}

function freeAccess(environment?: string): AeroCommsAccess {
  return resolveAeroCommsAccessFromGrants([], undefined, environment);
}

/**
 * Resolves Pro only from active server-side grants belonging to the validated
 * FlyPath account. It deliberately does not inspect browser storage, profile
 * data, Stripe metadata, or email addresses.
 */
export async function getAeroCommsAccess(
  { environment }: AeroCommsAccessQueryOptions = {},
): Promise<AeroCommsAccessResult> {
  try {
    const session = await getFlyPathSessionState();
    if (session.status !== "authenticated") {
      return { status: session.status, access: freeAccess(environment) };
    }

    const admin = getSupabaseAdmin();
    const { data: entitlement, error: entitlementError } = await admin
      .from("entitlements")
      .select("id")
      .eq("entitlement_key", AEROCOMMS_PRO_ENTITLEMENT_KEY)
      .eq("is_active", true)
      .maybeSingle();

    if (entitlementError) return { status: "unavailable", access: freeAccess(environment) };
    if (!entitlement?.id) return { status: "authenticated", access: freeAccess(environment) };

    const { data: grants, error: grantsError } = await admin
      .from("entitlement_grants")
      .select("status, starts_at, ends_at, revoked_at")
      .eq("beneficiary_user_id", session.account.id)
      .eq("entitlement_id", entitlement.id);

    if (grantsError) return { status: "unavailable", access: freeAccess(environment) };

    return {
      status: "authenticated",
      access: resolveAeroCommsAccessFromGrants((grants ?? []).map(toEntitlementGrant), undefined, environment),
    };
  } catch {
    return { status: "unavailable", access: freeAccess(environment) };
  }
}
