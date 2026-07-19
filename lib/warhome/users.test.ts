import { readFileSync } from "node:fs";
import path from "node:path";
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
  deriveWarhomeAeroCommsStatus,
  deriveWarhomeMarketingStatus,
  getWarhomeUsersDirectory,
  getWarhomeUsersDisplayState,
  getWarhomeUsersOffset,
  getWarhomeUsersUrl,
  parseWarhomeUserListParameters,
  sanitizeWarhomeUserSearch,
  toWarhomeUserDirectoryItem,
  WARHOME_USERS_LOAD_ERROR_MESSAGE,
  WARHOME_USERS_RPC_NAME,
} from "./users";

const USER_ID = "5a63c9bf-b72e-4c61-a23f-76b40bb91723";
const LEAD_ID = "2c0d0d42-f8ec-4fc3-bb19-64b8ad15d22e";

function activeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId: USER_ID,
    email: "pilot@example.com",
    emailConfirmed: true,
    createdAt: "2026-07-12T10:00:00.000Z",
    lastSignInAt: "2026-07-13T10:00:00.000Z",
    fullName: "Piloto de prueba",
    profileIncomplete: false,
    hasAeroCommsProgress: true,
    sessionCount: 4,
    scoredSessionCount: 3,
    lastAeroCommsActivityAt: "2026-07-14T10:00:00.000Z",
    lastAeroCommsActivityDate: "2026-07-14",
    streakDays: 2,
    legacyImportedAt: "2026-07-13T10:00:00.000Z",
    resetAt: "2026-07-14T09:00:00.000Z",
    completedExerciseCount: 2,
    completedMissionCount: 1,
    hasLead: true,
    leadId: LEAD_ID,
    marketingStatus: "subscribed",
    aerocommsStatus: "active",
    ...overrides,
  };
}

function createRpcResult(rows: unknown[] = [activeUser()], total = 21) {
  return { data: { total, rows }, error: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWarhomeAuthorization.mockResolvedValue({
    status: "authorized",
    admin: { userId: "admin-id", role: "admin" },
  });
});

describe("Warhome user list parameters", () => {
  it("normaliza búsqueda, filtros, orden y página", () => {
    expect(sanitizeWarhomeUserSearch("  Ana,(test)%@example.com  ")).toBe(
      "Anatest@example.com",
    );
    expect(
      parseWarhomeUserListParameters({
        q: " Ana,(test)%@example.com ",
        aerocomms: "active",
        lead: "linked",
        marketing: "subscribed",
        confirmed: "confirmed",
        profile: "complete",
        sort: "last_aerocomms_activity_at",
        direction: "asc",
        page: "2",
      }),
    ).toEqual({
      filters: {
        query: "Anatest@example.com",
        aerocommsStatus: "active",
        lead: "linked",
        marketingStatus: "subscribed",
        emailConfirmation: "confirmed",
        profile: "complete",
      },
      sort: { field: "last_aerocomms_activity_at", direction: "asc" },
      page: 2,
    });
  });

  it("ignora parámetros inválidos y limita la búsqueda", () => {
    const normalized = parseWarhomeUserListParameters({
      q: "a".repeat(100),
      aerocomms: "unknown",
      lead: "drop table",
      marketing: "all",
      confirmed: "maybe",
      profile: "other",
      sort: "metadata",
      direction: "sideways",
      page: "0",
    });

    expect(normalized.filters).toMatchObject({
      query: "a".repeat(80),
      aerocommsStatus: null,
      lead: null,
      marketingStatus: null,
      emailConfirmation: null,
      profile: null,
    });
    expect(normalized.sort).toEqual({ field: "created_at", direction: "desc" });
    expect(normalized.page).toBe(1);
  });

  it("preserva parámetros normalizados al construir URLs y paginación", () => {
    const parameters = parseWarhomeUserListParameters({
      q: "pilot@example.com",
      aerocomms: "active",
      lead: "linked",
      marketing: "subscribed",
      confirmed: "confirmed",
      profile: "complete",
      sort: "last_sign_in_at",
      direction: "asc",
    });

    expect(getWarhomeUsersUrl(parameters, 2)).toBe(
      "/warhome/users?q=pilot%40example.com&aerocomms=active&lead=linked&marketing=subscribed&confirmed=confirmed&profile=complete&sort=last_sign_in_at&direction=asc&page=2",
    );
    expect(getWarhomeUsersOffset(1)).toBe(0);
    expect(getWarhomeUsersOffset(2)).toBe(20);
  });
});

describe("Warhome user directory contract", () => {
  it("representa un usuario con perfil, actividad, importación, reset, lead y marketing", () => {
    expect(toWarhomeUserDirectoryItem(activeUser())).toMatchObject({
      userId: USER_ID,
      fullName: "Piloto de prueba",
      profileIncomplete: false,
      sessionCount: 4,
      scoredSessionCount: 3,
      completedExerciseCount: 2,
      completedMissionCount: 1,
      legacyImportedAt: "2026-07-13T10:00:00.000Z",
      resetAt: "2026-07-14T09:00:00.000Z",
      hasLead: true,
      leadId: LEAD_ID,
      marketingStatus: "subscribed",
      aerocommsStatus: "active",
    });
  });

  it("admite perfil ausente, cuenta sin progreso y sin lead", () => {
    expect(
      toWarhomeUserDirectoryItem(
        activeUser({
          fullName: null,
          profileIncomplete: true,
          hasAeroCommsProgress: false,
          sessionCount: 0,
          scoredSessionCount: 0,
          lastAeroCommsActivityAt: null,
          lastAeroCommsActivityDate: null,
          streakDays: 0,
          legacyImportedAt: null,
          resetAt: null,
          completedExerciseCount: 0,
          completedMissionCount: 0,
          hasLead: false,
          leadId: null,
          marketingStatus: "not_applicable",
          aerocommsStatus: "not_synced",
          emailConfirmed: false,
        }),
      ),
    ).toMatchObject({
      fullName: null,
      profileIncomplete: true,
      hasAeroCommsProgress: false,
      aerocommsStatus: "not_synced",
      marketingStatus: "not_applicable",
      emailConfirmed: false,
    });
  });

  it("deriva los mismos estados de AeroComms y marketing que el detalle", () => {
    expect(
      deriveWarhomeAeroCommsStatus({
        hasProgress: true,
        sessionCount: 0,
        lastActivityAt: null,
        lastActivityDate: null,
      }),
    ).toBe("no_activity");
    expect(
      deriveWarhomeMarketingStatus({ hasLead: true, hasActiveSubscription: false }),
    ).toBe("not_subscribed");
  });

  it("rechaza combinaciones incoherentes o progreso inválido", () => {
    expect(toWarhomeUserDirectoryItem(activeUser({ hasLead: false }))).toBeNull();
    expect(
      toWarhomeUserDirectoryItem(activeUser({ sessionCount: 2, scoredSessionCount: 3 })),
    ).toBeNull();
    expect(toWarhomeUserDirectoryItem(activeUser({ hasAeroCommsProgress: false }))).toBeNull();
  });

  it("no serializa propiedades sensibles ni relaciones crudas", () => {
    const item = toWarhomeUserDirectoryItem(
      activeUser({
        user_metadata: { arbitrary: "never expose" },
        app_metadata: { arbitrary: "never expose" },
        identities: [{ arbitrary: "never expose" }],
        client_session_id: "never expose",
        payload_hash: "never expose",
      }),
    );

    expect(item).not.toHaveProperty("user_metadata");
    expect(item).not.toHaveProperty("app_metadata");
    expect(item).not.toHaveProperty("identities");
    expect(item).not.toHaveProperty("client_session_id");
    expect(item).not.toHaveProperty("payload_hash");
  });
});

describe("Warhome user directory data boundary", () => {
  it("exige autorización antes de consultar el RPC", async () => {
    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "not_admin", userId: USER_ID });
    mocks.getSupabaseAdmin.mockReturnValue({ rpc: vi.fn() });

    await expect(getWarhomeUsersDirectory({})).rejects.toThrow("authorization failed");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("envía filtros combinados, orden y paginación, y devuelve el contrato estable", async () => {
    const rpc = vi.fn().mockResolvedValue(createRpcResult());
    mocks.getSupabaseAdmin.mockReturnValue({ rpc });

    const directory = await getWarhomeUsersDirectory({
      q: "pilot@example.com",
      aerocomms: "active",
      lead: "linked",
      marketing: "subscribed",
      confirmed: "confirmed",
      profile: "complete",
      sort: "last_sign_in_at",
      direction: "asc",
      page: "2",
    });

    expect(rpc).toHaveBeenCalledWith(WARHOME_USERS_RPC_NAME, {
      p_query: "pilot@example.com",
      p_aerocomms_status: "active",
      p_has_lead: true,
      p_marketing_status: "subscribed",
      p_email_confirmed: true,
      p_profile_incomplete: false,
      p_sort_by: "last_sign_in_at",
      p_sort_direction: "asc",
      p_limit: 20,
      p_offset: 20,
    });
    expect(directory).toMatchObject({
      page: 2,
      pageSize: 20,
      total: 21,
      totalPages: 2,
      filters: { query: "pilot@example.com", aerocommsStatus: "active" },
      sort: { field: "last_sign_in_at", direction: "asc" },
    });
    expect(directory.items).toHaveLength(1);
  });

  it("corrige páginas fuera de rango usando el total exacto del RPC", async () => {
    const rpc = vi.fn().mockResolvedValue(createRpcResult([], 21));
    mocks.getSupabaseAdmin.mockReturnValue({ rpc });

    const directory = await getWarhomeUsersDirectory({ page: "3" });

    expect(directory.page).toBe(2);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0][1].p_offset).toBe(40);
    expect(rpc.mock.calls[1][1].p_offset).toBe(20);
  });

  it("rechaza una respuesta RPC malformada sin exponer detalles", async () => {
    mocks.getSupabaseAdmin.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: { total: 1, rows: [{}] }, error: null }),
    });

    await expect(getWarhomeUsersDirectory({})).rejects.toThrow("users data failed");
    expect(WARHOME_USERS_LOAD_ERROR_MESSAGE).not.toMatch(/supabase|sql|database/i);
  });

  it("distingue estado vacío y tabla", () => {
    expect(getWarhomeUsersDisplayState([])).toBe("empty");
    expect(getWarhomeUsersDisplayState([activeUser() as never])).toBe("table");
  });
});

describe("Warhome user directory migration", () => {
  it("mantiene agregados deduplicados y permisos solo de service role", () => {
    const migration = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260712120000_create_warhome_user_directory.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_warhome_user_directory");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("FROM auth.users u");
    expect(migration).toContain("lower(u.email) LIKE");
    expect(migration).toContain("lower(coalesce(p.full_name, '')) LIKE");
    expect(migration).toContain("count(DISTINCT exercise.exercise_id)");
    expect(migration).toContain("count(DISTINCT mission.mission_id)");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).not.toMatch(/user_metadata|app_metadata|identities|client_session_id|payload_hash/);
  });

  it("mantiene el directorio y el detalle como proyecciones de solo lectura", () => {
    const usersSource = readFileSync(path.join(process.cwd(), "lib/warhome/users.ts"), "utf8");
    const detailSource = readFileSync(path.join(process.cwd(), "lib/warhome/user-detail.ts"), "utf8");

    for (const source of [usersSource, detailSource]) {
      expect(source).not.toMatch(/\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
      expect(source).not.toContain("user_events");
      expect(source).not.toContain("aerocomms_sync_receipts");
    }
  });
});
