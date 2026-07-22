import "server-only";

import { findMission } from "./atcSim";
import { findExercise, screenType } from "./content";
import { findRetiredAeroCommsExercise } from "./retired-content";
import {
  AEROCOMMS_CONTENT_VERSION,
  AEROCOMMS_POSTGRES_INTEGER_MAX,
  AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
  AEROCOMMS_SKILL_IDS,
  isAeroCommsSkillId,
  isAeroCommsUuid,
  normalizeAeroCommsLevelId,
  type AeroCommsLevelId,
  type AeroCommsPersistencePayload,
  type AeroCommsSkillId,
} from "./persistence-contract";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const AEROCOMMS_PROGRESS_SYNC_MAX_BODY_SIZE = 65_536;

const MAX_EXERCISES = 500;
const MAX_MISSIONS = 100;
const MAX_SESSIONS = 100;
const MAX_SESSION_COUNT = 100_000;

export class AeroCommsPersistencePayloadError extends Error {
  constructor() {
    super("Invalid AeroComms progress payload");
  }
}

export class AeroCommsPersistenceUnavailableError extends Error {
  constructor() {
    super("AeroComms progress persistence unavailable");
  }
}

type PreparedSession = {
  client_session_id: string;
  activity_type: "exercise" | "mission";
  source: "train" | "atc-mission";
  exercise_id?: string;
  mission_id?: string;
  level_id?: AeroCommsLevelId;
  score?: number;
  stars?: number;
  is_scored: boolean;
  occurred_at: string;
  activity_date: string;
  activity_timezone: string;
  skill_ids: AeroCommsSkillId[];
};

type PreparedPayload = {
  completed_exercise_ids: string[];
  missions: Array<{
    mission_id: string;
    level_id: AeroCommsLevelId;
    best_score: number;
    last_score: number;
    best_stars: number;
    last_stars: number;
    attempt_count: number;
    completed_at: string;
    last_attempt_at: string;
  }>;
  skill_stats: Array<{ skill_id: AeroCommsSkillId; score_sum: number; scored_count: number }>;
  sessions: PreparedSession[];
  summary: {
    accuracy: number | null;
    score_sum: number;
    session_count: number;
    scored_session_count: number;
    legacy_streak_days: number;
    legacy_last_activity_date: string | null;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
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
  return typeof value === "string" && value.length > 0 && value.length <= 160 ? value : null;
}

function safeTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds) || milliseconds > Date.now() + 5 * 60_000) return null;
  return new Date(milliseconds).toISOString();
}

function safeTimezone(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 80) return null;
  try {
    Intl.DateTimeFormat("en-CA", { timeZone: value });
    return value;
  } catch {
    return null;
  }
}

function localDateForTimestamp(timestamp: string, timezone: string): string {
  const fields = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const field = (type: Intl.DateTimeFormatPartTypes) => fields.find((part) => part.type === type)?.value;
  const year = field("year");
  const month = field("month");
  const day = field("day");
  if (!year || !month || !day) throw new AeroCommsPersistencePayloadError();
  return `${year}-${month}-${day}`;
}

function skillIdsForScreen(screen: ReturnType<typeof screenType>): AeroCommsSkillId[] {
  switch (screen) {
    case "listening": return ["listening"];
    case "readback": return ["readbacks"];
    case "phraseology": return ["phraseology"];
    case "speaking": return ["speaking"];
    case "scenario": return ["listening", "readbacks", "phraseology"];
    case "mission": return ["listening", "readbacks", "phraseology", "confidence"];
    case "lesson": return [];
  }
}

function prepareCompletedExerciseIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_EXERCISES) throw new AeroCommsPersistencePayloadError();
  const ids = [...new Set(value.map(safeIdentifier).filter((id): id is string => id !== null))];
  if (ids.length !== value.length) throw new AeroCommsPersistencePayloadError();
  if (ids.some((id) => !findExercise(id) && !findRetiredAeroCommsExercise(id))) {
    throw new AeroCommsPersistencePayloadError();
  }
  return ids;
}

function prepareMissions(value: unknown) {
  if (!Array.isArray(value) || value.length > MAX_MISSIONS) throw new AeroCommsPersistencePayloadError();
  return value.map((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, [
      "missionId", "levelId", "bestScore", "lastScore", "bestStars", "lastStars", "attempts", "completedAt", "lastAttemptAt",
    ])) throw new AeroCommsPersistencePayloadError();

    const missionId = safeIdentifier(entry.missionId);
    const mission = missionId ? findMission(missionId) : undefined;
    const levelId = normalizeAeroCommsLevelId(mission?.level);
    const bestScore = boundedInteger(entry.bestScore, 0, 100);
    const lastScore = boundedInteger(entry.lastScore, 0, 100);
    const bestStars = boundedInteger(entry.bestStars, 0, 3);
    const lastStars = boundedInteger(entry.lastStars, 0, 3);
    const attemptCount = boundedInteger(entry.attempts, 1, MAX_SESSION_COUNT);
    const completedAt = safeTimestamp(entry.completedAt);
    const lastAttemptAt = safeTimestamp(entry.lastAttemptAt);
    if (!missionId || !mission || !levelId || bestScore === null || lastScore === null || bestStars === null ||
      lastStars === null || attemptCount === null || !completedAt || !lastAttemptAt) {
      throw new AeroCommsPersistencePayloadError();
    }

    return {
      mission_id: missionId,
      level_id: levelId,
      best_score: bestScore,
      last_score: lastScore,
      best_stars: bestStars,
      last_stars: lastStars,
      attempt_count: attemptCount,
      completed_at: completedAt,
      last_attempt_at: lastAttemptAt,
    };
  });
}

function prepareSkillStats(value: unknown) {
  if (!Array.isArray(value) || value.length > AEROCOMMS_SKILL_IDS.length) throw new AeroCommsPersistencePayloadError();
  const skillIds = new Set<string>();
  return value.map((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, ["skillId", "scoreSum", "scoredCount"])) {
      throw new AeroCommsPersistencePayloadError();
    }
    const skillId = entry.skillId;
    const scoreSum = boundedInteger(entry.scoreSum, 0, AEROCOMMS_POSTGRES_INTEGER_MAX);
    const scoredCount = boundedInteger(entry.scoredCount, 0, MAX_SESSION_COUNT);
    if (!isAeroCommsSkillId(skillId) || skillIds.has(skillId) || scoreSum === null || scoredCount === null) {
      throw new AeroCommsPersistencePayloadError();
    }
    skillIds.add(skillId);
    return { skill_id: skillId, score_sum: scoreSum, scored_count: scoredCount };
  });
}

function prepareSessions(value: unknown): PreparedSession[] {
  if (!Array.isArray(value) || value.length > MAX_SESSIONS) throw new AeroCommsPersistencePayloadError();
  const ids = new Set<string>();
  return value.map((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, [
      "clientSessionId", "activityType", "source", "exerciseId", "missionId", "levelId", "score", "stars",
      "isScored", "occurredAt", "activityDate", "activityTimezone",
    ])) throw new AeroCommsPersistencePayloadError();

    const clientSessionId = entry.clientSessionId;
    const activityType = entry.activityType;
    const isScored = entry.isScored;
    const occurredAt = safeTimestamp(entry.occurredAt);
    const timezone = safeTimezone(entry.activityTimezone);
    if (!isAeroCommsUuid(clientSessionId) || ids.has(clientSessionId) ||
      (activityType !== "exercise" && activityType !== "mission") || typeof isScored !== "boolean" ||
      !occurredAt || !timezone) throw new AeroCommsPersistencePayloadError();
    ids.add(clientSessionId);

    const activityDate = localDateForTimestamp(occurredAt, timezone);
    const score = isScored ? boundedInteger(entry.score, 0, 100) : null;
    if (isScored && score === null) throw new AeroCommsPersistencePayloadError();

    if (activityType === "exercise") {
      const exerciseId = safeIdentifier(entry.exerciseId);
      const exercise = exerciseId ? findExercise(exerciseId) : undefined;
      const retiredExercise = exerciseId ? findRetiredAeroCommsExercise(exerciseId) : undefined;
      if (!exerciseId || (!exercise && !retiredExercise) || entry.missionId !== undefined || entry.source !== "train" || entry.stars !== undefined) {
        throw new AeroCommsPersistencePayloadError();
      }
      const levelId = normalizeAeroCommsLevelId(exercise?.level.id ?? "student-pilot");
      if (!levelId) throw new AeroCommsPersistencePayloadError();
      return {
        client_session_id: clientSessionId,
        activity_type: "exercise",
        source: "train",
        exercise_id: exerciseId,
        level_id: levelId,
        ...(score !== null ? { score } : {}),
        is_scored: isScored,
        occurred_at: occurredAt,
        activity_date: activityDate,
        activity_timezone: timezone,
        skill_ids: score === null ? [] : skillIdsForScreen(screenType(exercise?.exercise.type ?? "Mission")),
      };
    }

    const missionId = safeIdentifier(entry.missionId);
    const mission = missionId ? findMission(missionId) : undefined;
    const levelId = normalizeAeroCommsLevelId(mission?.level);
    const stars = boundedInteger(entry.stars, 0, 3);
    if (!missionId || !mission || !levelId || entry.exerciseId !== undefined || entry.source !== "atc-mission" || stars === null || !isScored) {
      throw new AeroCommsPersistencePayloadError();
    }
    return {
      client_session_id: clientSessionId,
      activity_type: "mission",
      source: "atc-mission",
      mission_id: missionId,
      level_id: levelId,
      score: score!,
      stars,
      is_scored: true,
      occurred_at: occurredAt,
      activity_date: activityDate,
      activity_timezone: timezone,
      skill_ids: skillIdsForScreen("mission"),
    };
  });
}

function prepareSummary(value: unknown) {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    "accuracy", "scoreSum", "sessionCount", "scoredSessionCount", "legacyStreakDays", "legacyLastActivityDate",
  ])) throw new AeroCommsPersistencePayloadError();
  const sessionCount = boundedInteger(value.sessionCount, 0, MAX_SESSION_COUNT);
  const scoredSessionCount = boundedInteger(value.scoredSessionCount, 0, MAX_SESSION_COUNT);
  const scoreSum = boundedInteger(value.scoreSum, 0, AEROCOMMS_POSTGRES_INTEGER_MAX);
  const accuracy = value.accuracy === null ? null : boundedInteger(value.accuracy, 0, 100);
  const legacyStreakDays = boundedInteger(value.legacyStreakDays, 0, MAX_SESSION_COUNT);
  const legacyLastActivityDate = value.legacyLastActivityDate === null
    ? null
    : typeof value.legacyLastActivityDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.legacyLastActivityDate)
      ? value.legacyLastActivityDate
      : undefined;
  if (sessionCount === null || scoredSessionCount === null || scoreSum === null || scoredSessionCount > sessionCount ||
    scoreSum > scoredSessionCount * 100 ||
    (scoredSessionCount === 0 && accuracy !== null) || (scoredSessionCount > 0 && accuracy === null)) {
    throw new AeroCommsPersistencePayloadError();
  }
  if (legacyStreakDays === null || legacyLastActivityDate === undefined) throw new AeroCommsPersistencePayloadError();
  return {
    accuracy,
    score_sum: scoreSum,
    session_count: sessionCount,
    scored_session_count: scoredSessionCount,
    legacy_streak_days: legacyStreakDays,
    legacy_last_activity_date: legacyLastActivityDate,
  };
}

export function prepareAeroCommsPersistencePayload(value: unknown): {
  operationId: string;
  payload: PreparedPayload;
} {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    "operationId", "schemaVersion", "contentVersion", "completedExerciseIds", "missions", "skillStats", "sessions", "summary",
  ]) || !isAeroCommsUuid(value.operationId) || value.schemaVersion !== AEROCOMMS_PERSISTENCE_SCHEMA_VERSION ||
    value.contentVersion !== AEROCOMMS_CONTENT_VERSION) {
    throw new AeroCommsPersistencePayloadError();
  }

  return {
    operationId: value.operationId,
    payload: {
      completed_exercise_ids: prepareCompletedExerciseIds(value.completedExerciseIds),
      missions: prepareMissions(value.missions),
      skill_stats: prepareSkillStats(value.skillStats),
      sessions: prepareSessions(value.sessions),
      summary: prepareSummary(value.summary),
    },
  };
}

export async function persistAeroCommsProgress(
  userId: string,
  rawPayload: AeroCommsPersistencePayload | unknown,
): Promise<unknown> {
  if (!isAeroCommsUuid(userId)) throw new AeroCommsPersistencePayloadError();
  const { operationId, payload } = prepareAeroCommsPersistencePayload(rawPayload);
  const { data, error } = await getSupabaseAdmin().rpc("apply_aerocomms_progress_sync", {
    p_user_id: userId,
    p_operation_id: operationId,
    p_schema_version: AEROCOMMS_PERSISTENCE_SCHEMA_VERSION,
    p_content_version: AEROCOMMS_CONTENT_VERSION,
    p_payload: payload,
  });
  if (error?.code === "22023") throw new AeroCommsPersistencePayloadError();
  if (error || !isRecord(data)) throw new AeroCommsPersistenceUnavailableError();
  return data;
}

export async function resetAeroCommsProgress(userId: string, operationId: string): Promise<unknown> {
  if (!isAeroCommsUuid(userId) || !isAeroCommsUuid(operationId)) {
    throw new AeroCommsPersistencePayloadError();
  }

  const { data, error } = await getSupabaseAdmin().rpc("reset_aerocomms_progress", {
    p_user_id: userId,
    p_operation_id: operationId,
    p_content_version: AEROCOMMS_CONTENT_VERSION,
  });
  if (error?.code === "22023") throw new AeroCommsPersistencePayloadError();
  if (error || !isRecord(data)) throw new AeroCommsPersistenceUnavailableError();
  return data;
}
