import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { getEmailConfiguration } from "./config";
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
import { getTransactionalEmailTemplate } from "./templates";

const CAREER_PLANNER_EMAIL_WORKER = "career_planner_request";

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

async function getRecipientAndSubscription(
  admin: EmailAdminClient,
  leadId: string,
  listKey: string,
): Promise<{ recipientEmail: string; subscriptionStatus: string | null }> {
  const [{ data: lead, error: leadError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      admin.from("leads").select("email").eq("id", leadId).maybeSingle(),
      admin
        .from("email_subscriptions")
        .select("status")
        .eq("lead_id", leadId)
        .eq("list_key", listKey)
        .maybeSingle(),
    ]);

  if (
    leadError ||
    subscriptionError ||
    !isRecord(lead) ||
    typeof lead.email !== "string" ||
    !lead.email.trim()
  ) {
    throw new TransactionalEmailDataError();
  }

  return {
    recipientEmail: lead.email,
    subscriptionStatus: isRecord(subscription) && typeof subscription.status === "string"
      ? subscription.status
      : null,
  };
}

export async function queueCareerPlannerConfirmation(
  admin: EmailAdminClient,
  input: { leadId: string; idempotencyKey: string },
): Promise<TransactionalEmailDispatchResult> {
  const template = getTransactionalEmailTemplate("career_planner_confirmation");
  const { job } = await createTransactionalEmailJob(admin, {
    leadId: input.leadId,
    templateKey: template.key,
    idempotencyKey: input.idempotencyKey,
  });

  return sendTransactionalEmail(admin, job);
}

export async function sendTransactionalEmail(
  admin: EmailAdminClient,
  job: TransactionalEmailJob,
  options: { provider?: TransactionalEmailProvider; now?: () => string } = {},
): Promise<TransactionalEmailDispatchResult> {
  const now = options.now ?? (() => new Date().toISOString());
  if (job.status !== "pending") return "not_claimed";

  const template = getTransactionalEmailTemplate(job.templateKey);
  const recipient = await getRecipientAndSubscription(admin, job.leadId, template.subscriptionListKey);

  if (recipient.subscriptionStatus !== "subscribed") {
    if (job.status === "pending") await cancelTransactionalEmailJob(admin, job.id, now());
    return "cancelled";
  }

  // Validar la configuración antes de tomar el lock evita dejar un job en processing
  // cuando el entorno aún no tiene proveedor configurado.
  const configuration = getEmailConfiguration();
  const claimedJob = await claimTransactionalEmailJob(admin, job, CAREER_PLANNER_EMAIL_WORKER, now());
  if (!claimedJob) return "not_claimed";

  let deliveryId: string;
  try {
    deliveryId = await createPendingEmailDelivery(admin, {
      jobId: claimedJob.id,
      attemptNumber: claimedJob.attemptCount,
      recipientEmail: recipient.recipientEmail,
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
      to: recipient.recipientEmail,
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
