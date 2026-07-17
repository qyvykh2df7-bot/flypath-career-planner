import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("client-only", () => ({}));
vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: mocks.createSupabaseBrowserClient,
}));

import { normalizeFlyPathOtpEmail, requestFlyPathLoginOtp } from "./otp";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createSupabaseBrowserClient.mockReturnValue({
    auth: { signInWithOtp: mocks.signInWithOtp },
  });
  mocks.signInWithOtp.mockResolvedValue({ error: null });
});

describe("FlyPath OTP request", () => {
  it("normaliza un email válido antes de solicitar el código", async () => {
    await expect(requestFlyPathLoginOtp("  PILOT@EXAMPLE.COM ")).resolves.toEqual({
      ok: true,
      email: "pilot@example.com",
    });
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "pilot@example.com",
      options: { shouldCreateUser: true },
    });
  });

  it("rechaza un email inválido sin solicitar un OTP", async () => {
    await expect(requestFlyPathLoginOtp("no-es-un-email")).resolves.toEqual({
      ok: false,
      reason: "invalid_email",
    });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("rechaza emails excesivamente largos", () => {
    expect(normalizeFlyPathOtpEmail(`${"a".repeat(310)}@example.com`)).toBeNull();
  });

  it("devuelve un error genérico cuando Supabase no puede enviar el OTP", async () => {
    mocks.signInWithOtp.mockResolvedValue({ error: new Error("Provider unavailable") });

    await expect(requestFlyPathLoginOtp("pilot@example.com")).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("no filtra excepciones de Supabase al cliente", async () => {
    mocks.signInWithOtp.mockRejectedValue(new Error("Unexpected provider detail"));

    await expect(requestFlyPathLoginOtp("pilot@example.com")).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});
