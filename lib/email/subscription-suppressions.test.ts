import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Resend subscription suppression migration", () => {
  it("propagates only reliable suppression events through delivery, job, and lead_id", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712100000_propagate_email_subscription_suppressions.sql"),
      "utf8",
    );

    expect(migration).toContain("FROM public.email_deliveries");
    expect(migration).toContain("WHERE id = target_delivery.job_id");
    expect(migration).toContain("lead_id = target_job.lead_id");
    expect(migration).not.toContain("recipient_email");
    expect(migration).not.toContain("provider_response");
    expect(migration).not.toContain("email.opened' THEN\n      WITH changed_subscriptions");
    expect(migration).not.toContain("email.clicked' THEN\n      WITH changed_subscriptions");
  });

  it("records only real monotonic changes and preserves webhook idempotency", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712100000_propagate_email_subscription_suppressions.sql"),
      "utf8",
    );

    const duplicateInsert = migration.indexOf("ON CONFLICT (provider, provider_event_id) DO NOTHING");
    const duplicateReturn = migration.indexOf("RETURN QUERY SELECT 'duplicate'::text");
    const suppressionBlock = migration.indexOf("IF target_job.lead_id IS NOT NULL THEN");

    expect(duplicateInsert).toBeGreaterThan(-1);
    expect(duplicateReturn).toBeGreaterThan(duplicateInsert);
    expect(suppressionBlock).toBeGreaterThan(duplicateReturn);
    expect(migration).toContain("status NOT IN ('bounced', 'complained', 'blocked')");
    expect(migration).toContain("status NOT IN ('complained', 'blocked')");
    expect(migration).toContain("status <> 'blocked'");
    expect(migration).toContain("'bounced', 'resend_webhook'");
    expect(migration).toContain("'complained', 'resend_webhook'");
    expect(migration).toContain("'blocked', 'resend_webhook'");
    expect(migration).toContain("WITH changed_subscriptions AS");
  });
});
