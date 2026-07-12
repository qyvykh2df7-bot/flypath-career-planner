import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { EmailConfigurationError, getEmailConfiguration } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("email configuration", () => {
  it("requires a Resend key and a valid sender without exposing their values", () => {
    expect(() => getEmailConfiguration({})).toThrow(EmailConfigurationError);
    expect(() =>
      getEmailConfiguration({ RESEND_API_KEY: "key", EMAIL_FROM: "not-an-email" }),
    ).toThrow(EmailConfigurationError);

    expect(
      getEmailConfiguration({
        RESEND_API_KEY: "re_test_secret",
        EMAIL_FROM: "FlyPath <operaciones@flypath.es>",
      }),
    ).toEqual({
      apiKey: "re_test_secret",
      from: "FlyPath <operaciones@flypath.es>",
      replyTo: "info@flypath.es",
    });
  });
});
