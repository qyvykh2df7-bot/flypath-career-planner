import { getResendWebhookSecret } from "@/lib/email/config";
import {
  applyResendWebhookEvent,
  isProcessableResendWebhookEvent,
  verifyResendWebhook,
  type ResendWebhookHeaders,
} from "@/lib/email/resend-webhooks";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const INVALID_WEBHOOK_MESSAGE = "Solicitud de webhook inválida.";
const UNAVAILABLE_WEBHOOK_MESSAGE = "Webhook no disponible.";

function getSvixHeaders(request: Request): ResendWebhookHeaders | null {
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) return null;
  return { id, timestamp, signature };
}

export async function POST(request: Request) {
  let webhookSecret: string;
  try {
    webhookSecret = getResendWebhookSecret();
  } catch {
    return Response.json({ error: UNAVAILABLE_WEBHOOK_MESSAGE }, { status: 500 });
  }

  const headers = getSvixHeaders(request);
  if (!headers) {
    return Response.json({ error: INVALID_WEBHOOK_MESSAGE }, { status: 400 });
  }

  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return Response.json({ error: INVALID_WEBHOOK_MESSAGE }, { status: 400 });
  }

  let event;
  try {
    event = verifyResendWebhook({ payload, headers, webhookSecret });
  } catch {
    return Response.json({ error: INVALID_WEBHOOK_MESSAGE }, { status: 400 });
  }

  if (!isProcessableResendWebhookEvent(event)) {
    return Response.json({ ok: true, ignored: true }, { status: 200 });
  }

  try {
    await applyResendWebhookEvent(getSupabaseAdmin(), event);
    return Response.json({ ok: true }, { status: 200 });
  } catch {
    console.error("[FlyPath] Resend webhook processing failed.");
    return Response.json({ error: UNAVAILABLE_WEBHOOK_MESSAGE }, { status: 500 });
  }
}
