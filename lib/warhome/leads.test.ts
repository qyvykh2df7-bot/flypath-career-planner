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
  getWarhomeLeadsDashboard,
  getWarhomeLeadsDisplayState,
  getWarhomeLeadsRange,
  getWarhomeLeadsUrl,
  parseWarhomeLeadFilters,
  sanitizeWarhomeLeadSearch,
  toWarhomeLeadListRow,
  WARHOME_LEADS_LOAD_ERROR_MESSAGE,
  WARHOME_LEADS_SELECT,
} from "./leads";

function createCountQuery(count = 0) {
  const query = {
    eq: vi.fn(() => query),
    then: (resolve: (value: { count: number; error: null }) => unknown) =>
      Promise.resolve({ count, error: null }).then(resolve),
  };

  return query;
}

function createListQuery() {
  const query = {
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    or: vi.fn(() => query),
    eq: vi.fn(() => query),
    then: (resolve: (value: { data: unknown[]; count: number; error: null }) => unknown) =>
      Promise.resolve({
        data: [
          {
            id: "5a63c9bf-b72e-4c61-a23f-76b40bb91723",
            full_name: "Nombre de prueba",
            email: "test@example.com",
            latest_source: "career_planner",
            funnel_stage: "interested",
            status: "active",
            created_at: "2026-07-12T10:00:00.000Z",
            lead_product_interests: [
              {
                status: "interested",
                last_seen_at: "2026-07-12T10:00:00.000Z",
                products: { name: "Career Planner" },
              },
            ],
            email_subscriptions: [{ status: "subscribed" }],
          },
        ],
        count: 21,
        error: null,
      }).then(resolve),
  };

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWarhomeAuthorization.mockResolvedValue({
    status: "authorized",
    admin: { userId: "admin-id", role: "admin" },
  });
});

describe("Warhome lead filters", () => {
  it("sanea búsqueda y rechaza filtros fuera de la taxonomía", () => {
    expect(sanitizeWarhomeLeadSearch("  Ana,(test)%@example.com  ")).toBe(
      "Anatest@example.com",
    );
    expect(
      parseWarhomeLeadFilters({
        q: "  Ana,(test)%@example.com  ",
        source: "unknown",
        stage: "drop table",
        status: "active",
        page: "0",
      }),
    ).toEqual({
      query: "Anatest@example.com",
      source: null,
      funnelStage: null,
      status: "active",
      page: 1,
    });
  });

  it("preserva la combinación de filtros al paginar", () => {
    const filters = parseWarhomeLeadFilters({
      q: "ana@example.com",
      source: "career_planner",
      stage: "interested",
      status: "active",
      page: "1",
    });

    expect(getWarhomeLeadsUrl(filters, 2)).toBe(
      "/warhome/leads?q=ana%40example.com&source=career_planner&stage=interested&status=active&page=2",
    );
  });

  it("calcula rangos paginados de veinte filas", () => {
    expect(getWarhomeLeadsRange(1)).toEqual({ from: 0, to: 19 });
    expect(getWarhomeLeadsRange(2)).toEqual({ from: 20, to: 39 });
  });

  it("distingue el estado vacío de una tabla con resultados", () => {
    expect(getWarhomeLeadsDisplayState([])).toBe("empty");
    expect(getWarhomeLeadsDisplayState([{ id: "lead-id" } as never])).toBe("table");
  });
});

describe("Warhome lead data boundary", () => {
  it("exige autorización antes de crear cualquier consulta", async () => {
    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "unauthenticated" });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn() });

    await expect(getWarhomeLeadsDashboard({})).rejects.toThrow("authorization failed");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("selecciona solo el contrato cerrado y aplica filtros combinables", async () => {
    const listQuery = createListQuery();
    const select = vi.fn((columns: string, options?: { head?: boolean }) =>
      options?.head ? createCountQuery(1) : listQuery,
    );
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ select })) });

    const dashboard = await getWarhomeLeadsDashboard({
      q: "ana@example.com",
      source: "career_planner",
      stage: "interested",
      status: "active",
      page: "2",
    });

    expect(select).toHaveBeenCalledWith(WARHOME_LEADS_SELECT, { count: "exact" });
    expect(listQuery.range).toHaveBeenCalledWith(20, 39);
    expect(listQuery.or).toHaveBeenCalledWith(
      "full_name.ilike.%ana@example.com%,email.ilike.%ana@example.com%",
    );
    expect(listQuery.eq).toHaveBeenCalledWith("latest_source", "career_planner");
    expect(listQuery.eq).toHaveBeenCalledWith("funnel_stage", "interested");
    expect(listQuery.eq).toHaveBeenCalledWith("status", "active");
    expect(dashboard.rows).toHaveLength(1);
    expect(dashboard.totalResults).toBe(21);
  });

  it("devuelve la última página válida cuando el parámetro excede el total", async () => {
    const listQuery = createListQuery();
    const select = vi.fn((columns: string, options?: { head?: boolean }) =>
      options?.head ? createCountQuery(1) : listQuery,
    );
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ select })) });

    const dashboard = await getWarhomeLeadsDashboard({ page: "3" });

    expect(dashboard.filters.page).toBe(2);
    expect(listQuery.range).toHaveBeenCalledWith(40, 59);
    expect(listQuery.range).toHaveBeenCalledWith(20, 39);
  });

  it("no serializa consentimientos, metadata ni relaciones crudas", () => {
    const row = toWarhomeLeadListRow({
      id: "5a63c9bf-b72e-4c61-a23f-76b40bb91723",
      full_name: "Nombre de prueba",
      email: "test@example.com",
      latest_source: "career_planner",
      funnel_stage: "interested",
      status: "active",
      created_at: "2026-07-12T10:00:00.000Z",
      lead_product_interests: [
        {
          status: "interested",
          last_seen_at: "2026-07-12T10:00:00.000Z",
          products: { name: "Career Planner", internal_notes: "never expose" },
        },
      ],
      email_subscriptions: [
        { status: "subscribed", consent_text: "never expose" },
      ],
      metadata: { arbitrary: "never expose" },
      user_id: "never expose",
    });

    expect(row).toEqual({
      id: "5a63c9bf-b72e-4c61-a23f-76b40bb91723",
      fullName: "Nombre de prueba",
      email: "test@example.com",
      latestSource: "career_planner",
      funnelStage: "interested",
      status: "active",
      createdAt: "2026-07-12T10:00:00.000Z",
      primaryInterest: "Career Planner",
      emailSubscriptionStatus: "subscribed",
    });
    expect(WARHOME_LEADS_SELECT).not.toMatch(
      /consent_text|metadata|internal_notes|user_id|anonymous_id|session_id/,
    );
  });

  it("mantiene un mensaje de error genérico", () => {
    expect(WARHOME_LEADS_LOAD_ERROR_MESSAGE).toBe(
      "Inténtalo de nuevo más tarde. El acceso y los datos se mantienen protegidos.",
    );
    expect(WARHOME_LEADS_LOAD_ERROR_MESSAGE).not.toMatch(/supabase|sql|database/i);
  });
});
