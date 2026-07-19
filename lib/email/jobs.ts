import "server-only";

import type { getSupabaseAdmin } from "@/lib/supabase/admin";

import { isTransactionalTemplateKey, type TransactionalTemplateKey } from "./templates";

export const EMAIL_JOB_SELECT = "id,lead_id,school_review_id,template_key,status,attempt_count,max_attempts";

export type TransactionalEmailJob = {
  id: string;
  leadId: string | null;
  schoolReviewId?: string | null;
  templateKey: TransactionalTemplateKey;
  status: "pending" | "processing" | "sent" | "failed" | "cancelled";
  attemptCount: number;
  maxAttempts: number;
};

export class EmailJobPersistenceError extends Error {
  constructor() {
    super("Email job persistence failed");
    this.name = "EmailJobPersistenceError";
  }
}

type EmailAdminClient = ReturnType<typeof getSupabaseAdmin>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJobStatus(value: unknown): value is TransactionalEmailJob["status"] {
  return (
    value === "pending" ||
    value === "processing" ||
    value === "sent" ||
    value === "failed" ||
    value === "cancelled"
  );
}

function mapTransactionalJob(value: unknown): TransactionalEmailJob | null {
  if (!isRecord(value) || !isTransactionalTemplateKey(value.template_key) || !isJobStatus(value.status)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    (typeof value.lead_id !== "string" && value.lead_id !== null) ||
    (typeof value.school_review_id !== "string" && value.school_review_id !== null && value.school_review_id !== undefined) ||
    typeof value.attempt_count !== "number" ||
    typeof value.max_attempts !== "number"
  ) {
    return null;
  }

  return {
    id: value.id,
    leadId: value.lead_id,
    schoolReviewId: typeof value.school_review_id === "string" ? value.school_review_id : null,
    templateKey: value.template_key,
    status: value.status,
    attemptCount: value.attempt_count,
    maxAttempts: value.max_attempts,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return isRecord(error) && error.code === "23505";
}

export async function createTransactionalEmailJob(
  admin: EmailAdminClient,
  input: {
    leadId?: string | null;
    schoolReviewId?: string | null;
    templateKey: TransactionalTemplateKey;
    idempotencyKey: string;
    scheduledFor?: string;
  },
): Promise<{ job: TransactionalEmailJob; created: boolean }> {
  const scheduledFor = input.scheduledFor ?? new Date().toISOString();
  const { data, error } = await admin
    .from("email_jobs")
    .insert({
      job_type: "transactional",
      template_key: input.templateKey,
      idempotency_key: input.idempotencyKey,
      lead_id: input.leadId ?? null,
      ...(input.schoolReviewId ? { school_review_id: input.schoolReviewId } : {}),
      status: "pending",
      scheduled_for: scheduledFor,
      enrollment_id: null,
      sequence_step_id: null,
    })
    .select(EMAIL_JOB_SELECT)
    .single();

  const insertedJob = mapTransactionalJob(data);
  if (!error && insertedJob) return { job: insertedJob, created: true };

  if (!isUniqueViolation(error)) throw new EmailJobPersistenceError();

  const { data: duplicate, error: duplicateError } = await admin
    .from("email_jobs")
    .select(EMAIL_JOB_SELECT)
    .eq("template_key", input.templateKey)
    .eq("idempotency_key", input.idempotencyKey)
    .eq("job_type", "transactional")
    .maybeSingle();
  const existingJob = mapTransactionalJob(duplicate);

  if (
    duplicateError || !existingJob || existingJob.leadId !== (input.leadId ?? null)
    || (existingJob.schoolReviewId ?? null) !== (input.schoolReviewId ?? null)
  ) {
    throw new EmailJobPersistenceError();
  }

  return { job: existingJob, created: false };
}

export async function claimTransactionalEmailJob(
  admin: EmailAdminClient,
  job: TransactionalEmailJob,
  workerId: string,
  now = new Date().toISOString(),
): Promise<TransactionalEmailJob | null> {
  if (job.status !== "pending" || job.attemptCount >= job.maxAttempts) return null;

  const { data, error } = await admin
    .from("email_jobs")
    .update({
      status: "processing",
      attempt_count: job.attemptCount + 1,
      locked_at: now,
      locked_by: workerId,
    })
    .eq("id", job.id)
    .eq("status", "pending")
    .select(EMAIL_JOB_SELECT)
    .maybeSingle();

  if (error) throw new EmailJobPersistenceError();
  return mapTransactionalJob(data);
}

export async function markTransactionalEmailJobSent(
  admin: EmailAdminClient,
  jobId: string,
  now = new Date().toISOString(),
): Promise<void> {
  const { error } = await admin
    .from("email_jobs")
    .update({ status: "sent", sent_at: now, locked_at: null, locked_by: null })
    .eq("id", jobId)
    .eq("status", "processing");

  if (error) throw new EmailJobPersistenceError();
}

export async function releaseTransactionalEmailJobAfterFailure(
  admin: EmailAdminClient,
  job: TransactionalEmailJob,
  now = new Date().toISOString(),
  errorCode = "email_provider_send_failed",
): Promise<void> {
  const exhausted = job.attemptCount >= job.maxAttempts;
  const { error } = await admin
    .from("email_jobs")
    .update({
      status: exhausted ? "failed" : "pending",
      locked_at: null,
      locked_by: null,
      last_error: errorCode,
      ...(exhausted ? { failed_at: now } : {}),
    })
    .eq("id", job.id)
    .eq("status", "processing");

  if (error) throw new EmailJobPersistenceError();
}

export async function cancelTransactionalEmailJob(
  admin: EmailAdminClient,
  jobId: string,
  now = new Date().toISOString(),
): Promise<void> {
  const { error } = await admin
    .from("email_jobs")
    .update({ status: "cancelled", cancelled_at: now, locked_at: null, locked_by: null })
    .eq("id", jobId)
    .eq("status", "pending");

  if (error) throw new EmailJobPersistenceError();
}
