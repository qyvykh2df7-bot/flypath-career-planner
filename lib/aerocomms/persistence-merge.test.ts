import { describe, expect, it } from "vitest";
import { mergeAeroCommsRemoteProgress } from "./persistence-merge";
import type { AppState } from "./appState";
import type { AeroCommsRemoteProgressSnapshot } from "./persistence-contract";

const localState: AppState = {
  onboarded: true,
  name: "Pilot",
  experience: null,
  goal: null,
  dailyGoal: "10 min/day",
  subscription: "free",
  difficulty: "Normal",
  notifications: true,
  skills: { listening: 0, readbacks: 0, phraseology: 0, speaking: 0, confidence: 0 },
  skillStats: {
    listening: { totalScore: 0, count: 0 }, readbacks: { totalScore: 0, count: 0 }, phraseology: { totalScore: 0, count: 0 }, speaking: { totalScore: 0, count: 0 }, confidence: { totalScore: 0, count: 0 },
  },
  streakDays: 0, accuracy: 0, scoreSum: 0, sessionsCount: 0, scoredCount: 0, minutesToday: 0, lastSessionAt: null,
  completedExercises: [], history: [], moduleProgress: {}, completedMissions: [], missionResults: {},
};

const snapshot: AeroCommsRemoteProgressSnapshot = {
  schemaVersion: 1,
  contentVersion: "2026.07",
  summary: { accuracy: 80, scoreSum: 80, sessionCount: 1, scoredSessionCount: 1, streakDays: 1, lastActivityAt: "2026-07-17T10:00:00.000Z", lastActivityDate: "2026-07-17", activityTimezone: "Europe/Dublin", legacyImportedAt: null, resetAt: null },
  completedExerciseIds: ["cadet.cadet-basics.intro-to-atc"],
  missions: [],
  skillStats: [{ skillId: "listening", scoreSum: 80, scoredCount: 1 }],
  sessions: [{ clientSessionId: "6d9e4c3d-a148-44c6-a1d8-4d54f7c81c99", activityType: "exercise", source: "train", exerciseId: "cadet.cadet-basics.intro-to-atc", levelId: "cadet", score: 80, isScored: true, occurredAt: "2026-07-17T10:00:00.000Z", activityDate: "2026-07-17", activityTimezone: "Europe/Dublin" }],
};

describe("AeroComms remote progress merge", () => {
  it("merges only durable progress and preserves local-only access and settings", () => {
    const merged = mergeAeroCommsRemoteProgress(localState, snapshot);

    expect(merged.subscription).toBe("free");
    expect(merged.name).toBe("Pilot");
    expect(merged.completedExercises).toContain("cadet.cadet-basics.intro-to-atc");
    expect(merged.skillStats.listening).toEqual({ totalScore: 80, count: 1 });
    expect(merged.scoreSum).toBe(80);
    expect(merged.history).toHaveLength(1);
  });

  it("does not let pre-reset local data restore a remotely reset account", () => {
    const staleLocal: AppState = {
      ...localState,
      completedExercises: ["cadet.cadet-basics.intro-to-atc"],
      history: [{
        id: "legacy-progress",
        name: "Old exercise",
        detail: "Training",
        at: Date.parse("2026-07-17T09:00:00.000Z"),
        exerciseId: "cadet.cadet-basics.intro-to-atc",
        source: "train",
        isScored: false,
      }],
      sessionsCount: 1,
    };
    const resetSnapshot: AeroCommsRemoteProgressSnapshot = {
      ...snapshot,
      summary: {
        ...snapshot.summary,
        accuracy: null,
        sessionCount: 0,
        scoredSessionCount: 0,
        streakDays: 0,
        lastActivityAt: null,
        lastActivityDate: null,
        resetAt: "2026-07-17T10:00:00.000Z",
      },
      completedExerciseIds: [],
      skillStats: [],
      sessions: [],
    };

    const merged = mergeAeroCommsRemoteProgress(staleLocal, resetSnapshot);

    expect(merged.completedExercises).toEqual([]);
    expect(merged.history).toEqual([]);
    expect(merged.sessionsCount).toBe(0);
  });

  it("uses the exact remote score sum instead of reconstructing it from rounded accuracy", () => {
    const merged = mergeAeroCommsRemoteProgress(localState, {
      ...snapshot,
      summary: { ...snapshot.summary, accuracy: 49, scoreSum: 148, scoredSessionCount: 3, sessionCount: 3 },
    });

    expect(merged.scoreSum).toBe(148);
    expect(merged.accuracy).toBe(49);
    expect(merged.scoredCount).toBe(3);
  });
});
