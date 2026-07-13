import "server-only";

import type { getSupabaseAdmin } from "@/lib/supabase/admin";

export const EMAIL_DELIVERY_SELECT = "id";

export class EmailDeliveryPersistenceError extends Error {
  constructor() {
    super("Email delivery persistence failed");
    this.name = "EmailDeliveryPersistenceError";
  }
}

type DeliveryAdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function createPendingEmailDelivery(
  admin: DeliveryAdminClient,
  input: {
    jobId: string;
    attemptNumber: number;
    recipientEmail: string;
    subject: string;
    fromEmail: string;
    attemptedAt?: string;
  },
): Promise<string> {
  const { data, error } = await admin
    .from("email_deliveries")
    .insert({
      job_id: input.jobId,
      attempt_number: input.attemptNumber,
      provider: "resend",
      status: "pending",
      recipient_email: input.recipientEmail,
      subject: input.subject,
      from_email: input.fromEmail,
      attempted_at: input.attemptedAt ?? new Date().toISOString(),
    })
    .select(EMAIL_DELIVERY_SELECT)
    .single();

  if (error || !data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string") {
    throw new EmailDeliveryPersistenceError();
  }

  return data.id;
}

export async function markEmailDeliveryAccepted(
  admin: DeliveryAdminClient,
  deliveryId: string,
  providerMessageId: string,
  now = new Date().toISOString(),
): Promise<void> {
  const { error } = await admin
    .from("email_deliveries")
    .update({
      status: "accepted",
      provider_message_id: providerMessageId,
      provider_response: { message_id: providerMessageId },
      accepted_at: now,
    })
    .eq("id", deliveryId);

  if (error) throw new EmailDeliveryPersistenceError();
}

export async function preserveEmailDeliveryProviderAcceptance(
  admin: DeliveryAdminClient,
  deliveryId: string,
  providerMessageId: string,
): Promise<void> {
  const { error } = await admin
    .from("email_deliveries")
    .update({
      provider_message_id: providerMessageId,
      provider_response: { message_id: providerMessageId },
      error_code: "delivery_acceptance_persistence_failed",
      error_message: "No se pudo confirmar localmente la aceptación del proveedor.",
    })
    .eq("id", deliveryId);

  if (error) throw new EmailDeliveryPersistenceError();
}

export async function markEmailDeliveryFailed(
  admin: DeliveryAdminClient,
  deliveryId: string,
  now = new Date().toISOString(),
): Promise<void> {
  const { error } = await admin
    .from("email_deliveries")
    .update({
      status: "failed",
      error_code: "provider_send_failed",
      error_message: "El proveedor de email no aceptó el envío.",
      provider_response: null,
      failed_at: now,
    })
    .eq("id", deliveryId);

  if (error) throw new EmailDeliveryPersistenceError();
}
