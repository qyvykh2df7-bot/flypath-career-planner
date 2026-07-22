import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));
import {
  AEROCOMMS_CONTENT_VERSION,
  AEROCOMMS_POSTGRES_INTEGER_MAX,
  AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
} from "./persistence-contract";
import {
  AeroCommsPersistencePayloadError,
  prepareAeroCommsPersistencePayload,
} from "./persistence-server";
import { RETIRED_AEROCOMMS_EXERCISE_IDS } from "./retired-content";

const operationId = "a0bbdd1b-b39f-4895-8bd1-1bce55f6a7f1";
const sessionId = "b0bbdd1b-b39f-4895-8bd1-1bce55f6a7f1";

function payload() {
  return {
    operationId,
    schemaVersion: AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
    contentVersion: AEROCOMMS_CONTENT_VERSION,
    completedExerciseIds: [],
    missions: [],
    skillStats: [],
    sessions: [{
      clientSessionId: sessionId,
      activityType: "mission",
      source: "atc-mission",
      missionId: "rfr-busy-circuit-recovery",
      levelId: "rfr",
      score: 80,
      stars: 2,
      isScored: true,
      occurredAt: "2026-07-17T10:00:00.000Z",
      activityDate: "ignored-by-server",
      activityTimezone: "Europe/Dublin",
    }],
    summary: {
      accuracy: 80,
      scoreSum: 80,
      sessionCount: 1,
      scoredSessionCount: 1,
      legacyStreakDays: 1,
      legacyLastActivityDate: "2026-07-17",
    },
  };
}

describe("AeroComms server persistence boundary", () => {
  it("validates catalog IDs server-side and normalizes the legacy rfr alias", () => {
    const prepared = prepareAeroCommsPersistencePayload(payload());

    expect(prepared.payload.sessions[0]).toMatchObject({
      mission_id: "rfr-busy-circuit-recovery",
      level_id: "ready-for-radio",
      activity_date: "2026-07-17",
      skill_ids: ["listening", "readbacks", "phraseology", "confidence"],
    });
  });

  it("rejects unknown content, malformed UUIDs, unbounded fields, and untrusted metadata", () => {
    const invalidMission = payload();
    invalidMission.sessions[0].missionId = "not-a-real-mission";
    expect(() => prepareAeroCommsPersistencePayload(invalidMission)).toThrow(AeroCommsPersistencePayloadError);

    const invalidUuid = payload();
    invalidUuid.operationId = "not-a-uuid";
    expect(() => prepareAeroCommsPersistencePayload(invalidUuid)).toThrow(AeroCommsPersistencePayloadError);

    const unknownField = payload() as Record<string, unknown>;
    unknownField.email = "not-allowed@example.test";
    expect(() => prepareAeroCommsPersistencePayload(unknownField)).toThrow(AeroCommsPersistencePayloadError);

    const clientUserId = payload() as Record<string, unknown>;
    clientUserId.userId = "attacker-controlled";
    expect(() => prepareAeroCommsPersistencePayload(clientUserId)).toThrow(AeroCommsPersistencePayloadError);
  });

  it("does not trust client activity dates or skill axes", () => {
    const candidate = payload();
    candidate.sessions[0].activityDate = "2099-01-01";
    const prepared = prepareAeroCommsPersistencePayload(candidate);

    expect(prepared.payload.sessions[0]?.activity_date).toBe("2026-07-17");
    expect(prepared.payload.sessions[0]?.skill_ids).not.toContain("not-a-skill");
  });

  it("accepts retired exercises only as retained historical training activity", () => {
    const exerciseId = RETIRED_AEROCOMMS_EXERCISE_IDS[0];
    const candidate: unknown = {
      ...payload(),
      completedExerciseIds: [exerciseId],
      sessions: [{
        clientSessionId: sessionId,
        activityType: "exercise",
        source: "train",
        exerciseId,
        levelId: "student-pilot",
        isScored: false,
        occurredAt: "2026-07-17T10:00:00.000Z",
        activityDate: "ignored-by-server",
        activityTimezone: "Europe/Madrid",
      }],
      summary: {
        accuracy: null,
        scoreSum: 0,
        sessionCount: 1,
        scoredSessionCount: 0,
        legacyStreakDays: 1,
        legacyLastActivityDate: "2026-07-17",
      },
    };

    const prepared = prepareAeroCommsPersistencePayload(candidate);

    expect(prepared.payload.completed_exercise_ids).toEqual([exerciseId]);
    expect(prepared.payload.sessions[0]).toMatchObject({ exercise_id: exerciseId, level_id: "student-pilot", skill_ids: [] });
  });

  it("rejects numeric values beyond PostgreSQL integer capacity", () => {
    const candidate = {
      ...payload(),
      skillStats: [{ skillId: "listening", scoreSum: AEROCOMMS_POSTGRES_INTEGER_MAX + 1, scoredCount: 1 }],
    };

    expect(() => prepareAeroCommsPersistencePayload(candidate)).toThrow(AeroCommsPersistencePayloadError);
  });
});
