import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWarhomeAuthorization: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/warhome/auth", () => ({ getWarhomeAuthorization: mocks.getWarhomeAuthorization }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));

import {
  getWarhomeEmailsDashboard,
  getWarhomeEmailActivityDateLines,
  getWarhomeEmailsDisplayState,
  getWarhomeEmailActivitySummary,
  getWarhomeEmailsRange,
  getWarhomeEmailsUrl,
  parseWarhomeEmailFilters,
  sanitizeWarhomeEmailLastError,
  sanitizeWarhomeEmailSearch,
  toWarhomeEmailListRow,
  WARHOME_EMAILS_LOAD_ERROR_MESSAGE,
  WARHOME_EMAILS_SELECT,
  WARHOME_EMAIL_DELIVERY_STATUS_LABELS,
  WARHOME_EMAIL_TEMPLATE_LABELS,
} from "./emails";

function createCountQuery(count = 0) {
  const query = {
    eq: vi.fn(() => query),
    gt: vi.fn(() => query),
    not: vi.fn(() => query),
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
    gt: vi.fn(() => query),
    not: vi.fn(() => query),
    then: (resolve: (value: { data: unknown[]; count: number; error: null }) => unknown) =>
      Promise.resolve({
        data: [
          {
            id: "job-id",
            lead_id: "lead-id",
            template_key: "career_planner_confirmation",
            status: "sent",
            attempt_count: 1,
            max_attempts: 3,
            scheduled_for: "2026-07-12T10:00:00.000Z",
            sent_at: "2026-07-12T10:01:00.000Z",
            failed_at: null,
            last_error: null,
            created_at: "2026-07-12T10:00:00.000Z",
            leads: { full_name: "Pilot Example", email: "pilot@example.com" },
            email_deliveries: [
              {
                job_id: "job-id",
                provider: "resend",
                status: "accepted",
                attempt_number: 1,
                provider_message_id: "provider-message-id",
                recipient_email: "pilot@example.com",
                subject: "Asunto fijo",
                from_email: "sender@flypath.es",
                attempted_at: "2026-07-12T10:01:00.000Z",
                accepted_at: "2026-07-12T10:01:02.000Z",
                delivered_at: null,
                bounced_at: null,
                failed_at: null,
                provider_response: { sensitive: "never expose" },
              },
            ],
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

describe("Warhome email filters", () => {
  it("sanitizes search and rejects unknown filters", () => {
    expect(sanitizeWarhomeEmailSearch("  Ana,(test)%@example.com  ")).toBe("Anatest@example.com");
    expect(parseWarhomeEmailFilters({
      q: "  Ana,(test)%@example.com  ",
      template: "unknown",
      job_status: "drop table",
      delivery_status: "accepted",
      activity: "unknown",
      page: "0",
    })).toEqual({
      query: "Anatest@example.com",
      templateKey: null,
      jobStatus: null,
      deliveryStatus: "accepted",
      activity: null,
      page: 1,
    });
  });

  it("preserves combined filters when paginating", () => {
    const filters = parseWarhomeEmailFilters({
      q: "pilot@example.com",
      template: "mentorship_internal_alert",
      job_status: "sent",
      delivery_status: "accepted",
      activity: "clicked",
    });

    expect(getWarhomeEmailsUrl(filters, 2)).toBe(
      "/warhome/emails?q=pilot%40example.com&template=mentorship_internal_alert&job_status=sent&delivery_status=accepted&activity=clicked&page=2",
    );
    expect(getWarhomeEmailsRange(2)).toEqual({ from: 20, to: 39 });
  });

  it("maps template labels, error summaries, and empty states without raw errors", () => {
    expect(WARHOME_EMAIL_TEMPLATE_LABELS.mentorship_internal_alert).toBe("Aviso interno acompañamiento");
    expect(sanitizeWarhomeEmailLastError("email_provider_send_failed")).toBe("Error del proveedor");
    expect(sanitizeWarhomeEmailLastError("pilot@example.com failure")).toBe("Error de procesamiento");
    expect(getWarhomeEmailsDisplayState([], parseWarhomeEmailFilters({}))).toBe("empty");
    expect(getWarhomeEmailsDisplayState([], parseWarhomeEmailFilters({ template: "preppl_waitlist_confirmation" }))).toBe("filtered_empty");
  });

  it("maps real delivery labels and compact engagement without reading claims", () => {
    expect(WARHOME_EMAIL_DELIVERY_STATUS_LABELS.accepted).toBe("Aceptado");
    expect(WARHOME_EMAIL_DELIVERY_STATUS_LABELS.delivered).toBe("Entregado");
    expect(WARHOME_EMAIL_DELIVERY_STATUS_LABELS.bounced).toBe("Rebotado");
    expect(WARHOME_EMAIL_DELIVERY_STATUS_LABELS.failed).toBe("Fallido");
    expect(getWarhomeEmailActivitySummary(null)).toBe("Sin actividad");
    expect(getWarhomeEmailActivitySummary({ openCount: 0, clickCount: 0 })).toBe("Sin actividad");
    expect(getWarhomeEmailActivitySummary({ openCount: 2, clickCount: 0 })).toBe("Abierto 2");
    expect(getWarhomeEmailActivitySummary({ openCount: 0, clickCount: 3 })).toBe("Clic 3");
    expect(getWarhomeEmailActivitySummary({ openCount: 2, clickCount: 3 })).toBe("Abierto 2 · Clic 3");
  });

  it("returns only real activity dates with compact labels", () => {
    const openAt = "2026-07-12T10:04:00.000Z";
    const laterOpenAt = "2026-07-12T10:06:00.000Z";
    const clickAt = "2026-07-12T10:05:00.000Z";
    const laterClickAt = "2026-07-12T10:08:00.000Z";

    expect(getWarhomeEmailActivityDateLines(null)).toEqual([]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 0,
      clickCount: 0,
      firstOpenedAt: openAt,
      lastOpenedAt: laterOpenAt,
      firstClickedAt: clickAt,
      lastClickedAt: laterClickAt,
    })).toEqual([]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 1,
      clickCount: 1,
      firstOpenedAt: null,
      lastOpenedAt: null,
      firstClickedAt: null,
      lastClickedAt: null,
    })).toEqual([]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 1,
      clickCount: 0,
      firstOpenedAt: openAt,
      lastOpenedAt: openAt,
      firstClickedAt: null,
      lastClickedAt: null,
    })).toEqual([{ label: "Apertura", value: openAt }]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 2,
      clickCount: 0,
      firstOpenedAt: openAt,
      lastOpenedAt: laterOpenAt,
      firstClickedAt: null,
      lastClickedAt: null,
    })).toEqual([
      { label: "Primera apertura", value: openAt },
      { label: "Última apertura", value: laterOpenAt },
    ]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 0,
      clickCount: 1,
      firstOpenedAt: null,
      lastOpenedAt: null,
      firstClickedAt: clickAt,
      lastClickedAt: clickAt,
    })).toEqual([{ label: "Clic", value: clickAt }]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 0,
      clickCount: 2,
      firstOpenedAt: null,
      lastOpenedAt: null,
      firstClickedAt: clickAt,
      lastClickedAt: laterClickAt,
    })).toEqual([
      { label: "Primer clic", value: clickAt },
      { label: "Último clic", value: laterClickAt },
    ]);
    expect(getWarhomeEmailActivityDateLines({
      openCount: 1,
      clickCount: 1,
      firstOpenedAt: openAt,
      lastOpenedAt: openAt,
      firstClickedAt: clickAt,
      lastClickedAt: clickAt,
    })).toEqual([
      { label: "Apertura", value: openAt },
      { label: "Clic", value: clickAt },
    ]);
  });
});

describe("Warhome email data boundary", () => {
  it("requires authorization before creating any query", async () => {
    mocks.getWarhomeAuthorization.mockResolvedValue({ status: "unauthenticated" });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn() });

    await expect(getWarhomeEmailsDashboard({})).rejects.toThrow("authorization failed");
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("uses a closed select and combined server-side filters", async () => {
    const listQuery = createListQuery();
    const select = vi.fn((columns: string, options?: { head?: boolean }) =>
      options?.head ? createCountQuery(1) : listQuery,
    );
    const from = vi.fn(() => ({ select }));
    mocks.getSupabaseAdmin.mockReturnValue({ from });

    const dashboard = await getWarhomeEmailsDashboard({
      q: "pilot@example.com",
      template: "career_planner_confirmation",
      job_status: "sent",
      delivery_status: "accepted",
      activity: "opened",
      page: "2",
    });

    expect(select).toHaveBeenCalledWith(
      expect.stringContaining("email_deliveries!inner("),
      { count: "exact" },
    );
    expect(listQuery.range).toHaveBeenCalledWith(20, 39);
    expect(listQuery.or).toHaveBeenCalledWith(
      "full_name.ilike.%pilot@example.com%,email.ilike.%pilot@example.com%",
      { foreignTable: "leads" },
    );
    expect(listQuery.eq).toHaveBeenCalledWith("job_type", "transactional");
    expect(listQuery.eq).toHaveBeenCalledWith("template_key", "career_planner_confirmation");
    expect(listQuery.eq).toHaveBeenCalledWith("status", "sent");
    expect(listQuery.eq).toHaveBeenCalledWith("email_deliveries.status", "accepted");
    expect(listQuery.gt).toHaveBeenCalledWith("email_deliveries.open_count", 0);
    expect(dashboard.rows).toHaveLength(1);
    expect(dashboard.totalResults).toBe(21);
  });

  it("excludes sequence jobs from the listing and global metrics", async () => {
    const listQuery = createListQuery();
    const countQueries: ReturnType<typeof createCountQuery>[] = [];
    const select = vi.fn((_: string, options?: { head?: boolean }) => {
      if (options?.head) {
        const countQuery = createCountQuery(1);
        countQueries.push(countQuery);
        return countQuery;
      }

      return listQuery;
    });
    mocks.getSupabaseAdmin.mockReturnValue({
      from: vi.fn(() => ({ select })),
    } as never);

    await getWarhomeEmailsDashboard({});

    expect(listQuery.eq).toHaveBeenCalledWith("job_type", "transactional");
    expect(countQueries).toHaveLength(4);
    for (const countQuery of countQueries) {
      expect(countQuery.eq).toHaveBeenCalledWith("job_type", "transactional");
    }
  });

  it("corrects an invalid high page to the last valid page", async () => {
    const listQuery = createListQuery();
    const select = vi.fn((columns: string, options?: { head?: boolean }) =>
      options?.head ? createCountQuery(1) : listQuery,
    );
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ select })) });

    const dashboard = await getWarhomeEmailsDashboard({ page: "3" });

    expect(dashboard.filters.page).toBe(2);
    expect(listQuery.range).toHaveBeenCalledWith(40, 59);
    expect(listQuery.range).toHaveBeenCalledWith(20, 39);
  });

  it("does not expose provider responses, internal ids, or full provider message ids", () => {
    const row = toWarhomeEmailListRow({
      id: "job-id",
      lead_id: "never expose",
      template_key: "mentorship_internal_alert",
      status: "failed",
      attempt_count: 1,
      max_attempts: 3,
      scheduled_for: "2026-07-12T10:00:00.000Z",
      sent_at: null,
      failed_at: "2026-07-12T10:01:00.000Z",
      last_error: "pilot@example.com failure",
      created_at: "2026-07-12T10:00:00.000Z",
      leads: { full_name: "Pilot Example", email: "pilot@example.com", user_id: "never expose" },
      email_deliveries: [
        {
          job_id: "job-id",
          provider: "resend",
          status: "failed",
          attempt_number: 1,
          provider_message_id: "never expose",
          recipient_email: "operaciones@flypath.es",
          subject: "Asunto interno",
          from_email: "sender@flypath.es",
          attempted_at: "2026-07-12T10:01:00.000Z",
          accepted_at: null,
          delivered_at: null,
          bounced_at: null,
          failed_at: "2026-07-12T10:01:00.000Z",
          provider_response: { secret: "never expose" },
        },
      ],
    });

    expect(row).toEqual(expect.objectContaining({
      templateKey: "mentorship_internal_alert",
      lastError: "Error de procesamiento",
      delivery: expect.objectContaining({ hasProviderMessageId: true }),
    }));
    expect(row).not.toHaveProperty("id");
    expect(row).not.toHaveProperty("leadId");
    expect(row).not.toHaveProperty("providerResponse");
    expect(JSON.stringify(row)).not.toContain("never expose");
    expect(WARHOME_EMAILS_SELECT).not.toMatch(
      /provider_response|idempotency_key|enrollment_id|sequence_step_id|metadata|body_html|body_text|email_webhook_events|provider_event_id|payload|headers/,
    );
  });

  it("maps engagement, complaint, and suppression fields without provider identifiers", () => {
    const row = toWarhomeEmailListRow({
      template_key: "career_planner_confirmation",
      status: "sent",
      attempt_count: 1,
      max_attempts: 3,
      scheduled_for: "2026-07-12T10:00:00.000Z",
      sent_at: "2026-07-12T10:01:00.000Z",
      failed_at: null,
      last_error: null,
      created_at: "2026-07-12T10:00:00.000Z",
      leads: { full_name: "Pilot Example", email: "pilot@example.com" },
      email_deliveries: [{
        provider: "resend",
        status: "delivered",
        attempt_number: 1,
        provider_message_id: "provider-id-never-exposed",
        recipient_email: "pilot@example.com",
        subject: "Asunto fijo",
        from_email: "sender@flypath.es",
        attempted_at: "2026-07-12T10:01:00.000Z",
        accepted_at: "2026-07-12T10:01:02.000Z",
        delivered_at: "2026-07-12T10:02:00.000Z",
        bounced_at: null,
        failed_at: null,
        first_opened_at: "2026-07-12T10:04:00.000Z",
        last_opened_at: "2026-07-12T10:06:00.000Z",
        open_count: 2,
        first_clicked_at: "2026-07-12T10:05:00.000Z",
        last_clicked_at: "2026-07-12T10:05:00.000Z",
        click_count: 1,
        complained_at: "2026-07-12T10:07:00.000Z",
        suppressed_at: "2026-07-12T10:08:00.000Z",
      }],
    });

    expect(row?.delivery).toMatchObject({
      status: "delivered",
      openCount: 2,
      clickCount: 1,
      complainedAt: "2026-07-12T10:07:00.000Z",
      suppressedAt: "2026-07-12T10:08:00.000Z",
    });
    expect(JSON.stringify(row)).not.toContain("provider-id-never-exposed");
  });

  it("applies each closed activity filter server-side", async () => {
    for (const [activity, column, method] of [
      ["opened", "email_deliveries.open_count", "gt"],
      ["clicked", "email_deliveries.click_count", "gt"],
      ["complained", "email_deliveries.complained_at", "not"],
      ["suppressed", "email_deliveries.suppressed_at", "not"],
    ] as const) {
      const listQuery = createListQuery();
      const select = vi.fn((_: string, options?: { head?: boolean }) =>
        options?.head ? createCountQuery(1) : listQuery,
      );
      mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn(() => ({ select })) });

      await getWarhomeEmailsDashboard({ activity });

      if (method === "gt") expect(listQuery.gt).toHaveBeenCalledWith(column, 0);
      else expect(listQuery.not).toHaveBeenCalledWith(column, "is", "null");
      expect(select).toHaveBeenCalledWith(expect.stringContaining("email_deliveries!inner("), { count: "exact" });
    }
  });

  it("keeps the email table responsive and excludes webhook details from the client surface", () => {
    const table = readFileSync(path.join(process.cwd(), "components/warhome/WarhomeEmailsTable.tsx"), "utf8");

    expect(table).toContain("overflow-x-auto");
    expect(table).toContain("min-w-[1240px]");
    expect(table).toContain("Actividad");
    expect(table).toContain("Queja");
    expect(table).toContain("Suprimido");
    expect(table).not.toContain("provider_message_id");
    expect(table).not.toContain("email_webhook_events");
    expect(table).not.toContain("click.link");
    expect(table).not.toContain("Leído");
  });

  it("represents a job with no delivery and keeps a generic load error", () => {
    const row = toWarhomeEmailListRow({
      template_key: "preppl_waitlist_confirmation",
      status: "pending",
      attempt_count: 0,
      max_attempts: 3,
      scheduled_for: "2026-07-12T10:00:00.000Z",
      sent_at: null,
      failed_at: null,
      last_error: null,
      created_at: "2026-07-12T10:00:00.000Z",
      leads: { full_name: null, email: "pilot@example.com" },
      email_deliveries: [],
    });

    expect(row?.delivery).toBeNull();
    expect(WARHOME_EMAILS_LOAD_ERROR_MESSAGE).not.toMatch(/supabase|sql|database/i);
  });
});
