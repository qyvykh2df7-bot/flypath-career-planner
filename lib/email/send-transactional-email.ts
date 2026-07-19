import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { getEmailConfiguration, getInternalAlertEmail } from "./config";
import {
  createPendingEmailDelivery,
  markEmailDeliveryAccepted,
  markEmailDeliveryFailed,
  preserveEmailDeliveryProviderAcceptance,
} from "./deliveries";
import {
  cancelTransactionalEmailJob,
  claimTransactionalEmailJob,
  createTransactionalEmailJob,
  markTransactionalEmailJobSent,
  releaseTransactionalEmailJobAfterFailure,
  type TransactionalEmailJob,
} from "./jobs";
import { getResendEmailProvider, type TransactionalEmailProvider } from "./provider";
import {
  getTransactionalEmailTemplate,
  type TransactionalEmailTemplate,
  type TransactionalTemplateKey,
} from "./templates";
import { SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY } from "./templates/school-review-verification";
import {
  getMentorshipInternalAlertTemplate,
  type MentorshipInternalAlertTemplateInput,
} from "./templates/mentorship-internal-alert";
import { getSchoolReviewVerificationTemplate } from "./templates/school-review-verification";

const TRANSACTIONAL_EMAIL_WORKER = "lead_capture_request";

export type TransactionalEmailDispatchResult = "sent" | "pending" | "cancelled" | "not_claimed";

export class TransactionalEmailDataError extends Error {
  constructor() {
    super("Transactional email data is unavailable");
    this.name = "TransactionalEmailDataError";
  }
}

type EmailAdminClient = ReturnType<typeof getSupabaseAdmin>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function getLeadRecipient(
  admin: EmailAdminClient,
  leadId: string,
): Promise<string | null> {
  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("email")
    .eq("id", leadId)
    .maybeSingle();

  if (
    leadError ||
    !isRecord(lead) ||
    typeof lead.email !== "string" ||
    !lead.email.trim()
  ) {
    throw new TransactionalEmailDataError();
  }

  const { data: technicalSuppression, error: subscriptionError } = await admin
    .from("email_subscriptions")
    .select("status")
    .eq("lead_id", leadId)
    .in("status", ["bounced", "complained", "blocked"])
    .limit(1)
    .maybeSingle();

  if (subscriptionError) throw new TransactionalEmailDataError();
  return technicalSuppression ? null : lead.email;
}

export async function queueSchoolReviewVerification(
  admin: EmailAdminClient,
  input: {
    reviewId: string;
    idempotencyKey: string;
    recipientEmail: string;
    verificationLink: string;
    expiresAt: string;
  },
): Promise<TransactionalEmailDispatchResult> {
  const template = getSchoolReviewVerificationTemplate({
    verificationLink: input.verificationLink,
    expiresAt: input.expiresAt,
  });
  const { job } = await createTransactionalEmailJob(admin, {
    schoolReviewId: input.reviewId,
    templateKey: SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY,
    idempotencyKey: input.idempotencyKey,
  });
  return sendTransactionalEmail(admin, job, { template, recipientEmail: input.recipientEmail });
}

export async function queueCareerPlannerConfirmation(
  admin: EmailAdminClient,
  input: { leadId: string; idempotencyKey: string },
): Promise<TransactionalEmailDispatchResult> {
  return queueTransactionalTemplate(admin, "career_planner_confirmation", input);
}

export async function queuePrepplWaitlistConfirmation(
  admin: EmailAdminClient,
  input: { leadId: string; idempotencyKey: string },
): Promise<TransactionalEmailDispatchResult> {
  return queueTransactionalTemplate(admin, "preppl_waitlist_confirmation", input);
}

export async function queueMentorshipRequestConfirmation(
  admin: EmailAdminClient,
  input: { leadId: string; idempotencyKey: string },
): Promise<TransactionalEmailDispatchResult> {
  return queueTransactionalTemplate(admin, "mentorship_request_confirmation", input);
}

export async function queueMentorshipInternalAlert(
  admin: EmailAdminClient,
  input: {
    leadId: string;
    idempotencyKey: string;
    templateInput: MentorshipInternalAlertTemplateInput;
  },
): Promise<TransactionalEmailDispatchResult> {
  const template = getMentorshipInternalAlertTemplate(input.templateInput);
  return queueTransactionalTemplate(admin, template.key as TransactionalTemplateKey, input, {
    template,
    recipientEmail: getInternalAlertEmail(),
  });
}

async function queueTransactionalTemplate(
  admin: EmailAdminClient,
  templateKey: TransactionalTemplateKey,
  input: { leadId: string; idempotencyKey: string },
  options: { template?: TransactionalEmailTemplate; recipientEmail?: string } = {},
): Promise<TransactionalEmailDispatchResult> {
  const { job } = await createTransactionalEmailJob(admin, {
    leadId: input.leadId,
    templateKey,
    idempotencyKey: input.idempotencyKey,
  });

  return sendTransactionalEmail(admin, job, options);
}

export async function sendTransactionalEmail(
  admin: EmailAdminClient,
  job: TransactionalEmailJob,
  options: {
    provider?: TransactionalEmailProvider;
    now?: () => string;
    template?: TransactionalEmailTemplate;
    recipientEmail?: string;
  } = {},
): Promise<TransactionalEmailDispatchResult> {
  const now = options.now ?? (() => new Date().toISOString());
  if (job.status !== "pending") return "not_claimed";

  const template = options.template ?? getTransactionalEmailTemplate(job.templateKey);
  const recipientEmail =
    template.recipient.kind === "internal"
      ? options.recipientEmail ?? null
      : options.recipientEmail ?? (job.leadId ? await getLeadRecipient(admin, job.leadId) : null);

  if (!recipientEmail) {
    if (job.status === "pending") await cancelTransactionalEmailJob(admin, job.id, now());
    return "cancelled";
  }

  // Validar la configuración antes de tomar el lock evita dejar un job en processing
  // cuando el entorno aún no tiene proveedor configurado.
  const configuration = getEmailConfiguration();
  const claimedJob = await claimTransactionalEmailJob(admin, job, TRANSACTIONAL_EMAIL_WORKER, now());
  if (!claimedJob) return "not_claimed";

  let deliveryId: string;
  try {
    deliveryId = await createPendingEmailDelivery(admin, {
      jobId: claimedJob.id,
      attemptNumber: claimedJob.attemptCount,
      recipientEmail,
      subject: template.subject,
      fromEmail: configuration.from,
      attemptedAt: now(),
    });
  } catch (error) {
    await releaseTransactionalEmailJobAfterFailure(
      admin,
      claimedJob,
      now(),
      "email_delivery_persistence_failed",
    );
    throw error;
  }

  const provider = options.provider ?? getResendEmailProvider();

  let providerMessageId: string;
  try {
    ({ providerMessageId } = await provider.send({
      to: recipientEmail,
      from: configuration.from,
      replyTo: configuration.replyTo,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }));
  } catch {
    try {
      await markEmailDeliveryFailed(admin, deliveryId, now());
    } finally {
      await releaseTransactionalEmailJobAfterFailure(admin, claimedJob, now());
    }
    return "pending";
  }

  try {
    await markEmailDeliveryAccepted(admin, deliveryId, providerMessageId, now());
  } catch {
    try {
      await preserveEmailDeliveryProviderAcceptance(admin, deliveryId, providerMessageId);
    } catch {
      // La recuperación de metadata del proveedor es opcional y no expone detalles.
    }

    await releaseTransactionalEmailJobAfterFailure(
      admin,
      claimedJob,
      now(),
      "email_delivery_acceptance_persistence_failed",
    );
    return "pending";
  }

  await markTransactionalEmailJobSent(admin, claimedJob.id, now());
  return "sent";
}
