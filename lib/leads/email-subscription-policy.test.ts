import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));

import { upsertEmailSubscriptionForLead } from "./capture-shared";

function createAdmin(status: string) {
  const eventInsert = vi.fn().mockResolvedValue({ error: null });
  const subscriptionUpdate = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }));

  return {
    admin: {
      from: vi.fn((table: string) => {
        if (table === "email_subscription_events") return { insert: eventInsert };
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "subscription-id", status }, error: null }),
              })),
            })),
          })),
          update: subscriptionUpdate,
        };
      }),
    },
    eventInsert,
    subscriptionUpdate,
  };
}

describe("email subscription opt-in policy", () => {
  it("resubscribes only after a new explicit action and appends history", async () => {
    const { admin, eventInsert, subscriptionUpdate } = createAdmin("unsubscribed");

    await expect(
      upsertEmailSubscriptionForLead(admin as never, "lead-id", "2026-07-13T10:00:00.000Z", {
        listKey: "preppl",
        source: "preppl",
        consentText: "consent",
      }),
    ).resolves.toBe("subscribed");

    expect(subscriptionUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "subscribed" }));
    expect(eventInsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "resubscribed", consent_text: "consent" }),
    );
  });

  it.each(["bounced", "complained", "blocked"])("never reactivates technical status %s", async (status) => {
    const { admin, eventInsert, subscriptionUpdate } = createAdmin(status);

    await expect(
      upsertEmailSubscriptionForLead(admin as never, "lead-id", "2026-07-13T10:00:00.000Z", {
        listKey: "newsletter",
        source: "home_newsletter",
        consentText: "consent",
      }),
    ).resolves.toBe(status);

    expect(subscriptionUpdate).not.toHaveBeenCalled();
    expect(eventInsert).not.toHaveBeenCalled();
  });
});
