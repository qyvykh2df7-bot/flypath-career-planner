import fs from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createOpaqueUnsubscribeToken,
  createUnsubscribeLink,
  hashUnsubscribeToken,
  isOpaqueUnsubscribeToken,
  unsubscribeByOpaqueToken,
} from "./unsubscribe";

function createAdmin(data: unknown = { result: "processed" }) {
  const revoke = {
    eq: vi.fn(() => ({
      is: vi.fn(() => ({
        is: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  };
  const insert = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({ data, error: null });

  return {
    admin: {
      from: vi.fn(() => ({
        update: vi.fn(() => revoke),
        insert,
      })),
      rpc: vi.fn(() => ({ single })),
    },
    revoke,
    insert,
    single,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("secure email unsubscribe tokens", () => {
  it("generates an opaque random token backed by at least 32 bytes", () => {
    const token = createOpaqueUnsubscribeToken();

    expect(token).toHaveLength(43);
    expect(isOpaqueUnsubscribeToken(token)).toBe(true);
    expect(isOpaqueUnsubscribeToken("short")).toBe(false);
    expect(hashUnsubscribeToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("stores only the token hash and revokes prior active tokens before creating a new link", async () => {
    const { admin, revoke, insert } = createAdmin();

    const link = await createUnsubscribeLink(admin as never, {
      subscriptionId: "subscription-id",
      publicOrigin: "https://flypath.es/path-is-ignored",
      now: "2026-07-13T10:00:00.000Z",
    });
    const token = new URL(link).searchParams.get("token");
    const insertedPayload = insert.mock.calls[0]?.[0] as { token_hash?: string };

    expect(link).toMatch(/^https:\/\/flypath\.es\/email\/unsubscribe\?token=/);
    expect(token).not.toBeNull();
    expect(insertedPayload.token_hash).toBe(hashUnsubscribeToken(token!));
    expect(JSON.stringify(insert.mock.calls)).not.toContain(token!);
    expect(revoke.eq).toHaveBeenCalledWith("subscription_id", "subscription-id");
  });

  it.each(["processed", "already_unsubscribed", "invalid"] as const)(
    "accepts the closed RPC result %s only when it is returned as an object",
    async (result) => {
      const { admin } = createAdmin({ result });
      const token = createOpaqueUnsubscribeToken();

      await expect(unsubscribeByOpaqueToken(admin as never, token)).resolves.toBe(result);
      expect(admin.rpc).toHaveBeenCalledWith("unsubscribe_email_subscription_by_token_hash", {
        p_token_hash: hashUnsubscribeToken(token),
      });
    },
  );

  it("rejects scalar or malformed RPC data instead of trusting a transport shape", async () => {
    const token = createOpaqueUnsubscribeToken();

    await expect(unsubscribeByOpaqueToken(createAdmin("processed").admin as never, token)).rejects.toThrow(
      "Unable to update email preference",
    );
    await expect(unsubscribeByOpaqueToken(createAdmin({}).admin as never, token)).rejects.toThrow(
      "Unable to update email preference",
    );
    await expect(
      unsubscribeByOpaqueToken(createAdmin({ result: "unexpected" }).admin as never, token),
    ).rejects.toThrow("Unable to update email preference");
  });

  it("rejects malformed tokens without calling the database", async () => {
    const { admin } = createAdmin();

    await expect(unsubscribeByOpaqueToken(admin as never, "email=pilot@example.com")).resolves.toBe("invalid");
    expect(admin.rpc).not.toHaveBeenCalled();
  });

  it("keeps GET presentation-only and never logs opaque tokens", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "app/email/unsubscribe/page.tsx"),
      "utf8",
    );
    const route = fs.readFileSync(
      path.join(process.cwd(), "app/api/email/unsubscribe/route.ts"),
      "utf8",
    );

    expect(page).not.toContain("getSupabaseAdmin");
    expect(page).not.toContain("unsubscribeByOpaqueToken");
    expect(route).toContain("export async function POST");
    expect(route).not.toContain("console.");
  });
});

describe("email subscription history migration", () => {
  it("creates private append-only history, private hashed tokens, and a service-role-only RPC", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712090000_add_email_subscription_consent_history.sql"),
      "utf8",
    );

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.email_subscription_events");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens");
    expect(migration).toContain("token_hash ~ '^[0-9a-f]{64}$'");
    expect(migration).toContain("'subscribed'");
    expect(migration).toContain("'resubscribed'");
    expect(migration).toContain("'unsubscribed'");
    expect(migration).toContain("'bounced'");
    expect(migration).toContain("'complained'");
    expect(migration).toContain("'blocked'");
    expect(migration).toContain("REVOKE UPDATE, DELETE ON TABLE public.email_subscription_events FROM service_role");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain("RETURNS TABLE (result text)");
    expect(migration).toContain("RETURN QUERY SELECT 'processed'::text");
    expect(migration).toContain("RETURN QUERY SELECT 'already_unsubscribed'::text");
    expect(migration).toContain("RETURN QUERY SELECT 'invalid'::text");
    expect(migration).toContain("unsubscribe_email_subscription_by_token_hash");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.unsubscribe_email_subscription_by_token_hash(text) TO service_role");
    expect(migration).toContain("FROM PUBLIC");
    expect(migration).not.toContain("user_agent");
    expect(migration).not.toContain("ip_address");
  });
});
