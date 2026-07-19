import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));
import {
  AEROCOMMS_CONTENT_VERSION,
  AEROCOMMS_POSTGRES_INTEGER_MAX,
  createAeroCommsPersistencePayload,
  createLegacyAeroCommsSessionId,
  isAeroCommsUuid,
  normalizeAeroCommsLevelId,
  readAeroCommsRemoteProgressSnapshot,
} from "./persistence-contract";
import { prepareAeroCommsPersistencePayload } from "./persistence-server";

const operationId = "6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99";

function baseState() {
  return {
    completedExercises: ["cadet.lesson.callsigns", "cadet.lesson.callsigns"],
    missionResults: {
      "rfr-busy-circuit-recovery": {
        missionId: "rfr-busy-circuit-recovery",
        level: "rfr",
        score: 82,
        bestScore: 89,
        stars: 2,
        bestStars: 3,
        attempts: 2,
        completedAt: "2026-07-17T08:00:00.000Z",
        lastAttemptAt: "2026-07-17T09:00:00.000Z",
      },
    },
    history: [
      {
        id: "legacy-session",
        at: 1_784_351_200_000,
        source: "atc-mission",
        missionId: "rfr-busy-circuit-recovery",
        level: "rfr",
        score: 82,
        stars: 2,
        isScored: true,
      },
    ],
    skillStats: {
      listening: { totalScore: 82, count: 1 },
      readbacks: { totalScore: 82, count: 1 },
      phraseology: { totalScore: 82, count: 1 },
      speaking: { totalScore: 0, count: 0 },
      confidence: { totalScore: 82, count: 1 },
    },
    skills: { listening: 82, readbacks: 82, phraseology: 82, speaking: 0, confidence: 82 },
    accuracy: 82,
    scoreSum: 82,
    sessionsCount: 1,
    scoredCount: 1,
    streakDays: 1,
    lastSessionAt: "2026-07-17",
    subscription: "pro",
    name: "Not synced",
  };
}

describe("AeroComms persistence contract", () => {
  it("normalizes the legacy rfr alias and excludes local-only account data", () => {
    const payload = createAeroCommsPersistencePayload(baseState(), operationId);

    expect(payload).not.toBeNull();
    expect(payload?.contentVersion).toBe(AEROCOMMS_CONTENT_VERSION);
    expect(payload?.missions[0]?.levelId).toBe("ready-for-radio");
    expect(payload?.sessions[0]?.levelId).toBe("ready-for-radio");
    expect(payload?.summary.scoreSum).toBe(82);
    expect(payload).not.toHaveProperty("subscription");
    expect(JSON.stringify(payload)).not.toContain("Not synced");
  });

  it("discards corrupt session and mission records instead of coercing metrics", () => {
    const state = {
      ...baseState(),
      history: [
        { id: "bad-score", at: 1_784_351_200_000, exerciseId: "cadet.lesson.callsigns", score: Number.NaN, isScored: true },
        { id: "bad-time", at: "now", exerciseId: "cadet.lesson.callsigns", isScored: false },
      ],
      missionResults: {
        bad: { missionId: "bad", score: Infinity, bestScore: 0, stars: 0, bestStars: 0, attempts: 1, completedAt: "bad", lastAttemptAt: "bad" },
      },
    };

    const payload = createAeroCommsPersistencePayload(state, operationId);

    expect(payload?.sessions).toEqual([]);
    expect(payload?.missions).toEqual([]);
  });

  it("discards legacy IDs that no longer exist in the current content catalog", () => {
    const state = { ...baseState(), completedExercises: ["obsolete.exercise"] };
    const payload = createAeroCommsPersistencePayload(state, operationId);

    expect(payload?.completedExerciseIds).toEqual([]);
  });

  it("uses a stable UUID for a legacy session identifier", () => {
    const first = createLegacyAeroCommsSessionId("legacy-session");
    const second = createLegacyAeroCommsSessionId("legacy-session");

    expect(first).toBe(second);
    expect(isAeroCommsUuid(first)).toBe(true);
  });

  it("keeps all queued sessions available independently of the 20-item visual history", () => {
    const queuedSessions = Array.from({ length: 25 }, (_, index) => ({
      ...baseState().history[0],
      id: `queued-${index}`,
      at: 1_784_351_200_000 + index,
    }));
    const payload = createAeroCommsPersistencePayload(baseState(), operationId, {
      sessionRecords: queuedSessions,
    });

    expect(payload?.sessions).toHaveLength(25);
    expect(new Set(payload?.sessions.map((session) => session.clientSessionId)).size).toBe(25);
  });

  it("deduplicates overlapping history and outbox sessions before the server boundary", () => {
    const sharedSession = { ...baseState().history[0], at: Date.parse("2026-07-17T10:00:00.000Z") };
    const payload = createAeroCommsPersistencePayload(baseState(), operationId, {
      sessionRecords: [sharedSession, sharedSession],
    });

    expect(payload?.sessions).toHaveLength(1);
    expect(() => prepareAeroCommsPersistencePayload(payload)).not.toThrow();
  });

  it("accepts only canonical level IDs after normalizing the one legacy alias", () => {
    expect(normalizeAeroCommsLevelId("rfr")).toBe("ready-for-radio");
    expect(normalizeAeroCommsLevelId("ready-for-radio")).toBe("ready-for-radio");
    expect(normalizeAeroCommsLevelId("Ready for Radio")).toBeNull();
  });

  it("rejects values that fit JavaScript but not PostgreSQL integers", () => {
    const state = {
      ...baseState(),
      skillStats: {
        ...baseState().skillStats,
        listening: { totalScore: AEROCOMMS_POSTGRES_INTEGER_MAX + 1, count: 1 },
      },
    };
    const payload = createAeroCommsPersistencePayload(state, operationId);

    expect(payload?.skillStats.some((stat) => stat.skillId === "listening")).toBe(false);
  });

  it("requires the reset marker in canonical remote snapshots", () => {
    const baseSnapshot = {
      schemaVersion: 1,
      contentVersion: AEROCOMMS_CONTENT_VERSION,
      summary: {
        accuracy: null,
        scoreSum: 0,
        sessionCount: 0,
        scoredSessionCount: 0,
        streakDays: 0,
        lastActivityAt: null,
        lastActivityDate: null,
        activityTimezone: null,
        legacyImportedAt: null,
      },
      completedExerciseIds: [],
      missions: [],
      skillStats: [],
      sessions: [],
    };

    expect(readAeroCommsRemoteProgressSnapshot(baseSnapshot)).toBeNull();
    expect(readAeroCommsRemoteProgressSnapshot({
      ...baseSnapshot,
      summary: { ...baseSnapshot.summary, resetAt: "2026-07-17T10:00:00.000Z" },
    })?.summary.resetAt).toBe("2026-07-17T10:00:00.000Z");
  });

  it("retains an exact score sum for deterministic future merges", () => {
    const payload = createAeroCommsPersistencePayload({
      ...baseState(),
      accuracy: 50,
      scoreSum: 148,
      scoredCount: 3,
    }, operationId);

    expect(payload?.summary).toMatchObject({ accuracy: 50, scoreSum: 148, scoredSessionCount: 3 });
  });
});
