import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  applyResendWebhookEvent,
  isAllowedResendEmailWebhookEvent,
  isProcessableResendWebhookEvent,
  parseVerifiedResendWebhookEvent,
  ResendWebhookPayloadError,
  verifyResendWebhook,
} from "./resend-webhooks";

const PROVIDER_EVENT_ID = "msg_9bbd20b9-6c76-4d66-96de-87f5a20a9ea3";
const PROVIDER_MESSAGE_ID = "8bd6fe63-f8a0-4b43-9c29-2c8335436d1f";
const OCCURRED_AT = "2026-07-12T10:00:00.000Z";

function createPayload(type = "email.delivered") {
  return {
    type,
    created_at: OCCURRED_AT,
    data: {
      email_id: PROVIDER_MESSAGE_ID,
      to: ["pilot@example.com"],
      subject: "Nunca se persiste",
      click: { link: "https://flypath.es/private?token=never-persist" },
    },
  };
}

describe("Resend webhook verification", () => {
  it("passes the exact raw body and Svix headers to the official verifier", () => {
    const payload = JSON.stringify(createPayload());
    const verify = vi.fn(() => createPayload());

    const event = verifyResendWebhook(
      {
        payload,
        headers: { id: PROVIDER_EVENT_ID, timestamp: "1720778400", signature: "v1,test" },
        webhookSecret: "whsec_test",
      },
      { webhooks: { verify } },
    );

    expect(verify).toHaveBeenCalledWith({
      payload,
      headers: { id: PROVIDER_EVENT_ID, timestamp: "1720778400", signature: "v1,test" },
      webhookSecret: "whsec_test",
    });
    expect(event).toEqual({
      type: "email.delivered",
      providerEventId: PROVIDER_EVENT_ID,
      providerMessageId: PROVIDER_MESSAGE_ID,
      occurredAt: OCCURRED_AT,
    });
  });

  it("rejects malformed verified payloads and uses a closed event catalog", () => {
    expect(() => parseVerifiedResendWebhookEvent({ type: "email.delivered" }, PROVIDER_EVENT_ID)).toThrow(
      ResendWebhookPayloadError,
    );
    expect(isAllowedResendEmailWebhookEvent("email.delivered")).toBe(true);
    expect(isAllowedResendEmailWebhookEvent("email.scheduled")).toBe(false);

    const ignored = parseVerifiedResendWebhookEvent(
      { type: "contact.created", created_at: OCCURRED_AT, data: { id: "contact-id" } },
      PROVIDER_EVENT_ID,
    );
    expect(ignored).toMatchObject({ type: "contact.created", providerMessageId: null, occurredAt: null });
    expect(isProcessableResendWebhookEvent(ignored)).toBe(false);
  });
});

describe("Resend webhook persistence boundary", () => {
  it("uses the atomic RPC with only technical identifiers and no clicked URL", async () => {
    const single = vi.fn().mockResolvedValue({ data: { result: "processed" }, error: null });
    const rpc = vi.fn(() => ({ single }));
    const event = parseVerifiedResendWebhookEvent(createPayload("email.clicked"), PROVIDER_EVENT_ID);
    if (!isProcessableResendWebhookEvent(event)) throw new Error("expected processable event");

    await expect(applyResendWebhookEvent({ rpc } as never, event)).resolves.toBe("processed");

    expect(rpc).toHaveBeenCalledWith("apply_resend_email_webhook_event", {
      p_provider: "resend",
      p_provider_event_id: PROVIDER_EVENT_ID,
      p_event_type: "email.clicked",
      p_provider_message_id: PROVIDER_MESSAGE_ID,
      p_occurred_at: OCCURRED_AT,
    });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("never-persist");
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("pilot@example.com");
  });

  it("does not invoke persistence for unsupported verified event types", async () => {
    const rpc = vi.fn();
    await expect(
      applyResendWebhookEvent(
        { rpc } as never,
        {
          type: "email.scheduled",
          providerEventId: PROVIDER_EVENT_ID,
          providerMessageId: PROVIDER_MESSAGE_ID,
          occurredAt: OCCURRED_AT,
        } as never,
      ),
    ).rejects.toThrow(ResendWebhookPayloadError);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("Resend webhook migration contract", () => {
  it("includes webhook route tests alongside the existing library tests", () => {
    const vitestConfig = fs.readFileSync(path.join(process.cwd(), "vitest.config.ts"), "utf8");

    expect(vitestConfig).toContain('"lib/**/*.test.ts"');
    expect(vitestConfig).toContain('"app/**/*.test.ts"');
  });

  it("keeps webhook idempotency, RLS, and the RPC limited to service_role", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712080000_add_resend_webhook_events.sql"),
      "utf8",
    );

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.email_webhook_events");
    expect(migration).toContain("UNIQUE (provider, provider_event_id)");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.email_webhook_events FROM anon");
    expect(migration).toContain("REVOKE ALL ON TABLE public.email_webhook_events FROM authenticated");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("ON CONFLICT (provider, provider_event_id) DO NOTHING");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.apply_resend_email_webhook_event");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("FROM PUBLIC");
    expect(migration).toContain("FROM anon");
    expect(migration).toContain("FROM authenticated");
  });

  it("keeps delivery transitions monotonic and analytics fields privacy-safe", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712080000_add_resend_webhook_events.sql"),
      "utf8",
    );

    expect(migration).toContain("WHEN 'email.delivered'");
    expect(migration).toContain("target_delivery.status NOT IN ('delivered', 'bounced', 'failed')");
    expect(migration).toContain("WHEN 'email.opened'");
    expect(migration).toContain("first_opened_at = CASE");
    expect(migration).toContain("WHEN target_delivery.first_opened_at IS NULL THEN p_occurred_at");
    expect(migration).toContain("ELSE LEAST(target_delivery.first_opened_at, p_occurred_at)");
    expect(migration).toContain("last_opened_at = CASE");
    expect(migration).toContain("WHEN target_delivery.last_opened_at IS NULL THEN p_occurred_at");
    expect(migration).toContain("ELSE GREATEST(target_delivery.last_opened_at, p_occurred_at)");
    expect(migration).toContain("open_count = target_delivery.open_count + 1");
    expect(migration).toContain("WHEN 'email.clicked'");
    expect(migration).toContain("first_clicked_at = CASE");
    expect(migration).toContain("WHEN target_delivery.first_clicked_at IS NULL THEN p_occurred_at");
    expect(migration).toContain("ELSE LEAST(target_delivery.first_clicked_at, p_occurred_at)");
    expect(migration).toContain("last_clicked_at = CASE");
    expect(migration).toContain("WHEN target_delivery.last_clicked_at IS NULL THEN p_occurred_at");
    expect(migration).toContain("ELSE GREATEST(target_delivery.last_clicked_at, p_occurred_at)");
    expect(migration).toContain("click_count = target_delivery.click_count + 1");
    expect(migration).toContain("WHEN 'email.complained'");
    expect(migration).toContain("WHEN 'email.suppressed'");
    expect(migration).not.toContain("recipient_email");
    expect(migration).not.toContain("provider_response");
    expect(migration).not.toContain("user_agent");
    expect(migration).not.toContain("ip_address");
    expect(migration).not.toContain("click.link");
  });

  it("deduplicates before any counter update", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712080000_add_resend_webhook_events.sql"),
      "utf8",
    );
    const uniqueInsert = migration.indexOf("ON CONFLICT (provider, provider_event_id) DO NOTHING");
    const duplicateReturn = migration.indexOf("RETURN QUERY SELECT 'duplicate'::text");
    const openedUpdate = migration.indexOf("WHEN 'email.opened'");
    const clickedUpdate = migration.indexOf("WHEN 'email.clicked'");

    expect(uniqueInsert).toBeGreaterThan(-1);
    expect(duplicateReturn).toBeGreaterThan(uniqueInsert);
    expect(openedUpdate).toBeGreaterThan(duplicateReturn);
    expect(clickedUpdate).toBeGreaterThan(duplicateReturn);
  });
});
