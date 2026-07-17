export const AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION = 1 as const;

type ProgressRecord = Record<string, unknown>;

export type AeroCommsSyncMissionResult = {
  missionId: string;
  bestScore: number;
  bestStars: number;
  attempts: number;
  completedAt: string;
  lastAttemptAt: string;
  level?: string;
};

export type AeroCommsSyncSession = {
  id: string;
  score: number;
  occurredAt: number;
  source?: "train" | "atc-mission";
  missionId?: string;
  exerciseId?: string;
  level?: string;
  stars?: number;
};

export type AeroCommsSyncProgress = {
  schemaVersion: typeof AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION;
  completedExerciseIds: string[];
  completedMissionIds: string[];
  missionResults: Record<string, AeroCommsSyncMissionResult>;
  scoredSessions: AeroCommsSyncSession[];
  progress: {
    accuracy: number;
    scoredCount: number;
    sessionsCount: number;
    streakDays: number;
    lastSessionAt: string | null;
    skills: Record<"listening" | "readbacks" | "phraseology" | "speaking" | "confidence", number>;
  };
};

export type ReadAeroCommsSyncProgressResult =
  | { status: "current" | "legacy"; progress: AeroCommsSyncProgress }
  | { status: "invalid" };

const SKILL_KEYS = ["listening", "readbacks", "phraseology", "speaking", "confidence"] as const;
const MAX_IDENTIFIER_LENGTH = 160;
const MAX_LEVEL_LENGTH = 80;
const MAX_ATTEMPTS = 100000;

function isRecord(value: unknown): value is ProgressRecord {
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

function safeString(value: unknown, maximumLength = MAX_IDENTIFIER_LENGTH): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= maximumLength ? value : null;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.flatMap((entry) => {
    const normalized = safeString(entry);
    return normalized ? [normalized] : [];
  }))];
}

function validTimestamp(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function normalizeSkills(value: unknown): AeroCommsSyncProgress["progress"]["skills"] | null {
  if (!isRecord(value)) return null;

  const entries = SKILL_KEYS.map((key) => {
    const score = boundedInteger(value[key], 0, 100);
    return score === null ? null : [key, score] as const;
  });
  const normalizedEntries = entries.filter(
    (entry): entry is readonly [(typeof SKILL_KEYS)[number], number] => entry !== null,
  );
  if (normalizedEntries.length !== SKILL_KEYS.length) return null;

  return Object.fromEntries(normalizedEntries) as AeroCommsSyncProgress["progress"]["skills"];
}

function normalizeMissionResults(value: unknown): Record<string, AeroCommsSyncMissionResult> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([missionId, result]) => {
      const normalizedMissionId = safeString(missionId);
      if (!normalizedMissionId || !isRecord(result)) return [];

      const bestScore = boundedInteger(result.bestScore, 0, 100);
      const bestStars = boundedInteger(result.bestStars, 0, 3);
      const attempts = boundedInteger(result.attempts, 1, MAX_ATTEMPTS);
      const completedAt = validTimestamp(result.completedAt);
      const lastAttemptAt = validTimestamp(result.lastAttemptAt);
      if (bestScore === null || bestStars === null || attempts === null || !completedAt || !lastAttemptAt) {
        return [];
      }

      const normalized: AeroCommsSyncMissionResult = {
        missionId: normalizedMissionId,
        bestScore,
        bestStars,
        attempts,
        completedAt,
        lastAttemptAt,
      };

      const level = safeString(result.level, MAX_LEVEL_LENGTH);
      if (level) normalized.level = level;

      return [[normalizedMissionId, normalized]];
    }),
  );
}

function normalizeScoredSessions(value: unknown): AeroCommsSyncSession[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry) || entry.isScored !== true) return [];

    const id = safeString(entry.id);
    const score = boundedInteger(entry.score, 0, 100);
    const occurredAt = boundedInteger(entry.at, 0, Number.MAX_SAFE_INTEGER);
    if (!id || score === null || occurredAt === null) return [];

    const session: AeroCommsSyncSession = { id, score, occurredAt };
    if (entry.source === "train" || entry.source === "atc-mission") session.source = entry.source;

    const missionId = safeString(entry.missionId);
    if (missionId) session.missionId = missionId;
    const exerciseId = safeString(entry.exerciseId);
    if (exerciseId) session.exerciseId = exerciseId;
    const level = safeString(entry.level, MAX_LEVEL_LENGTH);
    if (level) session.level = level;

    if (entry.stars !== undefined) {
      const stars = boundedInteger(entry.stars, 0, 3);
      if (stars !== null) session.stars = stars;
    }

    return [session];
  });
}

function normalizeProgressMetrics(value: ProgressRecord): AeroCommsSyncProgress["progress"] | null {
  const accuracy = boundedInteger(value.accuracy, 0, 100);
  const scoredCount = boundedInteger(value.scoredCount, 0, MAX_ATTEMPTS);
  const sessionsCount = boundedInteger(value.sessionsCount, 0, MAX_ATTEMPTS);
  const streakDays = boundedInteger(value.streakDays, 0, MAX_ATTEMPTS);
  const skills = normalizeSkills(value.skills);
  const lastSessionAt = value.lastSessionAt === null ? null : validTimestamp(value.lastSessionAt);

  if (
    accuracy === null ||
    scoredCount === null ||
    sessionsCount === null ||
    streakDays === null ||
    skills === null ||
    lastSessionAt === null && value.lastSessionAt !== null
  ) {
    return null;
  }

  return { accuracy, scoredCount, sessionsCount, streakDays, lastSessionAt, skills };
}

function normalizeLegacyAeroCommsSyncProgress(value: unknown): AeroCommsSyncProgress | null {
  const source = isRecord(value) ? value : null;
  if (!source) return null;

  const progress = normalizeProgressMetrics(source);
  if (!progress) return null;

  return {
    schemaVersion: AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION,
    completedExerciseIds: uniqueStrings(source.completedExercises),
    completedMissionIds: uniqueStrings(source.completedMissions),
    missionResults: normalizeMissionResults(source.missionResults),
    scoredSessions: normalizeScoredSessions(source.history),
    progress,
  };
}

function normalizeCurrentAeroCommsSyncProgress(value: unknown): AeroCommsSyncProgress | null {
  const source = isRecord(value) ? value : null;
  if (!source || source.schemaVersion !== AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION || !isRecord(source.progress)) {
    return null;
  }

  return normalizeLegacyAeroCommsSyncProgress({
    completedExercises: source.completedExerciseIds,
    completedMissions: source.completedMissionIds,
    missionResults: source.missionResults,
    history: Array.isArray(source.scoredSessions)
      ? source.scoredSessions.map((session) => ({
          ...(isRecord(session) ? session : {}),
          at: isRecord(session) ? session.occurredAt : undefined,
          isScored: true,
        }))
      : source.scoredSessions,
    ...source.progress,
  });
}

/**
 * Converts the existing unversioned `aerocomms.v2` local state into the v1
 * payload considered for a later remote sync. Invalid aggregate metrics reject
 * the legacy payload; invalid mission or session entries are discarded.
 */
export function createAeroCommsSyncProgress(value: unknown): AeroCommsSyncProgress | null {
  return normalizeLegacyAeroCommsSyncProgress(value);
}

export function isValidAeroCommsSyncProgress(value: unknown): value is AeroCommsSyncProgress {
  const normalized = normalizeCurrentAeroCommsSyncProgress(value);
  return normalized !== null && JSON.stringify(value) === JSON.stringify(normalized);
}

export function serializeAeroCommsSyncProgress(value: unknown): string {
  if (isRecord(value) && value.schemaVersion === AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION) {
    if (!isValidAeroCommsSyncProgress(value)) {
      throw new TypeError("Invalid AeroComms sync progress contract");
    }

    return JSON.stringify(value);
  }

  const progress = createAeroCommsSyncProgress(value);
  if (!progress) throw new TypeError("Invalid AeroComms legacy progress");
  return JSON.stringify(progress);
}

/**
 * Reads the current version or converts the existing unversioned `aerocomms.v2`
 * local state into v1 in memory. It does not write to storage or Supabase.
 */
export function readAeroCommsSyncProgress(raw: string | unknown): ReadAeroCommsSyncProgressResult {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return { status: "invalid" };
    }
  }

  if (!isRecord(parsed)) return { status: "invalid" };
  if (parsed.schemaVersion === AEROCOMMS_SYNC_PROGRESS_SCHEMA_VERSION) {
    return isValidAeroCommsSyncProgress(parsed)
      ? { status: "current", progress: parsed }
      : { status: "invalid" };
  }

  // Existing local state predates this explicit contract and has no schemaVersion.
  if (!Array.isArray(parsed.completedExercises) && !Array.isArray(parsed.completedMissions)) {
    return { status: "invalid" };
  }

  const progress = createAeroCommsSyncProgress(parsed);
  return progress ? { status: "legacy", progress } : { status: "invalid" };
}
