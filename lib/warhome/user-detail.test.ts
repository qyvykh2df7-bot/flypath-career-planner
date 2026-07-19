import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWarhomeAuthorization: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/warhome/auth", () => ({
  getWarhomeAuthorization: mocks.getWarhomeAuthorization,
}));
vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: mocks.getSupabaseAdmin,
}));

import {
  getWarhomeUserDetail,
  WARHOME_USER_COMPLETED_EXERCISES_SELECT,
  WARHOME_USER_COMPLETED_MISSIONS_SELECT,
  WARHOME_USER_LEAD_SELECT,
  WARHOME_USER_MARKETING_SELECT,
  WARHOME_USER_PROFILE_SELECT,
  WARHOME_USER_PROGRESS_SELECT,
  WARHOME_USER_RECENT_SESSIONS_SELECT,
} from "./user-detail";

const USER_ID = "5a63c9bf-b72e-4c61-a23f-76b40bb91723";
const LEAD_ID = "2c0d0d42-f8ec-4fc3-bb19-64b8ad15d22e";

function createQuery(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    not: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}

function configureSuccessfulDetail(options?: {
  profile?: unknown;
  progress?: unknown;
  exercises?: unknown[];
  missions?: unknown[];
  sessions?: unknown[];
  lead?: unknown;
  subscriptions?: unknown[];
}) {
  const configured = <T>(key: keyof NonNullable<typeof options>, fallback: T): T =>
    options && Object.prototype.hasOwnProperty.call(options, key)
      ? (options[key] as T)
      : fallback;

  const profileQuery = createQuery({
    data: configured("profile", {
      full_name: "Piloto de prueba",
      preferred_language: "es",
      timezone: "Europe/Madrid",
      training_stage: "exploring",
      career_goal: "airline",
    }),
    error: null,
  });
  const progressQuery = createQuery({
    data: configured("progress", {
      schema_version: 1,
      content_version: "2026.07",
      session_count: 2,
      scored_session_count: 1,
      streak_days: 2,
      last_activity_at: "2026-07-14T10:00:00.000Z",
      last_activity_date: "2026-07-14",
      legacy_imported_at: "2026-07-13T10:00:00.000Z",
      reset_at: null,
    }),
    error: null,
  });
  const exercisesQuery = createQuery({
    data: configured("exercises", [{ exercise_id: "cadet.cadet-basics.intro-to-atc" }]),
    error: null,
  });
  const missionsQuery = createQuery({
    data: configured("missions", [{ mission_id: "cadet-first-contact" }]),
    error: null,
  });
  const sessionsQuery = createQuery({
    data: configured("sessions", [
      {
        activity_type: "exercise",
        source: "train",
        level_id: "cadet",
        score: 82,
        is_scored: true,
        occurred_at: "2026-07-14T10:00:00.000Z",
        activity_date: "2026-07-14",
      },
    ]),
    error: null,
  });
  const leadQuery = createQuery({
    data: configured("lead", {
      id: LEAD_ID,
      latest_source: "career_planner",
      funnel_stage: "interested",
      status: "active",
      created_at: "2026-07-12T10:00:00.000Z",
    }),
    error: null,
  });
  const subscriptionsQuery = createQuery({
    data: configured("subscriptions", [
      {
        list_key: "career_planner",
        status: "subscribed",
        source: "career_planner",
        consented_at: "2026-07-12T10:00:00.000Z",
        unsubscribed_at: null,
        bounced_at: null,
        complained_at: null,
        blocked_at: null,
      },
    ]),
    error: null,
  });

  const from = vi.fn((table: string) => {
    if (table === "profiles") return profileQuery;
    if (table === "aerocomms_progress") return progressQuery;
    if (table === "aerocomms_exercise_progress") return exercisesQuery;
    if (table === "aerocomms_mission_progress") return missionsQuery;
    if (table === "aerocomms_sessions") return sessionsQuery;
    if (table === "leads") return leadQuery;
    if (table === "email_subscriptions") return subscriptionsQuery;
    throw new Error(`Unexpected table ${table}`);
  });
  const getUserById = vi.fn().mockResolvedValue({
    data: {
      user: {
        id: USER_ID,
        email: "pilot@example.com",
        email_confirmed_at: "2026-07-12T10:00:00.000Z",
        created_at: "2026-07-12T10:00:00.000Z",
        last_sign_in_at: "2026-07-14T10:00:00.000Z",
        user_metadata: { private: "never expose" },
        app_metadata: { private: "never expose" },
        identities: [{ private: "never expose" }],
      },
    },
    error: null,
  });
  mocks.getSupabaseAdmin.mockReturnValue({ auth: { admin: { getUserById } }, from });

  return {
    profileQuery,
    progressQuery,
    exercisesQuery,
    missionsQuery,
    sessionsQuery,
    leadQuery,
    subscriptionsQuery,
    from,
    getUserById,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWarhomeAuthorization.mockResolvedValue({
    status: "authorized",
    admin: { userId: "admin-id", role: "admin" },
  });
});

describe("Warhome user detail boundary", () => {
  it("exige autorización antes de leer Auth o tablas internas", async () => {
    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "unauthenticated" });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn() });

    await expect(getWarhomeUserDetail(USER_ID)).rejects.toThrow("authorization failed");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("rechaza un UUID inválido y un usuario inexistente", async () => {
    mocks.getSupabaseAdmin.mockReturnValue({ auth: { admin: { getUserById: vi.fn() } } });
    await expect(getWarhomeUserDetail("not-a-uuid")).rejects.toThrow("user not found");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();

    const getUserById = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
    mocks.getSupabaseAdmin.mockReturnValue({ auth: { admin: { getUserById } } });
    await expect(getWarhomeUserDetail(USER_ID)).rejects.toThrow("user not found");
  });

  it("selecciona solo el contrato cerrado y compone el detalle", async () => {
    const queries = configureSuccessfulDetail();
    const detail = await getWarhomeUserDetail(USER_ID);

    expect(queries.getUserById).toHaveBeenCalledWith(USER_ID);
    expect(queries.profileQuery.select).toHaveBeenCalledWith(WARHOME_USER_PROFILE_SELECT);
    expect(queries.progressQuery.select).toHaveBeenCalledWith(WARHOME_USER_PROGRESS_SELECT);
    expect(queries.exercisesQuery.select).toHaveBeenCalledWith(
      WARHOME_USER_COMPLETED_EXERCISES_SELECT,
    );
    expect(queries.missionsQuery.select).toHaveBeenCalledWith(WARHOME_USER_COMPLETED_MISSIONS_SELECT);
    expect(queries.sessionsQuery.select).toHaveBeenCalledWith(WARHOME_USER_RECENT_SESSIONS_SELECT);
    expect(queries.sessionsQuery.order).toHaveBeenCalledWith("occurred_at", { ascending: false });
    expect(queries.sessionsQuery.range).toHaveBeenCalledWith(0, 19);
    expect(queries.leadQuery.select).toHaveBeenCalledWith(WARHOME_USER_LEAD_SELECT);
    expect(queries.subscriptionsQuery.select).toHaveBeenCalledWith(WARHOME_USER_MARKETING_SELECT);
    expect(detail).toMatchObject({
      identity: { email: "pilot@example.com", emailConfirmed: true },
      profile: { fullName: "Piloto de prueba", isIncomplete: false },
      aerocomms: { status: "active", completedExerciseCount: 1, completedMissionCount: 1 },
      lead: { id: LEAD_ID },
      marketing: { status: "subscribed" },
      purchases: { status: "not_available" },
    });
    expect(detail.recentSessions).toEqual([
      expect.objectContaining({ activityType: "exercise", label: "Ejercicio de entrenamiento" }),
    ]);
  });

  it("mantiene estados vacíos de perfil, progreso y lead sin fabricar datos", async () => {
    configureSuccessfulDetail({
      profile: null,
      progress: null,
      exercises: [],
      missions: [],
      sessions: [],
      lead: null,
    });

    const detail = await getWarhomeUserDetail(USER_ID);

    expect(detail.profile).toMatchObject({ fullName: null, isIncomplete: true });
    expect(detail.aerocomms).toMatchObject({ status: "not_synced", hasProgress: false });
    expect(detail.recentSessions).toEqual([]);
    expect(detail.lead).toBeNull();
    expect(detail.marketing).toEqual({ status: "not_applicable", subscriptions: [] });
  });

  it("deduplica ejercicios y misiones entre versiones antes de contar", async () => {
    configureSuccessfulDetail({
      exercises: [{ exercise_id: "exercise-a" }, { exercise_id: "exercise-a" }],
      missions: [{ mission_id: "mission-a" }, { mission_id: "mission-a" }],
    });

    const detail = await getWarhomeUserDetail(USER_ID);
    expect(detail.aerocomms.completedExerciseCount).toBe(1);
    expect(detail.aerocomms.completedMissionCount).toBe(1);
  });

  it("devuelve solo la puntuación operativa y excluye metadata Auth, IDs de sesión y campos sensibles", async () => {
    configureSuccessfulDetail({
      sessions: [
        {
          activity_type: "mission",
          source: "atc-mission",
          level_id: "ready-for-radio",
          is_scored: true,
          occurred_at: "2026-07-14T10:00:00.000Z",
          activity_date: "2026-07-14",
          client_session_id: "never expose",
          score: 99,
          stars: 3,
        },
      ],
    });

    const detail = await getWarhomeUserDetail(USER_ID);
    const serialized = JSON.stringify(detail);

    expect(serialized).not.toContain("user_metadata");
    expect(serialized).not.toContain("app_metadata");
    expect(serialized).not.toContain("identities");
    expect(serialized).not.toContain("client_session_id");
    expect(serialized).not.toContain('"stars"');
    expect(serialized).not.toContain("payload_hash");
    expect(serialized).not.toContain("operation_id");
    expect(serialized).not.toContain("contentVersion");
    expect(serialized).not.toContain("schemaVersion");
    expect(detail.recentSessions).toEqual([
      expect.objectContaining({ score: 99, isScored: true }),
    ]);
  });

  it("mantiene marketing separado y no consulta suscripciones sin lead", async () => {
    const queries = configureSuccessfulDetail({ lead: null });
    const detail = await getWarhomeUserDetail(USER_ID);

    expect(detail.marketing.status).toBe("not_applicable");
    expect(queries.from).not.toHaveBeenCalledWith("email_subscriptions");
  });

  it("acota cada consulta al usuario solicitado sin N+1", async () => {
    const queries = configureSuccessfulDetail();
    await getWarhomeUserDetail(USER_ID);

    for (const query of [
      queries.profileQuery,
      queries.progressQuery,
      queries.exercisesQuery,
      queries.missionsQuery,
      queries.sessionsQuery,
      queries.leadQuery,
    ]) {
      expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID);
    }
    expect(queries.subscriptionsQuery.eq).toHaveBeenCalledWith("lead_id", LEAD_ID);
    expect(queries.from).toHaveBeenCalledTimes(7);
  });

  it("descarta sesiones corruptas en lugar de presentar puntuaciones inválidas", async () => {
    configureSuccessfulDetail({
      sessions: [{
        activity_type: "exercise",
        source: "train",
        level_id: "cadet",
        score: 101,
        is_scored: true,
        occurred_at: "2026-07-14T10:00:00.000Z",
        activity_date: "2026-07-14",
      }],
    });

    const detail = await getWarhomeUserDetail(USER_ID);
    expect(detail.recentSessions).toEqual([]);
  });
});
