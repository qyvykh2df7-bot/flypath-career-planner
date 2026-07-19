import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "components/opiniones/OpinionesInteractiveContent.tsx"), "utf8");

describe("OpinionesInteractiveContent submission contract", () => {
  it("uses the account email without rendering an email field for a confirmed session", () => {
    expect(source).toContain("authenticatedEmail ? (");
    expect(source).toContain("...(authenticatedEmail ? {} : { email })");
  });

  it("submits once with a stable idempotency id while pending and exposes resend state", () => {
    expect(source).toContain("const requestId = submissionId ?? crypto.randomUUID()");
    expect(source).toContain('fetch("/api/school-reviews"');
    expect(source).toContain('fetch("/api/school-reviews/resend"');
    expect(source).toContain('formStatus === "submitting"');
  });

  it("does not keep the old simulated-success copy", () => {
    expect(source).not.toContain("La recogida real de opiniones se activará próximamente.");
  });
});
