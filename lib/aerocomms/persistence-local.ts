import type { SessionRecord } from "./appState";
import type { AeroCommsPersistencePayload } from "./persistence-contract";

export const AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY = "aerocomms.v2.sync-outbox";
export const AEROCOMMS_SYNC_INTENT_STORAGE_KEY = "aerocomms.v2.sync-intent";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type AeroCommsOutboxEntry = {
  ownerId: string | null;
  session: SessionRecord;
};

export type AeroCommsPendingSyncIntent = {
  kind: "sync";
  ownerId: string;
  payload: AeroCommsPersistencePayload;
  importConfirmed: boolean;
  baselineOutboxSessionIds?: string[];
};

export type AeroCommsPendingResetIntent = {
  kind: "reset";
  ownerId: string;
  operationId: string;
};

export type AeroCommsPersistenceIntent = AeroCommsPendingSyncIntent | AeroCommsPendingResetIntent;

// A value in memory is an overlay, not merely a fallback: Safari and quota
// failures can still allow reads while rejecting a newer write.
const memoryStorage = new Map<string, string | null>();

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson(key: string, storage?: StorageLike): unknown {
  if (memoryStorage.has(key)) {
    const value = memoryStorage.get(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
  const target = resolveStorage(storage);
  try {
    const value = target?.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    const value = memoryStorage.get(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
}

function writeJson(key: string, value: unknown, storage?: StorageLike): void {
  const serialized = JSON.stringify(value);
  const target = resolveStorage(storage);
  try {
    if (target) {
      target.setItem(key, serialized);
      memoryStorage.delete(key);
    } else {
      memoryStorage.set(key, serialized);
    }
  } catch {
    memoryStorage.set(key, serialized);
  }
}

function removeValue(key: string, storage?: StorageLike): void {
  const target = resolveStorage(storage);
  try {
    if (target) target.removeItem(key);
    memoryStorage.delete(key);
  } catch {
    // Mask a stale durable value until a later successful storage operation.
    memoryStorage.set(key, null);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The outbox crosses a durable storage boundary. Keep only the primitive
 * session contract needed to merge progress and retry synchronization.
 */
function toPersistableSessionRecord(value: SessionRecord): SessionRecord | null {
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.detail !== "string" ||
    typeof value.at !== "number" ||
    !Number.isFinite(value.at)
  ) return null;

  const score = typeof value.score === "number" && Number.isFinite(value.score) && value.score >= 0 && value.score <= 100
    ? value.score
    : undefined;
  const isScored = value.isScored === true && score !== undefined;
  const stars = typeof value.stars === "number" && Number.isInteger(value.stars) && value.stars >= 0 && value.stars <= 3
    ? value.stars
    : undefined;

  return {
    id: value.id,
    name: value.name,
    detail: value.detail,
    at: value.at,
    isScored,
    ...(score !== undefined ? { score } : {}),
    ...(value.source === "train" || value.source === "atc-mission" ? { source: value.source } : {}),
    ...(typeof value.missionId === "string" ? { missionId: value.missionId } : {}),
    ...(typeof value.exerciseId === "string" ? { exerciseId: value.exerciseId } : {}),
    ...(typeof value.level === "string" ? { level: value.level } : {}),
    ...(stars !== undefined ? { stars } : {}),
  };
}

function isSessionRecord(value: unknown): value is SessionRecord {
  return isRecord(value) && toPersistableSessionRecord(value as SessionRecord) !== null;
}

function isOutboxEntry(value: unknown): value is AeroCommsOutboxEntry {
  return isRecord(value) && (value.ownerId === null || typeof value.ownerId === "string") && isSessionRecord(value.session);
}

export function readAeroCommsSyncOutbox(storage?: StorageLike): AeroCommsOutboxEntry[] {
  const value = readJson(AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY, storage);
  return Array.isArray(value) ? value.filter(isOutboxEntry) : [];
}

export function appendAeroCommsSyncOutbox(
  entry: AeroCommsOutboxEntry,
  storage?: StorageLike,
): AeroCommsOutboxEntry[] {
  const existing = readAeroCommsSyncOutbox(storage);
  const session = toPersistableSessionRecord(entry.session);
  const ownerId = entry.ownerId === null || typeof entry.ownerId === "string" ? entry.ownerId : null;
  if (!session) return existing;
  if (existing.some((item) => item.ownerId === ownerId && item.session.id === session.id)) {
    return existing;
  }
  const next = [...existing, { ownerId, session }];
  writeJson(AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY, next, storage);
  return next;
}

export function getAeroCommsOutboxSessions(
  ownerId: string,
  includeAnonymous: boolean,
  storage?: StorageLike,
): SessionRecord[] {
  return readAeroCommsSyncOutbox(storage)
    .filter((entry) => entry.ownerId === ownerId || (includeAnonymous && entry.ownerId === null))
    .map((entry) => entry.session);
}

export function acknowledgeAeroCommsOutboxSessions(
  ownerId: string,
  sessionIds: readonly string[],
  storage?: StorageLike,
): void {
  const acknowledged = new Set(sessionIds);
  const next = readAeroCommsSyncOutbox(storage).filter((entry) => {
    if (entry.ownerId !== ownerId && entry.ownerId !== null) return true;
    return !acknowledged.has(entry.session.id);
  });
  if (next.length === 0) removeValue(AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY, storage);
  else writeJson(AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY, next, storage);
}

export function removeAeroCommsLocalProgress(ownerId: string | null, storage?: StorageLike): void {
  const next = readAeroCommsSyncOutbox(storage).filter((entry) => entry.ownerId !== ownerId);
  if (next.length === 0) removeValue(AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY, storage);
  else writeJson(AEROCOMMS_SYNC_OUTBOX_STORAGE_KEY, next, storage);
}

function isPendingSyncIntent(value: unknown): value is AeroCommsPendingSyncIntent {
  return isRecord(value) && value.kind === "sync" && typeof value.ownerId === "string" &&
    typeof value.importConfirmed === "boolean" && isRecord(value.payload) && typeof value.payload.operationId === "string" &&
    (value.baselineOutboxSessionIds === undefined ||
      Array.isArray(value.baselineOutboxSessionIds) && value.baselineOutboxSessionIds.every((id) => typeof id === "string"));
}

function isPendingResetIntent(value: unknown): value is AeroCommsPendingResetIntent {
  return isRecord(value) && value.kind === "reset" && typeof value.ownerId === "string" && typeof value.operationId === "string";
}

export function readAeroCommsPersistenceIntent(storage?: StorageLike): AeroCommsPersistenceIntent | null {
  const value = readJson(AEROCOMMS_SYNC_INTENT_STORAGE_KEY, storage);
  return isPendingSyncIntent(value) || isPendingResetIntent(value) ? value : null;
}

export function writeAeroCommsPersistenceIntent(intent: AeroCommsPersistenceIntent, storage?: StorageLike): void {
  writeJson(AEROCOMMS_SYNC_INTENT_STORAGE_KEY, intent, storage);
}

export function clearAeroCommsPersistenceIntent(storage?: StorageLike): void {
  removeValue(AEROCOMMS_SYNC_INTENT_STORAGE_KEY, storage);
}

/** Only for deterministic tests of the restricted-storage fallback. */
export function clearAeroCommsPersistenceMemoryFallback(): void {
  memoryStorage.clear();
}
