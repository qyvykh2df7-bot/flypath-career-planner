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
  getSafeWarhomeLeadsReturn,
  getWarhomeActivityRange,
  getWarhomeLeadActivityUrl,
  getWarhomeLeadDetail,
  getWarhomeMarketingSummary,
  isWarhomeLeadId,
  parseWarhomeActivityPage,
  sanitizeWarhomeActivityMetadata,
  sanitizeWarhomeActivityReferrer,
  WARHOME_LEAD_ACTIVITY_SELECT,
  WARHOME_LEAD_DETAIL_SELECT,
  WARHOME_LEAD_INTERESTS_SELECT,
  WARHOME_LEAD_SUBSCRIPTIONS_SELECT,
} from "./lead-detail";
import { getWarhomeLeadDetailUrl } from "./leads";

const LEAD_ID = "5a63c9bf-b72e-4c61-a23f-76b40bb91723";

function createQuery(result: { data: unknown; error: unknown; count?: number | null }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };

  return query;
}

function configureSuccessfulDetail(options?: {
  interests?: unknown[];
  subscriptions?: unknown[];
  activity?: unknown[];
  activityCount?: number;
}) {
  const leadQuery = createQuery({
    data: {
      id: LEAD_ID,
      full_name: "Nombre de prueba",
      email: "test@example.com",
      latest_source: "career_planner",
      funnel_stage: "interested",
      status: "active",
      created_at: "2026-07-12T10:00:00.000Z",
      updated_at: "2026-07-12T12:00:00.000Z",
    },
    error: null,
  });
  const interestsQuery = createQuery({
    data:
      options?.interests ??
      [
        {
          product_id: "1182dc44-807d-48d5-9e4c-05fba77d3a01",
          status: "interested",
          first_seen_at: "2026-07-11T10:00:00.000Z",
          last_seen_at: "2026-07-12T10:00:00.000Z",
          products: { name: "Career Planner" },
        },
      ],
    error: null,
  });
  const subscriptionsQuery = createQuery({
    data:
      options?.subscriptions ??
      [
        {
          list_key: "career_planner",
          status: "subscribed",
          source: "career_planner",
          consented_at: "2026-07-12T10:00:00.000Z",
          unsubscribed_at: null,
          bounced_at: null,
          complained_at: null,
          blocked_at: null,
          email_subscription_events: [
            {
              event_type: "subscribed",
              source: "career_planner",
              occurred_at: "2026-07-12T10:00:00.000Z",
            },
          ],
        },
      ],
    error: null,
  });
  const activityQuery = createQuery({
    data:
      options?.activity ??
      [
        {
          event_name: "form_started",
          event_category: "engagement",
          source: "web",
          occurred_at: "2026-07-12T10:00:00.000Z",
          page_path: "/career-planner",
          referrer: "https://flypath.test/schools?query=private",
          form_id: "career_planner_report",
          email: "never-expose@example.com",
        },
      ],
    count: options?.activityCount ?? 1,
    error: null,
  });
  const from = vi.fn((table: string) => {
    if (table === "leads") return leadQuery;
    if (table === "lead_product_interests") return interestsQuery;
    if (table === "email_subscriptions") return subscriptionsQuery;
    if (table === "user_events") return activityQuery;
    throw new Error(`Unexpected table ${table}`);
  });
  mocks.getSupabaseAdmin.mockReturnValue({ from });

  return { leadQuery, interestsQuery, subscriptionsQuery, activityQuery, from };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getWarhomeAuthorization.mockResolvedValue({
    status: "authorized",
    admin: { userId: "admin-id", role: "admin" },
  });
});

describe("Warhome lead detail boundary", () => {
  it("exige autorización antes de consultar cualquier tabla", async () => {
    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "unauthenticated" });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn() });

    await expect(getWarhomeLeadDetail(LEAD_ID, { activityPage: 1 })).rejects.toThrow(
      "authorization failed",
    );
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("rechaza un UUID inválido sin consultar datos", async () => {
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn() });

    await expect(getWarhomeLeadDetail("not-a-uuid", { activityPage: 1 })).rejects.toThrow(
      "lead not found",
    );
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
    expect(isWarhomeLeadId(LEAD_ID)).toBe(true);
    expect(isWarhomeLeadId("not-a-uuid")).toBe(false);
  });

  it("trata un lead inexistente como no encontrado", async () => {
    const leadQuery = createQuery({ data: null, error: null });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => leadQuery) });

    await expect(getWarhomeLeadDetail(LEAD_ID, { activityPage: 1 })).rejects.toThrow(
      "lead not found",
    );
  });

  it("mantiene selects cerrados para lead, intereses, suscripciones y actividad", async () => {
    const queries = configureSuccessfulDetail();

    const detail = await getWarhomeLeadDetail(LEAD_ID, { activityPage: 1 });

    expect(queries.leadQuery.select).toHaveBeenCalledWith(WARHOME_LEAD_DETAIL_SELECT);
    expect(queries.interestsQuery.select).toHaveBeenCalledWith(WARHOME_LEAD_INTERESTS_SELECT);
    expect(queries.subscriptionsQuery.select).toHaveBeenCalledWith(
      WARHOME_LEAD_SUBSCRIPTIONS_SELECT,
    );
    expect(queries.activityQuery.select).toHaveBeenCalledWith(WARHOME_LEAD_ACTIVITY_SELECT, {
      count: "exact",
    });
    expect(queries.activityQuery.eq).toHaveBeenCalledWith("lead_id", LEAD_ID);
    expect(queries.activityQuery.order).toHaveBeenCalledWith("occurred_at", { ascending: false });
    expect(detail.activity[0]).toMatchObject({
      eventName: "form_started",
      referrer: "flypath.test",
      metadata: { form_id: "career_planner_report" },
    });
    expect(WARHOME_LEAD_ACTIVITY_SELECT).not.toMatch(/(^|,)metadata(,|$)/);
    expect(`${WARHOME_LEAD_DETAIL_SELECT},${WARHOME_LEAD_INTERESTS_SELECT}`).not.toMatch(
      /user_id|anonymous_id|session_id|internal_notes|consent_text/,
    );
    expect(WARHOME_LEAD_SUBSCRIPTIONS_SELECT).toContain(
      "email_subscription_events(event_type,source,occurred_at)",
    );
    expect(WARHOME_LEAD_SUBSCRIPTIONS_SELECT).not.toMatch(/(^|,)id(,|$)|token|consent_text/);
    expect(detail.subscriptions[0]).toMatchObject({
      lastChange: { eventType: "subscribed", source: "career_planner" },
    });
  });

  it("filtra metadata desconocida y claves sensibles aunque estén presentes", () => {
    expect(
      sanitizeWarhomeActivityMetadata({
        form_id: "career_planner_report",
        utm_campaign: "launch",
        landing_page: "/career-planner?private=value",
        full_name: "Nombre privado",
        email: "private@example.com",
        phone: "+34 600 123 123",
        help_text: "texto sensible",
        situation: "texto sensible",
        contact_consent: "sí",
        contact_consent_text: "texto sensible",
        consent_text: "texto sensible",
        unknown_key: "drop",
      }),
    ).toEqual({
      form_id: "career_planner_report",
      utm_campaign: "launch",
      landing_page: "/career-planner",
    });
  });

  it("muestra solo host o ruta segura para referrer", () => {
    expect(sanitizeWarhomeActivityReferrer("https://example.com/a?private=value")).toBe(
      "example.com",
    );
    expect(sanitizeWarhomeActivityReferrer("/schools?private=value")).toBe("/schools");
    expect(sanitizeWarhomeActivityReferrer("mailto:private@example.com")).toBeNull();
  });

  it("pagina actividad con veinte eventos y conserva el return seguro", async () => {
    const queries = configureSuccessfulDetail({ activityCount: 21 });

    const detail = await getWarhomeLeadDetail(LEAD_ID, { activityPage: 2 });
    const returnTo = getSafeWarhomeLeadsReturn(
      "/warhome/leads?q=ana&source=career_planner&page=2&ignored=value",
    );

    expect(getWarhomeActivityRange(2)).toEqual({ from: 20, to: 39 });
    expect(queries.activityQuery.range).toHaveBeenCalledWith(20, 39);
    expect(detail.activityPage).toBe(2);
    expect(detail.activityTotalPages).toBe(2);
    expect(returnTo).toBe("/warhome/leads?q=ana&source=career_planner&page=2");
    expect(getSafeWarhomeLeadsReturn("https://example.com/evil")).toBe("/warhome/leads");
    expect(getWarhomeLeadActivityUrl(LEAD_ID, returnTo, 2)).toContain("activity_page=2");
    expect(
      getWarhomeLeadDetailUrl(LEAD_ID, {
        query: "ana",
        source: "career_planner",
        funnelStage: null,
        status: null,
        page: 2,
      }),
    ).toContain("return=%2Fwarhome%2Fleads%3Fq%3Dana%26source%3Dcareer_planner%26page%3D2");
  });

  it("conserva estados vacíos sin fabricar datos", async () => {
    configureSuccessfulDetail({ interests: [], subscriptions: [], activity: [], activityCount: 0 });

    const detail = await getWarhomeLeadDetail(LEAD_ID, { activityPage: 1 });

    expect(detail.interests).toEqual([]);
    expect(detail.subscriptions).toEqual([]);
    expect(detail.activity).toEqual([]);
    expect(detail.activityTotal).toBe(0);
    expect(detail.marketingSummary).toBe("Sin suscripciones");
  });

  it("deriva el resumen de marketing solo desde suscripciones por lista", () => {
    const subscription = (status: "subscribed" | "unsubscribed") => ({
      listKey: "newsletter",
      status,
      source: "newsletter" as const,
      consentedAt: null,
      unsubscribedAt: null,
      bouncedAt: null,
      complainedAt: null,
      blockedAt: null,
      statusChangedAt: null,
      lastChange: null,
    });

    expect(getWarhomeMarketingSummary([subscription("subscribed")])).toBe("Marketing activo");
    expect(getWarhomeMarketingSummary([subscription("subscribed"), subscription("unsubscribed")])).toBe(
      "Marketing parcialmente activo",
    );
    expect(getWarhomeMarketingSummary([subscription("unsubscribed")])).toBe("Marketing inactivo");
  });

  it("normaliza páginas de actividad inválidas", () => {
    expect(parseWarhomeActivityPage("0")).toBe(1);
    expect(parseWarhomeActivityPage("invalid")).toBe(1);
    expect(parseWarhomeActivityPage("2")).toBe(2);
  });
});
