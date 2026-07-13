import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createTransactionalEmailJob,
  EMAIL_JOB_SELECT,
  releaseTransactionalEmailJobAfterFailure,
} from "./jobs";

const LEAD_ID = "4d3c2b1a-1234-4abc-8def-1234567890ab";
const KEY_A = "5d3c2b1a-1234-4abc-8def-1234567890ab";
const KEY_B = "6d3c2b1a-1234-4abc-8def-1234567890ab";
const JOB = {
  id: "7d3c2b1a-1234-4abc-8def-1234567890ab",
  lead_id: LEAD_ID,
  template_key: "career_planner_confirmation",
  status: "pending",
  attempt_count: 0,
  max_attempts: 3,
};

function createAdmin(insertResult: { data: unknown; error: unknown }, existingResult?: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(insertResult);
  const maybeSingle = vi.fn().mockResolvedValue(existingResult);
  const insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }));
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) })),
  }));
  const from = vi.fn(() => ({ insert, select }));
  return { from, insert, select, single, maybeSingle };
}

describe("transactional email jobs", () => {
  it("inserts a closed, one-shot job for a conversion", async () => {
    const admin = createAdmin({ data: JOB, error: null });

    await expect(
      createTransactionalEmailJob(admin as never, {
        leadId: LEAD_ID,
        templateKey: "career_planner_confirmation",
        idempotencyKey: KEY_A,
        scheduledFor: "2026-07-12T10:00:00.000Z",
      }),
    ).resolves.toMatchObject({ created: true, job: { id: JOB.id, leadId: LEAD_ID } });

    expect(admin.from).toHaveBeenCalledWith("email_jobs");
    expect(admin.insert).toHaveBeenCalledWith({
      job_type: "transactional",
      template_key: "career_planner_confirmation",
      idempotency_key: KEY_A,
      lead_id: LEAD_ID,
      status: "pending",
      scheduled_for: "2026-07-12T10:00:00.000Z",
      enrollment_id: null,
      sequence_step_id: null,
    });
    expect(admin.single).toHaveBeenCalledWith();
  });

  it("uses the database unique violation to return the existing job for the same key", async () => {
    const admin = createAdmin({ data: null, error: { code: "23505" } }, { data: JOB, error: null });

    await expect(
      createTransactionalEmailJob(admin as never, {
        leadId: LEAD_ID,
        templateKey: "career_planner_confirmation",
        idempotencyKey: KEY_A,
      }),
    ).resolves.toMatchObject({ created: false, job: { id: JOB.id } });
    expect(admin.select).toHaveBeenCalledWith(EMAIL_JOB_SELECT);

    await expect(
      createTransactionalEmailJob(
        createAdmin({ data: { ...JOB, id: "8d3c2b1a-1234-4abc-8def-1234567890ab" }, error: null }) as never,
        { leadId: LEAD_ID, templateKey: "career_planner_confirmation", idempotencyKey: KEY_B },
      ),
    ).resolves.toMatchObject({ created: true });
  });

  it("returns a failed job to pending while attempts remain, without storing provider details", async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq: secondEq })) }));
    const admin = { from: vi.fn(() => ({ update })) };

    await releaseTransactionalEmailJobAfterFailure(
      admin as never,
      {
        id: JOB.id,
        leadId: LEAD_ID,
        templateKey: "career_planner_confirmation",
        status: "processing",
        attemptCount: 1,
        maxAttempts: 3,
      },
      "2026-07-12T10:00:00.000Z",
    );

    expect(update).toHaveBeenCalledWith({
      status: "pending",
      locked_at: null,
      locked_by: null,
      last_error: "email_provider_send_failed",
    });
  });
});
