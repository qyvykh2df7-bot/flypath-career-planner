import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AEROCOMMS_CONTENT_VERSION,
  AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
} from "./persistence-contract";
import {
  getAeroCommsLocalSyncEligibility,
  postAeroCommsProgressReset,
  postAeroCommsProgressSync,
  resolveAeroCommsAuthenticatedWorkspace,
  resolveAeroCommsBrowserWorkspace,
  resolveAeroCommsLocalImportAction,
  shouldShowAeroCommsLocalImportDecision,
} from "./persistence-client";

const payload = {
  operationId: "6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99",
  schemaVersion: AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
  contentVersion: AEROCOMMS_CONTENT_VERSION,
  completedExerciseIds: [],
  missions: [],
  skillStats: [],
  sessions: [],
  summary: { accuracy: null, scoreSum: 0, sessionCount: 0, scoredSessionCount: 0, legacyStreakDays: 0, legacyLastActivityDate: null },
};

describe("AeroComms progress sync transport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts only the supplied normalized payload and returns the canonical snapshot", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, snapshot: { schemaVersion: 1 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postAeroCommsProgressSync(payload)).resolves.toEqual({ status: "synced", snapshot: { schemaVersion: 1 } });
    expect(fetchMock).toHaveBeenCalledWith("/api/aerocomms/progress/sync", expect.objectContaining({
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }));
  });

  it("does not treat an unauthenticated, invalid, or unavailable response as a successful sync", async () => {
    for (const [status, expected] of [[401, "unauthenticated"], [400, "invalid"], [503, "unavailable"]] as const) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
      await expect(postAeroCommsProgressSync(payload)).resolves.toEqual({ status: expected });
    }
  });

  it("requires an explicit Profile decision when anonymous progress is present after login", () => {
    const eligibility = getAeroCommsLocalSyncEligibility(true, null, "account-a");

    expect(eligibility).toBe("requires_import_confirmation");
    expect(shouldShowAeroCommsLocalImportDecision(eligibility)).toBe(true);
    expect(shouldShowAeroCommsLocalImportDecision("ready")).toBe(false);
    expect(getAeroCommsLocalSyncEligibility(true, "account-a", "account-b")).toBe("owned_by_another_account");
    expect(getAeroCommsLocalSyncEligibility(false, "account-a", "account-b")).toBe("ready");
    expect(getAeroCommsLocalSyncEligibility(false, null, "account-a")).toBe("ready");
    expect(getAeroCommsLocalSyncEligibility(true, "account-a", "account-a")).toBe("ready");
  });

  it("maps Profile's explicit import choices without mutating progress on cancellation", () => {
    expect(resolveAeroCommsLocalImportAction("import")).toEqual({
      dismissDecision: true,
      confirmLocalImport: true,
      resetProgress: false,
    });
    expect(resolveAeroCommsLocalImportAction("start_from_zero")).toEqual({
      dismissDecision: true,
      confirmLocalImport: false,
      resetProgress: true,
    });
    expect(resolveAeroCommsLocalImportAction("cancel")).toEqual({
      dismissDecision: true,
      confirmLocalImport: false,
      resetProgress: false,
    });
  });

  it("keeps a new anonymous workspace importable after an account snapshot exists", () => {
    expect(resolveAeroCommsBrowserWorkspace(true, true)).toBe("import_anonymous");
    expect(resolveAeroCommsBrowserWorkspace(true, false)).toBe("import_anonymous");
    expect(resolveAeroCommsBrowserWorkspace(false, true)).toBe("account");
    expect(resolveAeroCommsBrowserWorkspace(false, false)).toBe("anonymous");
  });

  it("keeps one account's claimed workspace hidden from another account", () => {
    expect(resolveAeroCommsAuthenticatedWorkspace("account-a", "account-b", true, false)).toBe("foreign");
    expect(resolveAeroCommsAuthenticatedWorkspace("account-a", "account-a", true, false)).toBe("account");
    expect(resolveAeroCommsAuthenticatedWorkspace(null, "account-b", true, false)).toBe("import_anonymous");
    expect(resolveAeroCommsAuthenticatedWorkspace(null, "account-b", false, true)).toBe("account");
    expect(resolveAeroCommsAuthenticatedWorkspace(null, "account-b", false, false)).toBe("empty");
  });

  it("sends a reset as an idempotent operation without any client account identifier", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, snapshot: { schemaVersion: 1 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postAeroCommsProgressReset(payload.operationId)).resolves.toEqual({ status: "synced", snapshot: { schemaVersion: 1 } });
    expect(fetchMock).toHaveBeenCalledWith("/api/aerocomms/progress/reset", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ operationId: payload.operationId }),
    }));
  });
});
