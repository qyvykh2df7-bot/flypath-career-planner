import { afterEach, describe, expect, it, vi } from "vitest";

const insert = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));

import { insertUserEvent } from "./capture-shared";

const FIRST_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const SECOND_ID = "5d3c2b1a-1234-4abc-8def-1234567890ab";

const admin = {
  from: vi.fn(() => ({ insert })),
};

function eventOptions(idempotencyKey: string) {
  return {
    leadId: "lead-id",
    eventName: "career_planner_report_download_requested",
    eventCategory: "lead",
    source: "career_planner",
    metadata: { form_id: "career_planner_report" },
    idempotencyKey,
    occurredAt: "2026-07-12T00:00:00.000Z",
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("insertUserEvent idempotency", () => {
  it("trata la misma clave como duplicada y permite un intento con una nueva clave", async () => {
    insert.mockResolvedValueOnce({ error: { code: "23505" } }).mockResolvedValueOnce({ error: null });

    await expect(insertUserEvent(admin as never, eventOptions(FIRST_ID))).resolves.toBe("duplicate");
    await expect(insertUserEvent(admin as never, eventOptions(SECOND_ID))).resolves.toBe("inserted");

    expect(insert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ idempotency_key: FIRST_ID }),
    );
    expect(insert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ idempotency_key: SECOND_ID }),
    );
  });
});
