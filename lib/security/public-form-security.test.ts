import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const dependencies = vi.hoisted(() => ({
  rpc: vi.fn(),
  sameOrigin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdmin: () => ({ rpc: dependencies.rpc }),
}));
vi.mock("@/lib/tracking/server", () => ({ isSameOriginRequest: dependencies.sameOrigin }));

import {
  authorizePublicFormSubmission,
  getTrustedPublicFormIp,
  PublicFormSecurityError,
  validatePublicFormProof,
} from "./public-form-security";

const salt = "public-form-security-test-salt-that-is-long-enough";
const request = new Request("https://flypath.test/api/leads/home-newsletter", {
  method: "POST",
  headers: { "x-vercel-forwarded-for": "203.0.113.10" },
});

describe("public form distributed security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.sameOrigin.mockReturnValue(true);
    dependencies.rpc.mockResolvedValue({ data: [{ allowed: true, retry_after_seconds: 0 }], error: null });
  });

  it("uses only the Vercel-provided address in production", () => {
    expect(getTrustedPublicFormIp(request, { VERCEL: "1", NODE_ENV: "production" })).toBe("203.0.113.10");
    expect(getTrustedPublicFormIp(new Request("https://flypath.test", { headers: { "x-forwarded-for": "198.51.100.7" } }), {
      NODE_ENV: "production",
    })).toBeNull();
  });

  it("consumes separate HMAC-only IP and email quotas", async () => {
    await authorizePublicFormSubmission(request, {
      ipScope: "newsletter_ip",
      identityScope: "newsletter_email",
      identitySubject: "email:pilot@example.com",
      environment: { VERCEL: "1", NODE_ENV: "production", PUBLIC_FORM_RATE_LIMIT_SALT: salt },
    });
    expect(dependencies.rpc).toHaveBeenCalledTimes(2);
    for (const [, args] of dependencies.rpc.mock.calls) {
      expect(args.p_subject_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(args.p_subject_hash).not.toContain("pilot@example.com");
    }
  });

  it("fails closed when infrastructure is unavailable or a quota is exhausted", async () => {
    dependencies.rpc.mockResolvedValueOnce({ data: null, error: { message: "unavailable" } });
    await expect(authorizePublicFormSubmission(request, {
      ipScope: "newsletter_ip", identityScope: "newsletter_email", identitySubject: "email:pilot@example.com",
      environment: { VERCEL: "1", NODE_ENV: "production", PUBLIC_FORM_RATE_LIMIT_SALT: salt },
    })).rejects.toMatchObject({ kind: "unavailable" });

    dependencies.rpc.mockResolvedValue({ data: [{ allowed: false, retry_after_seconds: 60 }], error: null });
    await expect(authorizePublicFormSubmission(request, {
      ipScope: "newsletter_ip", identityScope: "newsletter_email", identitySubject: "email:pilot@example.com",
      environment: { VERCEL: "1", NODE_ENV: "production", PUBLIC_FORM_RATE_LIMIT_SALT: salt },
    })).rejects.toBeInstanceOf(PublicFormSecurityError);
  });

  it("rejects honeypots and implausibly fast form submissions before side effects", () => {
    expect(() => validatePublicFormProof(request, { honeypot: "bot", formStartedAt: Date.now() - 2_000 })).toThrow(PublicFormSecurityError);
    expect(() => validatePublicFormProof(request, { honeypot: "", formStartedAt: Date.now() })).toThrow(PublicFormSecurityError);
  });
});
