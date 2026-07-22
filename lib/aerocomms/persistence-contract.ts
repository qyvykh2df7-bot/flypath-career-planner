import { createAeroCommsSyncProgress } from "./sync-progress";
import { findMission } from "./atcSim";
import { findExercise } from "./content";
import { findRetiredAeroCommsExercise } from "./retired-content";

export const AEROCOMMS_PERSISTENCE_SCHEMA_VERSION = 1 as const;
export const AEROCOMMS_CONTENT_VERSION = "2026.07" as const;
export const AEROCOMMS_POSTGRES_INTEGER_MAX = 2_147_483_647;

export const AEROCOMMS_SKILL_IDS = [
  "listening",
  "readbacks",
  "phraseology",
  "speaking",
  "confidence",
] as const;

export type AeroCommsSkillId = (typeof AEROCOMMS_SKILL_IDS)[number];
export type AeroCommsLevelId =
  | "cadet"
  | "student-pilot"
  | "ready-for-radio"
  | "airline-prep"
  | "advanced-ops";

export type AeroCommsPersistenceSession = {
  clientSessionId: string;
  activityType: "exercise" | "mission";
  source: "train" | "atc-mission";
  exerciseId?: string;
  missionId?: string;
  levelId?: AeroCommsLevelId;
  score?: number;
  stars?: number;
  isScored: boolean;
  occurredAt: string;
  activityDate: string;
  activityTimezone: string;
};

export type AeroCommsPersistenceMission = {
  missionId: string;
  levelId?: AeroCommsLevelId;
  bestScore: number;
  lastScore: number;
  bestStars: number;
  lastStars: number;
  attempts: number;
  completedAt: string | null;
  lastAttemptAt: string;
};

export type AeroCommsPersistenceSkillStat = {
  skillId: AeroCommsSkillId;
  scoreSum: number;
  scoredCount: number;
};

export type AeroCommsPersistencePayload = {
  operationId: string;
  schemaVersion: typeof AEROCOMMS_PERSISTENCE_SCHEMA_VERSION;
  contentVersion: typeof AEROCOMMS_CONTENT_VERSION;
  completedExerciseIds: string[];
  missions: AeroCommsPersistenceMission[];
  skillStats: AeroCommsPersistenceSkillStat[];
  sessions: AeroCommsPersistenceSession[];
  summary: {
    accuracy: number | null;
    scoreSum: number;
    sessionCount: number;
    scoredSessionCount: number;
    legacyStreakDays: number;
    legacyLastActivityDate: string | null;
  };
};

export type AeroCommsRemoteProgressSnapshot = {
  schemaVersion: typeof AEROCOMMS_PERSISTENCE_SCHEMA_VERSION;
  contentVersion: typeof AEROCOMMS_CONTENT_VERSION;
  summary: {
    accuracy: number | null;
    scoreSum: number;
    sessionCount: number;
    scoredSessionCount: number;
    streakDays: number;
    lastActivityAt: string | null;
    lastActivityDate: string | null;
    activityTimezone: string | null;
    legacyImportedAt: string | null;
    resetAt: string | null;
  };
  completedExerciseIds: string[];
  missions: Array<{
    missionId: string;
    levelId: AeroCommsLevelId;
    bestScore: number | null;
    lastScore: number | null;
    bestStars: number | null;
    lastStars: number | null;
    attemptCount: number;
    completedAt: string | null;
    lastAttemptAt: string;
  }>;
  skillStats: AeroCommsPersistenceSkillStat[];
  sessions: AeroCommsPersistenceSession[];
};

type LocalSession = {
  id?: unknown;
  at?: unknown;
  source?: unknown;
  missionId?: unknown;
  exerciseId?: unknown;
  level?: unknown;
  score?: unknown;
  stars?: unknown;
  isScored?: unknown;
};

type LocalMissionResult = {
  missionId?: unknown;
  level?: unknown;
  score?: unknown;
  bestScore?: unknown;
  stars?: unknown;
  bestStars?: unknown;
  attempts?: unknown;
  completedAt?: unknown;
  lastAttemptAt?: unknown;
};

type LocalAeroCommsState = {
  completedExercises?: unknown;
  missionResults?: unknown;
  history?: unknown;
  skillStats?: unknown;
  accuracy?: unknown;
  scoreSum?: unknown;
  sessionsCount?: unknown;
  scoredCount?: unknown;
  streakDays?: unknown;
  lastSessionAt?: unknown;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_IDENTIFIER_LENGTH = 160;
const MAX_SESSION_COUNT = 100000;
const MAX_MISSIONS = 100;
const MAX_EXERCISES = 500;
const MAX_SESSIONS = 100;

export function isAeroCommsSkillId(value: unknown): value is AeroCommsSkillId {
  return typeof value === "string" && (AEROCOMMS_SKILL_IDS as readonly string[]).includes(value);
}

export function normalizeAeroCommsLevelId(value: unknown): AeroCommsLevelId | null {
  if (value === "rfr") return "ready-for-radio";
  return value === "cadet" ||
    value === "student-pilot" ||
    value === "ready-for-radio" ||
    value === "airline-prep" ||
    value === "advanced-ops"
    ? value
    : null;
}

export function isAeroCommsUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedInteger(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : null;
}

function safeIdentifier(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_IDENTIFIER_LENGTH
    ? value
    : null;
}

function uniqueIdentifiers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const identifiers = value.map(safeIdentifier);
  return identifiers.some((identifier) => identifier === null)
    ? []
    : [...new Set(identifiers as string[])];
}

function validIsoTimestamp(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function localDateFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function hash32(value: string, seed: number): number {
  let hash = 2166136261 ^ seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Existing local history identifiers predate UUIDs. This deterministic UUID is
 * solely an idempotency key for an already-recorded local activity; it is not a
 * security token and ensures retries do not duplicate legacy session facts.
 */
export function createLegacyAeroCommsSessionId(seed: string): string {
  const blocks = [
    hash32(seed, 1),
    hash32(seed, 2),
    hash32(seed, 3),
    hash32(seed, 4),
  ].map((value) => value.toString(16).padStart(8, "0")).join("");
  const normalized = `${blocks.slice(0, 12)}4${blocks.slice(13, 16)}8${blocks.slice(17, 32)}`;
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
}

export function createAeroCommsClientSessionId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return randomUuid ?? createLegacyAeroCommsSessionId(`${Date.now()}-${Math.random()}`);
}

export function createAeroCommsSyncOperationId(): string {
  return createAeroCommsClientSessionId();
}

function normalizeSession(value: LocalSession, timezone: string): AeroCommsPersistenceSession | null {
  const occurredAt = boundedInteger(value.at, 0, Number.MAX_SAFE_INTEGER);
  if (occurredAt === null) return null;

  const missionId = safeIdentifier(value.missionId);
  const exerciseId = safeIdentifier(value.exerciseId);
  const activityType = missionId ? "mission" : exerciseId ? "exercise" : null;
  if (!activityType) return null;

  const source = activityType === "mission" ? "atc-mission" : "train";
  const score = value.isScored === true ? boundedInteger(value.score, 0, 100) : null;
  if (value.isScored === true && score === null) return null;
  const stars = activityType === "mission" && value.stars !== undefined
    ? boundedInteger(value.stars, 0, 3)
    : null;
  if (activityType === "mission" && value.stars !== undefined && stars === null) return null;

  const rawId = safeIdentifier(value.id);
  const sessionSeed = rawId ?? `${activityType}:${missionId ?? exerciseId}:${occurredAt}`;
  const clientSessionId = isAeroCommsUuid(rawId) ? rawId : createLegacyAeroCommsSessionId(sessionSeed);
  const levelId = normalizeAeroCommsLevelId(value.level);

  return {
    clientSessionId,
    activityType,
    source,
    ...(exerciseId ? { exerciseId } : {}),
    ...(missionId ? { missionId } : {}),
    ...(levelId ? { levelId } : {}),
    ...(score !== null ? { score } : {}),
    ...(stars !== null ? { stars } : {}),
    isScored: value.isScored === true,
    occurredAt: new Date(occurredAt).toISOString(),
    activityDate: localDateFromTimestamp(occurredAt),
    activityTimezone: timezone,
  };
}

function normalizeMission(value: LocalMissionResult): AeroCommsPersistenceMission | null {
  const missionId = safeIdentifier(value.missionId);
  const bestScore = boundedInteger(value.bestScore, 0, 100);
  const lastScore = boundedInteger(value.score, 0, 100);
  const bestStars = boundedInteger(value.bestStars, 0, 3);
  const lastStars = boundedInteger(value.stars, 0, 3);
  const attempts = boundedInteger(value.attempts, 1, MAX_SESSION_COUNT);
  const completedAt = validIsoTimestamp(value.completedAt);
  const lastAttemptAt = validIsoTimestamp(value.lastAttemptAt);
  if (
    !missionId || bestScore === null || lastScore === null || bestStars === null || lastStars === null ||
    attempts === null || !completedAt || !lastAttemptAt
  ) return null;

  const levelId = normalizeAeroCommsLevelId(value.level);
  return {
    missionId,
    ...(levelId ? { levelId } : {}),
    bestScore,
    lastScore,
    bestStars,
    lastStars,
    attempts,
    completedAt,
    lastAttemptAt,
  };
}

function normalizeSkillStats(value: unknown): AeroCommsPersistenceSkillStat[] {
  if (!isRecord(value)) return [];
  return AEROCOMMS_SKILL_IDS.flatMap((skillId) => {
    const stat = value[skillId];
    if (!isRecord(stat)) return [];
    const scoreSum = boundedInteger(stat.totalScore, 0, AEROCOMMS_POSTGRES_INTEGER_MAX);
    const scoredCount = boundedInteger(stat.count, 0, MAX_SESSION_COUNT);
    return scoreSum === null || scoredCount === null ? [] : [{ skillId, scoreSum, scoredCount }];
  });
}

function normalizeRemoteSkillStats(value: unknown): AeroCommsPersistenceSkillStat[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<AeroCommsSkillId>();
  return value.flatMap((entry) => {
    if (!isRecord(entry) || !isAeroCommsSkillId(entry.skillId) || seen.has(entry.skillId)) return [];
    const scoreSum = boundedInteger(entry.scoreSum, 0, AEROCOMMS_POSTGRES_INTEGER_MAX);
    const scoredCount = boundedInteger(entry.scoredCount, 0, MAX_SESSION_COUNT);
    if (scoreSum === null || scoredCount === null) return [];
    seen.add(entry.skillId);
    return [{ skillId: entry.skillId, scoreSum, scoredCount }];
  });
}

/**
 * Produces the bounded, non-sensitive payload accepted by the authenticated
 * progress sync boundary. Invalid entries are discarded rather than coerced.
 */
export function createAeroCommsPersistencePayload(
  value: LocalAeroCommsState,
  operationId: string = createAeroCommsSyncOperationId(),
  options: { sessionRecords?: LocalSession[] } = {},
): AeroCommsPersistencePayload | null {
  if (!isAeroCommsUuid(operationId)) return null;

  const legacy = createAeroCommsSyncProgress(value);
  if (!legacy) return null;
  // Pre-persistence local blobs only retained a rounded accuracy. It is used
  // once as a legacy import baseline; every later remote update uses scoreSum.
  const scoreSum = boundedInteger(
    value.scoreSum ?? legacy.progress.accuracy * legacy.progress.scoredCount,
    0,
    AEROCOMMS_POSTGRES_INTEGER_MAX,
  );
  if (scoreSum === null || scoreSum > legacy.progress.scoredCount * 100) return null;
  const timezone = currentTimezone();
  const rawHistory = options.sessionRecords ?? (Array.isArray(value.history) ? value.history as LocalSession[] : []);
  const seenSessionIds = new Set<string>();
  const sessions = rawHistory.flatMap((entry) => {
    const normalized = normalizeSession(entry, timezone);
    if (!normalized) return [];
    const hasKnownContent = normalized.activityType === "exercise"
      ? Boolean(normalized.exerciseId && (findExercise(normalized.exerciseId) || findRetiredAeroCommsExercise(normalized.exerciseId)))
      : Boolean(normalized.missionId && findMission(normalized.missionId));
    if (!hasKnownContent || seenSessionIds.has(normalized.clientSessionId)) return [];
    seenSessionIds.add(normalized.clientSessionId);
    return [normalized];
  }).slice(0, MAX_SESSIONS);
  const rawMissions = isRecord(value.missionResults) ? Object.values(value.missionResults) as LocalMissionResult[] : [];
  const missions = rawMissions.flatMap((entry) => {
    const normalized = normalizeMission(entry);
    return normalized && findMission(normalized.missionId) ? [normalized] : [];
  }).slice(0, MAX_MISSIONS);

  const latestSession = sessions.reduce<AeroCommsPersistenceSession | null>((latest, session) => {
    return !latest || session.occurredAt > latest.occurredAt ? session : latest;
  }, null);

  return {
    operationId,
    schemaVersion: AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
    contentVersion: AEROCOMMS_CONTENT_VERSION,
    completedExerciseIds: legacy.completedExerciseIds.filter((id) => Boolean(
      findExercise(id) || findRetiredAeroCommsExercise(id),
    )).slice(0, MAX_EXERCISES),
    missions,
    skillStats: normalizeSkillStats(value.skillStats),
    sessions,
    summary: {
      accuracy: legacy.progress.scoredCount > 0 ? legacy.progress.accuracy : null,
      scoreSum,
      sessionCount: legacy.progress.sessionsCount,
      scoredSessionCount: legacy.progress.scoredCount,
      legacyStreakDays: legacy.progress.streakDays,
      legacyLastActivityDate: latestSession?.activityDate ?? null,
    },
  };
}

export function isSafeAeroCommsActivityDate(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

function nullableTimestamp(value: unknown): string | null | undefined {
  if (value === null) return null;
  return validIsoTimestamp(value) ?? undefined;
}

/** Parses only the canonical snapshot returned from the authenticated sync boundary. */
export function readAeroCommsRemoteProgressSnapshot(value: unknown): AeroCommsRemoteProgressSnapshot | null {
  if (!isRecord(value) || value.schemaVersion !== AEROCOMMS_PERSISTENCE_SCHEMA_VERSION ||
    value.contentVersion !== AEROCOMMS_CONTENT_VERSION || !isRecord(value.summary) ||
    !Array.isArray(value.completedExerciseIds) || !Array.isArray(value.missions) ||
    !Array.isArray(value.skillStats) || !Array.isArray(value.sessions)) return null;

  const sessionCount = boundedInteger(value.summary.sessionCount, 0, MAX_SESSION_COUNT);
  const scoredSessionCount = boundedInteger(value.summary.scoredSessionCount, 0, MAX_SESSION_COUNT);
  const scoreSum = boundedInteger(value.summary.scoreSum, 0, AEROCOMMS_POSTGRES_INTEGER_MAX);
  const streakDays = boundedInteger(value.summary.streakDays, 0, MAX_SESSION_COUNT);
  const accuracy = value.summary.accuracy === null ? null : boundedInteger(value.summary.accuracy, 0, 100);
  const lastActivityAt = nullableTimestamp(value.summary.lastActivityAt);
  const lastActivityDate = value.summary.lastActivityDate === null ? null : isSafeAeroCommsActivityDate(value.summary.lastActivityDate) ? value.summary.lastActivityDate : undefined;
  const activityTimezone = value.summary.activityTimezone === null ? null : typeof value.summary.activityTimezone === "string" && value.summary.activityTimezone.length <= 80 ? value.summary.activityTimezone : undefined;
  const legacyImportedAt = nullableTimestamp(value.summary.legacyImportedAt);
  const resetAt = nullableTimestamp(value.summary.resetAt);
  if (sessionCount === null || scoredSessionCount === null || scoreSum === null || streakDays === null || scoredSessionCount > sessionCount ||
    scoreSum > scoredSessionCount * 100 ||
    (scoredSessionCount === 0 && accuracy !== null) || (scoredSessionCount > 0 && accuracy === null) ||
    lastActivityAt === undefined || lastActivityDate === undefined || activityTimezone === undefined || legacyImportedAt === undefined ||
    resetAt === undefined) return null;

  const completedExerciseIds = uniqueIdentifiers(value.completedExerciseIds);
  if (completedExerciseIds.length !== value.completedExerciseIds.length || completedExerciseIds.length > MAX_EXERCISES) return null;
  const skillStats = normalizeRemoteSkillStats(value.skillStats);
  if (skillStats.length !== value.skillStats.length) return null;

  const missionIds = new Set<string>();
  const missions = value.missions.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const missionId = safeIdentifier(entry.missionId);
    const levelId = normalizeAeroCommsLevelId(entry.levelId);
    const bestScore = entry.bestScore === null ? null : boundedInteger(entry.bestScore, 0, 100);
    const lastScore = entry.lastScore === null ? null : boundedInteger(entry.lastScore, 0, 100);
    const bestStars = entry.bestStars === null ? null : boundedInteger(entry.bestStars, 0, 3);
    const lastStars = entry.lastStars === null ? null : boundedInteger(entry.lastStars, 0, 3);
    const attemptCount = boundedInteger(entry.attemptCount, 1, MAX_SESSION_COUNT);
    const completedAt = nullableTimestamp(entry.completedAt);
    const lastAttemptAt = validIsoTimestamp(entry.lastAttemptAt);
    if (!missionId || missionIds.has(missionId) || !levelId || bestScore === null && entry.bestScore !== null ||
      lastScore === null && entry.lastScore !== null || bestStars === null && entry.bestStars !== null ||
      lastStars === null && entry.lastStars !== null || attemptCount === null || completedAt === undefined || !lastAttemptAt) return [];
    missionIds.add(missionId);
    return [{ missionId, levelId, bestScore, lastScore, bestStars, lastStars, attemptCount, completedAt, lastAttemptAt }];
  });
  if (missions.length !== value.missions.length || missions.length > MAX_MISSIONS) return null;

  const sessionIds = new Set<string>();
  const sessions = value.sessions.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const activityType = entry.activityType;
    const source = entry.source;
    if (!isAeroCommsUuid(entry.clientSessionId) || sessionIds.has(entry.clientSessionId) ||
      (activityType !== "exercise" && activityType !== "mission") ||
      (source !== "train" && source !== "atc-mission") || typeof entry.isScored !== "boolean") return [];
    const normalizedActivityType = activityType as "exercise" | "mission";
    const normalizedSource = source as "train" | "atc-mission";
    const occurredAt = validIsoTimestamp(entry.occurredAt);
    const activityDate = isSafeAeroCommsActivityDate(entry.activityDate) ? entry.activityDate : null;
    const activityTimezone = typeof entry.activityTimezone === "string" && entry.activityTimezone.length > 0 && entry.activityTimezone.length <= 80
      ? entry.activityTimezone
      : null;
    const levelId = entry.levelId === undefined || entry.levelId === null ? null : normalizeAeroCommsLevelId(entry.levelId);
    const score = entry.score === undefined || entry.score === null ? null : boundedInteger(entry.score, 0, 100);
    const stars = entry.stars === undefined || entry.stars === null ? null : boundedInteger(entry.stars, 0, 3);
    const exerciseId = safeIdentifier(entry.exerciseId);
    const missionId = safeIdentifier(entry.missionId);
    if (!occurredAt || !activityDate || !activityTimezone || (entry.levelId !== undefined && entry.levelId !== null && !levelId) ||
      (entry.score !== undefined && entry.score !== null && score === null) ||
      (entry.stars !== undefined && entry.stars !== null && stars === null) ||
      (entry.isScored && score === null) ||
      (normalizedActivityType === "exercise" && (!exerciseId || missionId || normalizedSource !== "train" || stars !== null)) ||
      (normalizedActivityType === "mission" && (!missionId || exerciseId || normalizedSource !== "atc-mission" || stars === null))) return [];
    sessionIds.add(entry.clientSessionId);
    return [{
      clientSessionId: entry.clientSessionId,
      activityType: normalizedActivityType,
      source: normalizedSource,
      ...(exerciseId ? { exerciseId } : {}),
      ...(missionId ? { missionId } : {}),
      ...(levelId ? { levelId } : {}),
      ...(score !== null ? { score } : {}),
      ...(stars !== null ? { stars } : {}),
      isScored: entry.isScored,
      occurredAt,
      activityDate,
      activityTimezone,
    }];
  });
  if (sessions.length !== value.sessions.length || sessions.length > MAX_SESSIONS) return null;

  return {
    schemaVersion: AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
    contentVersion: AEROCOMMS_CONTENT_VERSION,
    summary: { accuracy, scoreSum, sessionCount, scoredSessionCount, streakDays, lastActivityAt, lastActivityDate, activityTimezone, legacyImportedAt, resetAt },
    completedExerciseIds,
    missions,
    skillStats,
    sessions,
  };
}
