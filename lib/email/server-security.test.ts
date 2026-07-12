import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const emailFiles = [
  "lib/email/config.ts",
  "lib/email/provider.ts",
  "lib/email/jobs.ts",
  "lib/email/deliveries.ts",
  "lib/email/send-transactional-email.ts",
  "lib/email/resend-webhooks.ts",
  "lib/email/templates/index.ts",
  "lib/email/templates/career-planner-confirmation.ts",
  "lib/email/templates/preppl-waitlist-confirmation.ts",
  "lib/email/templates/mentorship-request-confirmation.ts",
  "lib/email/templates/mentorship-internal-alert.ts",
];

describe("email server security", () => {
  it("keeps provider and database helpers server-only without direct service-role exposure", () => {
    for (const file of emailFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).toContain('import "server-only"');
      expect(source).not.toContain("NEXT_PUBLIC_RESEND");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("keeps the public Career Planner route free of arbitrary provider input", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "app/api/leads/career-planner-report/route.ts"),
      "utf8",
    );

    expect(route).not.toContain("template_key");
    expect(route).not.toContain("body_html");
    expect(route).not.toContain("recipient_email");
  });

  it("keeps the applied transactional-job migration identical to its committed version", () => {
    const migrationPath = "supabase/migrations/20260712050000_extend_email_jobs_for_transactional.sql";
    const migration = fs.readFileSync(path.join(process.cwd(), migrationPath), "utf8");
    const appliedVersion = execFileSync("git", ["show", `aac5ceb:${migrationPath}`], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(migration).toBe(appliedVersion);
    expect(migration).toContain("job_type IN ('sequence', 'transactional')");
    expect(migration).toContain("job_type = 'sequence'");
    expect(migration).toContain("job_type = 'transactional'");
    expect(migration).toContain("template_key IS NOT NULL");
    expect(migration).toContain("idempotency_key IS NOT NULL");
    expect(migration).toContain("enrollment_id IS NULL");
    expect(migration).toContain("sequence_step_id IS NULL");
    expect(migration).toContain("email_jobs_transactional_template_idempotency_unique");
    expect(migration).not.toContain("preppl_waitlist_confirmation");
  });

  it("extends the closed template catalog only in the new Pre-PPL migration", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712050000_extend_email_jobs_for_transactional.sql"),
      "utf8",
    );
    const prepplMigration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712060000_add_preppl_email_template_key.sql"),
      "utf8",
    );

    expect(migration).not.toContain("preppl_waitlist_confirmation");
    expect(prepplMigration).toContain("DROP CONSTRAINT IF EXISTS email_jobs_template_key_check");
    expect(prepplMigration).toContain("career_planner_confirmation");
    expect(prepplMigration).toContain("preppl_waitlist_confirmation");
    expect(prepplMigration).toContain("template_key IS NULL");
    expect(prepplMigration).not.toContain("CHECK (true)");
  });

  it("keeps mentorship template keys in a new closed catalog migration", () => {
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260712070000_add_mentorship_email_template_keys.sql"),
      "utf8",
    );

    expect(migration).toContain("DROP CONSTRAINT IF EXISTS email_jobs_template_key_check");
    expect(migration).toContain("career_planner_confirmation");
    expect(migration).toContain("preppl_waitlist_confirmation");
    expect(migration).toContain("mentorship_request_confirmation");
    expect(migration).toContain("mentorship_internal_alert");
    expect(migration).toContain("template_key IS NULL");
    expect(migration).not.toContain("CHECK (true)");
  });

  it("keeps mentorship request PII out of provider responses and logs", () => {
    const deliveries = fs.readFileSync(path.join(process.cwd(), "lib/email/deliveries.ts"), "utf8");
    const capture = fs.readFileSync(
      path.join(process.cwd(), "lib/leads/capture-mentorship-support.ts"),
      "utf8",
    );

    expect(deliveries).toContain("provider_response: { message_id: providerMessageId }");
    expect(deliveries).not.toContain("fullName");
    expect(deliveries).not.toContain("helpText");
    expect(deliveries).not.toContain("situation");
    expect(deliveries).not.toContain("phone");
    expect(capture).not.toContain("console.error(input");
    expect(capture).not.toContain("console.error(input.");
  });

  it("keeps the Resend webhook route server-only and free of secrets or payload persistence", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "app/api/webhooks/resend/route.ts"),
      "utf8",
    );
    const helper = fs.readFileSync(
      path.join(process.cwd(), "lib/email/resend-webhooks.ts"),
      "utf8",
    );

    expect(route).toContain('export const runtime = "nodejs"');
    expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(route).not.toContain("NEXT_PUBLIC_RESEND");
    expect(helper).toContain('import "server-only"');
    expect(helper).not.toContain("recipient_email");
    expect(helper).not.toContain("provider_response");
  });
});
