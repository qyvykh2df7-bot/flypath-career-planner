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
  "lib/email/templates/index.ts",
  "lib/email/templates/career-planner-confirmation.ts",
  "lib/email/templates/preppl-waitlist-confirmation.ts",
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
});
