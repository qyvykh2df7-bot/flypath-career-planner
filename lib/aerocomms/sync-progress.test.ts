import { describe, expect, it } from "vitest";

import {
  AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION,
  createAeroCommsSyncProgress,
  isValidAeroCommsSyncProgress,
  readAeroCommsSyncProgress,
  serializeAeroCommsSyncProgress,
  type AeroCommsSyncProgress,
} from "./sync-progress";

const legacyLocalState = {
  name: "Pilot",
  subscription: "pro",
  notifications: true,
  completedExercises: ["lesson-1", "lesson-1", "lesson-2"],
  completedMissions: ["mission-1"],
  missionResults: {
    "mission-1": {
      bestScore: 92,
      bestStars: 3,
      attempts: 2,
      completedAt: "2026-07-17T10:00:00.000Z",
      lastAttemptAt: "2026-07-17T11:00:00.000Z",
      level: "Cadet",
    },
  },
  history: [
    {
      id: "scored-session",
      score: 88,
      at: 1721200000000,
      isScored: true,
      source: "train",
      exerciseId: "lesson-1",
      detail: "Sensitive UI text",
    },
    { id: "completion-only", at: 1721200000001, isScored: false, audio: "blob" },
  ],
  accuracy: 88,
  scoredCount: 1,
  sessionsCount: 2,
  streakDays: 1,
  lastSessionAt: "2026-07-17",
  skills: { listening: 88, readbacks: 0, phraseology: 0, speaking: 0, confidence: 0 },
};

function cloneLegacy(overrides: Record<string, unknown> = {}) {
  return { ...legacyLocalState, ...overrides };
}

describe("AeroComms sync progress contract", () => {
  it("prepara únicamente progreso persistente real y versionado", () => {
    const progress = createAeroCommsSyncProgress(legacyLocalState);

    expect(progress).toMatchObject({
      schemaVersion: AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION,
      completedExerciseIds: ["lesson-1", "lesson-2"],
      completedMissionIds: ["mission-1"],
      scoredSessions: [{ id: "scored-session", score: 88, occurredAt: 1721200000000 }],
    });
    expect(JSON.stringify(progress)).not.toContain("subscription");
    expect(JSON.stringify(progress)).not.toContain("Sensitive UI text");
    expect(JSON.stringify(progress)).not.toContain("audio");
  });

  it("lee el blob local actual como una versión legacy sin escribir ni perder progreso válido", () => {
    const result = readAeroCommsSyncProgress(JSON.stringify(legacyLocalState));

    expect(result.status).toBe("legacy");
    if (result.status === "legacy") {
      expect(result.progress.missionResults["mission-1"].bestScore).toBe(92);
      expect(result.progress.progress.skills.listening).toBe(88);
    }
  });

  it("descarta misiones y sesiones corruptas sin inventar puntuaciones, estrellas o intentos", () => {
    const progress = createAeroCommsSyncProgress(cloneLegacy({
      missionResults: {
        valid: legacyLocalState.missionResults["mission-1"],
        nan: { ...legacyLocalState.missionResults["mission-1"], bestScore: Number.NaN },
        infinite: { ...legacyLocalState.missionResults["mission-1"], bestStars: Infinity },
        string: { ...legacyLocalState.missionResults["mission-1"], attempts: "2" },
        negative: { ...legacyLocalState.missionResults["mission-1"], bestScore: -1 },
        outOfRange: { ...legacyLocalState.missionResults["mission-1"], bestStars: 4 },
        partial: { bestScore: 80 },
      },
      history: [
        legacyLocalState.history[0],
        { id: "nan", score: Number.NaN, at: 1, isScored: true },
        { id: "infinite", score: Infinity, at: 1, isScored: true },
        { id: "string", score: "88", at: 1, isScored: true },
        { id: "negative", score: -1, at: 1, isScored: true },
        { id: "out-of-range", score: 101, at: 1, isScored: true },
        { id: "bad-stars", score: 80, stars: 4, at: 1, isScored: true },
        { id: "bad-time", score: 80, at: -1, isScored: true },
        { score: 80, at: 1, isScored: true },
      ],
      completedExercises: ["lesson-1", 7, "", null, "lesson-1"],
      completedMissions: ["mission-1", {}, ""],
    }));

    expect(progress?.missionResults).toEqual({ valid: {
      missionId: "valid",
      bestScore: 92,
      bestStars: 3,
      attempts: 2,
      completedAt: "2026-07-17T10:00:00.000Z",
      lastAttemptAt: "2026-07-17T11:00:00.000Z",
      level: "Cadet",
    } });
    expect(progress?.scoredSessions).toEqual([
      { id: "scored-session", score: 88, occurredAt: 1721200000000, source: "train", exerciseId: "lesson-1" },
      { id: "bad-stars", score: 80, occurredAt: 1 },
    ]);
    expect(progress?.completedExerciseIds).toEqual(["lesson-1"]);
    expect(progress?.completedMissionIds).toEqual(["mission-1"]);
  });

  it("rechaza un blob legacy cuando sus métricas obligatorias son corruptas o parciales", () => {
    const invalidMetrics = [
      { accuracy: Number.NaN },
      { accuracy: Infinity },
      { accuracy: "88" },
      { accuracy: -1 },
      { accuracy: 101 },
      { scoredCount: -1 },
      { sessionsCount: 100001 },
      { streakDays: "1" },
      { lastSessionAt: "not-a-date" },
      { skills: { ...legacyLocalState.skills, listening: -1 } },
      { skills: { listening: 88 } },
      { skills: [] },
    ];

    for (const override of invalidMetrics) {
      expect(createAeroCommsSyncProgress(cloneLegacy(override))).toBeNull();
      expect(readAeroCommsSyncProgress(cloneLegacy(override))).toEqual({ status: "invalid" });
    }
  });

  it("mantiene un contrato v1 válido en un round-trip sin reinterpretarlo como legacy", () => {
    const current: AeroCommsSyncProgress = {
      schemaVersion: AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION,
      completedExerciseIds: ["lesson-1", "lesson-2"],
      completedMissionIds: ["mission-1"],
      missionResults: {
        "mission-1": {
          missionId: "mission-1",
          bestScore: 92,
          bestStars: 3,
          attempts: 2,
          completedAt: "2026-07-17T10:00:00.000Z",
          lastAttemptAt: "2026-07-17T11:00:00.000Z",
          level: "Cadet",
        },
      },
      scoredSessions: [{
        id: "scored-session",
        score: 88,
        occurredAt: 1721200000000,
        source: "train",
        exerciseId: "lesson-1",
        stars: 3,
      }],
      progress: {
        accuracy: 88,
        scoredCount: 1,
        sessionsCount: 2,
        streakDays: 1,
        lastSessionAt: "2026-07-17",
        skills: { listening: 88, readbacks: 0, phraseology: 0, speaking: 0, confidence: 0 },
      },
    };

    const serialized = serializeAeroCommsSyncProgress(current);
    const result = readAeroCommsSyncProgress(serialized);

    expect(isValidAeroCommsSyncProgress(current)).toBe(true);
    expect(result).toEqual({ status: "current", progress: current });
    expect(JSON.parse(serialized)).toEqual(current);
  });

  it("serializa legacy válido y rechaza contratos actuales alterados", () => {
    const serialized = serializeAeroCommsSyncProgress(legacyLocalState);
    const parsed = JSON.parse(serialized) as unknown;

    expect(isValidAeroCommsSyncProgress(parsed)).toBe(true);
    expect(readAeroCommsSyncProgress(serialized)).toMatchObject({ status: "current" });
    expect(() => serializeAeroCommsSyncProgress({ schemaVersion: 1, completedExerciseIds: [] })).toThrow(
      "Invalid AeroComms sync progress contract",
    );
  });

  it("rechaza formatos corruptos o contratos actuales alterados", () => {
    expect(readAeroCommsSyncProgress("not-json")).toEqual({ status: "invalid" });
    expect(readAeroCommsSyncProgress({ schemaVersion: 1, completedExerciseIds: [] })).toEqual({
      status: "invalid",
    });
  });
});
