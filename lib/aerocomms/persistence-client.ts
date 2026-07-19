"use client";

import type { AeroCommsPersistencePayload } from "./persistence-contract";

export type AeroCommsProgressSyncResult =
  | { status: "synced"; snapshot: unknown }
  | { status: "unauthenticated" | "invalid" | "unavailable" };

const SYNC_ENDPOINT = "/api/aerocomms/progress/sync";
const RESET_ENDPOINT = "/api/aerocomms/progress/reset";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type AeroCommsLocalSyncEligibility =
  | "ready"
  | "requires_import_confirmation"
  | "owned_by_another_account";

export type AeroCommsBrowserWorkspace = "anonymous" | "account" | "import_anonymous";

export type AeroCommsAuthenticatedWorkspace =
  | "account"
  | "import_anonymous"
  | "foreign"
  | "empty";

/**
 * A browser can retain an account snapshot and a new anonymous workspace at
 * the same time. The anonymous workspace always needs an explicit decision.
 */
export function resolveAeroCommsBrowserWorkspace(
  hasAnonymousProgress: boolean,
  hasAccountSnapshot: boolean,
): AeroCommsBrowserWorkspace {
  if (hasAnonymousProgress) return "import_anonymous";
  return hasAccountSnapshot ? "account" : "anonymous";
}

/**
 * Prevents a browser workspace claimed by one account from becoming visible
 * to another account. Only ownerless durable progress can be imported.
 */
export function resolveAeroCommsAuthenticatedWorkspace(
  localOwnerId: string | null,
  authenticatedUserId: string,
  hasAnonymousProgress: boolean,
  hasAccountSnapshot: boolean,
): AeroCommsAuthenticatedWorkspace {
  if (localOwnerId && localOwnerId !== authenticatedUserId) return "foreign";
  if (localOwnerId === authenticatedUserId) return "account";
  if (hasAnonymousProgress) return "import_anonymous";
  return hasAccountSnapshot ? "account" : "empty";
}

export function getAeroCommsLocalSyncEligibility(
  hasLocalProgress: boolean,
  localOwnerId: string | null,
  authenticatedUserId: string,
): AeroCommsLocalSyncEligibility {
  if (hasLocalProgress && localOwnerId && localOwnerId !== authenticatedUserId) return "owned_by_another_account";
  if (!localOwnerId && hasLocalProgress) return "requires_import_confirmation";
  return "ready";
}

/** A pending anonymous workspace must be resolved by Profile, never imported silently. */
export function shouldShowAeroCommsLocalImportDecision(
  eligibility: AeroCommsLocalSyncEligibility,
): eligibility is "requires_import_confirmation" {
  return eligibility === "requires_import_confirmation";
}

export type AeroCommsLocalImportAction = "import" | "start_from_zero" | "cancel";

export type AeroCommsLocalImportActionPlan = {
  dismissDecision: true;
  confirmLocalImport: boolean;
  resetProgress: boolean;
};

/** Maps Profile's explicit choice without allowing cancellation to mutate progress. */
export function resolveAeroCommsLocalImportAction(
  action: AeroCommsLocalImportAction,
): AeroCommsLocalImportActionPlan {
  switch (action) {
    case "import":
      return { dismissDecision: true, confirmLocalImport: true, resetProgress: false };
    case "start_from_zero":
      return { dismissDecision: true, confirmLocalImport: false, resetProgress: true };
    case "cancel":
      return { dismissDecision: true, confirmLocalImport: false, resetProgress: false };
  }
}

/**
 * Sends a bounded, already-normalized batch. The caller owns the operation ID
 * so a retry uses the same idempotency key until Supabase confirms it.
 */
export async function postAeroCommsProgressSync(
  payload: AeroCommsPersistencePayload,
): Promise<AeroCommsProgressSyncResult> {
  try {
    const response = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (response.status === 401) return { status: "unauthenticated" };
    if (response.status === 400 || response.status === 413) return { status: "invalid" };
    if (!response.ok) return { status: "unavailable" };

    const body: unknown = await response.json();
    if (!isRecord(body) || body.ok !== true || !("snapshot" in body)) return { status: "unavailable" };

    return { status: "synced", snapshot: body.snapshot };
  } catch {
    return { status: "unavailable" };
  }
}

/** Persists an explicit user-requested reset without exposing any account identifier. */
export async function postAeroCommsProgressReset(operationId: string): Promise<AeroCommsProgressSyncResult> {
  try {
    const response = await fetch(RESET_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operationId }),
      keepalive: true,
    });
    if (response.status === 401) return { status: "unauthenticated" };
    if (response.status === 400 || response.status === 413) return { status: "invalid" };
    if (!response.ok) return { status: "unavailable" };

    const body: unknown = await response.json();
    if (!isRecord(body) || body.ok !== true || !("snapshot" in body)) return { status: "unavailable" };
    return { status: "synced", snapshot: body.snapshot };
  } catch {
    return { status: "unavailable" };
  }
}
