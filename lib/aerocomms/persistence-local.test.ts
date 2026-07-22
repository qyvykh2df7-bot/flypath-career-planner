import { beforeEach, describe, expect, it } from "vitest";
import {
  acknowledgeAeroCommsOutboxSessions,
  appendAeroCommsSyncOutbox,
  clearAeroCommsPersistenceIntent,
  clearAeroCommsPersistenceMemoryFallback,
  getAeroCommsOutboxSessions,
  readAeroCommsPersistenceIntent,
  writeAeroCommsPersistenceIntent,
} from "./persistence-local";
import { AEROCOMMS_CONTENT_VERSION, AEROCOMMS_PERSISTENCE_SCHEMA_VERSION } from "./persistence-contract";
import type { SessionRecord } from "./appState";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function createStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

function session(index: number) {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: `Exercise ${index}`,
    detail: "Training",
    at: 1_784_351_200_000 + index,
    source: "train" as const,
    exerciseId: "cadet.cadet-basics.intro-to-atc",
    isScored: false,
  };
}

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

describe("AeroComms local persistence operations", () => {
  beforeEach(() => clearAeroCommsPersistenceMemoryFallback());

  it("keeps more than the 20 visual history entries until each session is acknowledged", () => {
    const storage = createStorage();
    for (let index = 1; index <= 25; index += 1) {
      appendAeroCommsSyncOutbox({ ownerId: "account-a", session: session(index) }, storage);
    }

    expect(getAeroCommsOutboxSessions("account-a", false, storage)).toHaveLength(25);
    acknowledgeAeroCommsOutboxSessions("account-a", Array.from({ length: 20 }, (_, index) => session(index + 1).id), storage);
    expect(getAeroCommsOutboxSessions("account-a", false, storage)).toEqual([
      session(21), session(22), session(23), session(24), session(25),
    ]);
  });

  it("persists confirmed import intent so a retry keeps the same operation and consent", () => {
    const storage = createStorage();
    writeAeroCommsPersistenceIntent({ kind: "sync", ownerId: "account-a", payload, importConfirmed: true }, storage);

    expect(readAeroCommsPersistenceIntent(storage)).toEqual({
      kind: "sync", ownerId: "account-a", payload, importConfirmed: true,
    });
  });

  it("persists a reset intent across a reload boundary", () => {
    const storage = createStorage();
    writeAeroCommsPersistenceIntent({
      kind: "reset",
      ownerId: "account-a",
      operationId: "7d9e4c3d-a148-44c6-a1d8-4d54f7c81c99",
    }, storage);

    expect(readAeroCommsPersistenceIntent(storage)).toEqual({
      kind: "reset",
      ownerId: "account-a",
      operationId: "7d9e4c3d-a148-44c6-a1d8-4d54f7c81c99",
    });
  });

  it("keeps outbox ownership separate and falls back to memory when storage is restricted", () => {
    const restrictedStorage: StorageLike = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    appendAeroCommsSyncOutbox({ ownerId: "account-a", session: session(1) }, restrictedStorage);
    appendAeroCommsSyncOutbox({ ownerId: "account-b", session: session(2) }, restrictedStorage);

    expect(getAeroCommsOutboxSessions("account-a", false, restrictedStorage)).toEqual([session(1)]);
    expect(getAeroCommsOutboxSessions("account-b", false, restrictedStorage)).toEqual([session(2)]);
  });

  it("persists only the primitive session contract when a caller supplies a cyclic value", () => {
    const storage = createStorage();
    const cyclicScore: { self?: unknown } = {};
    cyclicScore.self = cyclicScore;
    const malformedSession = {
      ...session(1),
      isScored: true,
      score: cyclicScore,
    } as unknown as SessionRecord;

    expect(() => appendAeroCommsSyncOutbox({ ownerId: "account-a", session: malformedSession }, storage)).not.toThrow();
    expect(getAeroCommsOutboxSessions("account-a", false, storage)).toEqual([
      expect.objectContaining({
        id: session(1).id,
        isScored: false,
      }),
    ]);
    expect(getAeroCommsOutboxSessions("account-a", false, storage)[0]).not.toHaveProperty("score");
  });

  it("does not let a second account send the first account's sessions after logout", () => {
    const storage = createStorage();
    appendAeroCommsSyncOutbox({ ownerId: "account-a", session: session(1) }, storage);
    // A new anonymous session remains ownerless and may later be presented for
    // an explicit import, but it cannot include Account A's queued work.
    appendAeroCommsSyncOutbox({ ownerId: null, session: session(2) }, storage);

    expect(getAeroCommsOutboxSessions("account-b", false, storage)).toEqual([]);
    expect(getAeroCommsOutboxSessions("account-b", true, storage)).toEqual([session(2)]);
    expect(getAeroCommsOutboxSessions("account-a", false, storage)).toEqual([session(1)]);

    acknowledgeAeroCommsOutboxSessions("account-b", [session(2).id], storage);
    expect(getAeroCommsOutboxSessions("account-a", false, storage)).toEqual([session(1)]);
  });

  it("prefers a newer memory overlay when storage can read an older value but cannot write", () => {
    const storedIntent = { kind: "reset" as const, ownerId: "account-a", operationId: "7d9e4c3d-a148-44c6-a1d8-4d54f7c81c99" };
    const newerIntent = { kind: "sync" as const, ownerId: "account-a", payload, importConfirmed: true };
    const values = new Map<string, string>([["aerocomms.v2.sync-intent", JSON.stringify(storedIntent)]]);
    const partialStorage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: () => { throw new Error("quota exceeded"); },
      removeItem: (key) => { values.delete(key); },
    };

    writeAeroCommsPersistenceIntent(newerIntent, partialStorage);

    expect(readAeroCommsPersistenceIntent(partialStorage)).toEqual(newerIntent);
  });

  it("masks a stale durable value when removal is blocked and recovers on a later write", () => {
    const oldIntent = { kind: "reset" as const, ownerId: "account-a", operationId: "7d9e4c3d-a148-44c6-a1d8-4d54f7c81c99" };
    const replacementIntent = { kind: "sync" as const, ownerId: "account-a", payload, importConfirmed: false };
    const values = new Map<string, string>([["aerocomms.v2.sync-intent", JSON.stringify(oldIntent)]]);
    const removalBlocked: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: () => { throw new Error("blocked"); },
    };

    clearAeroCommsPersistenceIntent(removalBlocked);
    expect(readAeroCommsPersistenceIntent(removalBlocked)).toBeNull();

    writeAeroCommsPersistenceIntent(replacementIntent, removalBlocked);
    expect(readAeroCommsPersistenceIntent(removalBlocked)).toEqual(replacementIntent);
  });
});
