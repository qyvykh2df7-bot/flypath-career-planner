import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getWarhomeAuthorization } from "@/lib/warhome/auth";
import {
  deriveWarhomeAeroCommsStatus,
  deriveWarhomeMarketingStatus,
  isWarhomeUserId,
  type WarhomeAeroCommsStatus,
  type WarhomeMarketingStatus,
} from "@/lib/warhome/users";

export const WARHOME_USER_RECENT_SESSIONS_LIMIT = 20;
export const WARHOME_USER_PROFILE_SELECT =
  "full_name,preferred_language,timezone,training_stage,career_goal,created_at,updated_at";
export const WARHOME_USER_PROGRESS_SELECT =
  "schema_version,content_version,session_count,scored_session_count,streak_days,last_activity_at,last_activity_date,legacy_imported_at,reset_at";
export const WARHOME_USER_COMPLETED_EXERCISES_SELECT = "exercise_id";
export const WARHOME_USER_COMPLETED_MISSIONS_SELECT = "mission_id";
export const WARHOME_USER_RECENT_SESSIONS_SELECT =
  "activity_type,source,level_id,score,is_scored,occurred_at,activity_date";
export const WARHOME_USER_LEAD_SELECT = "id,latest_source,funnel_stage,status,created_at";
export const WARHOME_USER_MARKETING_SELECT =
  "list_key,status,source,consented_at,unsubscribed_at,bounced_at,complained_at,blocked_at";

const AEROCOMMS_LEVEL_IDS = [
  "cadet",
  "student-pilot",
  "ready-for-radio",
  "airline-prep",
  "advanced-ops",
] as const;
const AEROCOMMS_ACTIVITY_TYPES = ["exercise", "mission"] as const;
const AEROCOMMS_ACTIVITY_SOURCES = ["train", "atc-mission"] as const;
const EMAIL_SUBSCRIPTION_STATUSES = [
  "subscribed",
  "unsubscribed",
  "bounced",
  "complained",
  "blocked",
] as const;

export type WarhomeUserIdentity = {
  email: string | null;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignInAt: string | null;
};

export type WarhomeUserProfile = {
  fullName: string | null;
  preferredLanguage: string | null;
  timezone: string | null;
  trainingStage: string | null;
  careerGoal: string | null;
  isIncomplete: boolean;
};

export type WarhomeUserAeroCommsSummary = {
  status: WarhomeAeroCommsStatus;
  hasProgress: boolean;
  sessionCount: number;
  scoredSessionCount: number;
  completedExerciseCount: number;
  completedMissionCount: number;
  streakDays: number;
  lastActivityAt: string | null;
  lastActivityDate: string | null;
  legacyImportedAt: string | null;
  resetAt: string | null;
};

export type WarhomeUserRecentSession = {
  activityType: "exercise" | "mission";
  source: "train" | "atc-mission";
  levelId: (typeof AEROCOMMS_LEVEL_IDS)[number] | null;
  score: number | null;
  isScored: boolean;
  occurredAt: string;
  activityDate: string;
  label: string;
};

export type WarhomeUserLead = {
  id: string;
  latestSource: string;
  funnelStage: string;
  status: string;
  createdAt: string;
};

export type WarhomeUserMarketing = {
  status: WarhomeMarketingStatus;
  subscriptions: Array<{
    listKey: string;
    status: (typeof EMAIL_SUBSCRIPTION_STATUSES)[number];
    source: string;
    statusChangedAt: string | null;
  }>;
};

export type WarhomeUserDetail = {
  identity: WarhomeUserIdentity;
  profile: WarhomeUserProfile;
  aerocomms: WarhomeUserAeroCommsSummary;
  recentSessions: WarhomeUserRecentSession[];
  lead: WarhomeUserLead | null;
  marketing: WarhomeUserMarketing;
  purchases: { status: "not_available" };
};

export class WarhomeUserDetailAuthorizationError extends Error {
  constructor() {
    super("Warhome user detail authorization failed");
    this.name = "WarhomeUserDetailAuthorizationError";
  }
}

export class WarhomeUserNotFoundError extends Error {
  constructor() {
    super("Warhome user not found");
    this.name = "WarhomeUserNotFoundError";
  }
}

export class WarhomeUserDetailDataError extends Error {
  constructor() {
    super("Warhome user detail data failed");
    this.name = "WarhomeUserDetailDataError";
  }
}

type RawRecord = Record<string, unknown>;

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value);
}

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(new Date(value).getTime());
}

function asNullableTimestamp(value: unknown): string | null {
  return isTimestamp(value) ? value : null;
}

function asNullableDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function asNonnegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function countDistinctCompleted(rows: unknown, key: "exercise_id" | "mission_id"): number {
  if (!Array.isArray(rows)) return 0;
  return new Set(
    rows
      .filter(isRecord)
      .map((row) => row[key])
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  ).size;
}

function mapProfile(value: unknown): WarhomeUserProfile {
  const profile = isRecord(value) ? value : null;
  const fullName = typeof profile?.full_name === "string" && profile.full_name.trim()
    ? profile.full_name.trim()
    : null;

  return {
    fullName,
    preferredLanguage:
      typeof profile?.preferred_language === "string" && profile.preferred_language.trim()
        ? profile.preferred_language
        : null,
    timezone: typeof profile?.timezone === "string" && profile.timezone.trim() ? profile.timezone : null,
    trainingStage:
      typeof profile?.training_stage === "string" && profile.training_stage.trim()
        ? profile.training_stage
        : null,
    careerGoal:
      typeof profile?.career_goal === "string" && profile.career_goal.trim()
        ? profile.career_goal
        : null,
    isIncomplete: fullName === null,
  };
}

function mapProgress(
  value: unknown,
  completedExerciseCount: number,
  completedMissionCount: number,
): WarhomeUserAeroCommsSummary | null {
  if (value === null) {
    return {
      status: "not_synced",
      hasProgress: false,
      sessionCount: 0,
      scoredSessionCount: 0,
      completedExerciseCount,
      completedMissionCount,
      streakDays: 0,
      lastActivityAt: null,
      lastActivityDate: null,
      legacyImportedAt: null,
      resetAt: null,
    };
  }
  if (!isRecord(value)) return null;

  const sessionCount = asNonnegativeInteger(value.session_count);
  const scoredSessionCount = asNonnegativeInteger(value.scored_session_count);
  const streakDays = asNonnegativeInteger(value.streak_days);
  if (sessionCount === null || scoredSessionCount === null || streakDays === null || scoredSessionCount > sessionCount) {
    return null;
  }

  const lastActivityAt = asNullableTimestamp(value.last_activity_at);
  const lastActivityDate = asNullableDate(value.last_activity_date);
  return {
    status: deriveWarhomeAeroCommsStatus({
      hasProgress: true,
      sessionCount,
      lastActivityAt,
      lastActivityDate,
    }),
    hasProgress: true,
    sessionCount,
    scoredSessionCount,
    completedExerciseCount,
    completedMissionCount,
    streakDays,
    lastActivityAt,
    lastActivityDate,
    legacyImportedAt: asNullableTimestamp(value.legacy_imported_at),
    resetAt: asNullableTimestamp(value.reset_at),
  };
}

function mapLead(value: unknown): WarhomeUserLead | null {
  if (value === null) return null;
  if (!isRecord(value) || !isWarhomeUserId(String(value.id))) return null;
  if (
    typeof value.latest_source !== "string" ||
    typeof value.funnel_stage !== "string" ||
    typeof value.status !== "string" ||
    !isTimestamp(value.created_at)
  ) {
    return null;
  }

  return {
    id: String(value.id),
    latestSource: value.latest_source,
    funnelStage: value.funnel_stage,
    status: value.status,
    createdAt: value.created_at,
  };
}

function mapRecentSessions(value: unknown): WarhomeUserRecentSession[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((session) => {
      const activityType = typeof session.activity_type === "string" ? session.activity_type : "";
      const source = typeof session.source === "string" ? session.source : "";
      const levelId = typeof session.level_id === "string" ? session.level_id : "";
      const score = session.score === null ? null : asNonnegativeInteger(session.score);
      if (
        !includesValue(AEROCOMMS_ACTIVITY_TYPES, activityType) ||
        !includesValue(AEROCOMMS_ACTIVITY_SOURCES, source) ||
        (levelId && !includesValue(AEROCOMMS_LEVEL_IDS, levelId)) ||
        typeof session.is_scored !== "boolean" ||
        (session.score !== null && score === null) ||
        (score !== null && score > 100) ||
        (session.is_scored && score === null) ||
        (!session.is_scored && score !== null) ||
        !isTimestamp(session.occurred_at) ||
        !asNullableDate(session.activity_date)
      ) {
        return null;
      }

      return {
        activityType,
        source,
        levelId: levelId || null,
        score,
        isScored: session.is_scored,
        occurredAt: session.occurred_at,
        activityDate: session.activity_date,
        label: activityType === "mission" ? "Misión ATC" : "Ejercicio de entrenamiento",
      };
    })
    .filter((session): session is WarhomeUserRecentSession => session !== null);
}

function mapMarketing(value: unknown, hasLead: boolean): WarhomeUserMarketing | null {
  if (!Array.isArray(value)) return null;

  const subscriptions = value
    .filter(isRecord)
    .map((subscription) => {
      const status = typeof subscription.status === "string" ? subscription.status : "";
      if (
        typeof subscription.list_key !== "string" ||
        !subscription.list_key.trim() ||
        !includesValue(EMAIL_SUBSCRIPTION_STATUSES, status) ||
        typeof subscription.source !== "string" ||
        !subscription.source.trim()
      ) {
        return null;
      }

      const changedAt =
        status === "subscribed"
          ? asNullableTimestamp(subscription.consented_at)
          : status === "unsubscribed"
            ? asNullableTimestamp(subscription.unsubscribed_at)
            : status === "bounced"
              ? asNullableTimestamp(subscription.bounced_at)
              : status === "complained"
                ? asNullableTimestamp(subscription.complained_at)
                : asNullableTimestamp(subscription.blocked_at);

      return {
        listKey: subscription.list_key,
        status,
        source: subscription.source,
        statusChangedAt: changedAt,
      };
    })
    .filter(
      (
        subscription,
      ): subscription is WarhomeUserMarketing["subscriptions"][number] => subscription !== null,
    );

  return {
    status: deriveWarhomeMarketingStatus({
      hasLead,
      hasActiveSubscription: subscriptions.some((subscription) => subscription.status === "subscribed"),
    }),
    subscriptions,
  };
}

export async function getWarhomeUserDetail(userId: string): Promise<WarhomeUserDetail> {
  const authorization = await getWarhomeAuthorization();
  if (authorization.status !== "authorized") throw new WarhomeUserDetailAuthorizationError();
  if (!isWarhomeUserId(userId)) throw new WarhomeUserNotFoundError();

  const admin = getSupabaseAdmin();
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError) throw new WarhomeUserDetailDataError();
  if (!authData.user || !isTimestamp(authData.user.created_at)) throw new WarhomeUserNotFoundError();

  const [profileResult, progressResult, exercisesResult, missionsResult, sessionsResult, leadResult] =
    await Promise.all([
      admin.from("profiles").select(WARHOME_USER_PROFILE_SELECT).eq("user_id", userId).maybeSingle(),
      admin.from("aerocomms_progress").select(WARHOME_USER_PROGRESS_SELECT).eq("user_id", userId).maybeSingle(),
      admin
        .from("aerocomms_exercise_progress")
        .select(WARHOME_USER_COMPLETED_EXERCISES_SELECT)
        .eq("user_id", userId)
        .not("completed_at", "is", null),
      admin
        .from("aerocomms_mission_progress")
        .select(WARHOME_USER_COMPLETED_MISSIONS_SELECT)
        .eq("user_id", userId)
        .not("completed_at", "is", null),
      admin
        .from("aerocomms_sessions")
        .select(WARHOME_USER_RECENT_SESSIONS_SELECT)
        .eq("user_id", userId)
        .order("occurred_at", { ascending: false })
        .range(0, WARHOME_USER_RECENT_SESSIONS_LIMIT - 1),
      admin.from("leads").select(WARHOME_USER_LEAD_SELECT).eq("user_id", userId).maybeSingle(),
    ]);

  if (
    profileResult.error ||
    progressResult.error ||
    exercisesResult.error ||
    missionsResult.error ||
    sessionsResult.error ||
    leadResult.error ||
    !Array.isArray(exercisesResult.data) ||
    !Array.isArray(missionsResult.data) ||
    !Array.isArray(sessionsResult.data)
  ) {
    throw new WarhomeUserDetailDataError();
  }

  const lead = mapLead(leadResult.data);
  if (leadResult.data !== null && !lead) throw new WarhomeUserDetailDataError();

  const subscriptionsResult = lead
    ? await admin
        .from("email_subscriptions")
        .select(WARHOME_USER_MARKETING_SELECT)
        .eq("lead_id", lead.id)
    : { data: [], error: null };
  if (subscriptionsResult.error || !Array.isArray(subscriptionsResult.data)) {
    throw new WarhomeUserDetailDataError();
  }

  const completedExerciseCount = countDistinctCompleted(exercisesResult.data, "exercise_id");
  const completedMissionCount = countDistinctCompleted(missionsResult.data, "mission_id");
  const aerocomms = mapProgress(
    progressResult.data,
    completedExerciseCount,
    completedMissionCount,
  );
  const marketing = mapMarketing(subscriptionsResult.data, lead !== null);
  if (!aerocomms || !marketing) throw new WarhomeUserDetailDataError();

  return {
    identity: {
      email: typeof authData.user.email === "string" && authData.user.email.trim()
        ? authData.user.email
        : null,
      emailConfirmed: Boolean(authData.user.email_confirmed_at),
      createdAt: authData.user.created_at,
      lastSignInAt: asNullableTimestamp(authData.user.last_sign_in_at),
    },
    profile: mapProfile(profileResult.data),
    aerocomms,
    recentSessions: mapRecentSessions(sessionsResult.data),
    lead,
    marketing,
    purchases: { status: "not_available" },
  };
}
